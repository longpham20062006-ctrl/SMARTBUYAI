import os
import sys
from pathlib import Path
import torch
import numpy as np
from PIL import Image, ImageFilter
import cv2

# Add CatVTON to python path
CATVTON_DIR = Path(__file__).parent / "CatVTON"
sys.path.append(str(CATVTON_DIR))

from model.pipeline import CatVTONPipeline
from model.SCHP import SCHP
from diffusers.image_processor import VaeImageProcessor
from utils import resize_and_crop, resize_and_padding
import rembg

def run_test():
    print("=" * 60)
    print("TESTING REAL CATVTON VIRTUAL TRY-ON ON RTX 3060 CUDA")
    print("=" * 60)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")

    # 1. Load SCHP for human parsing
    schp_path = Path(__file__).parent / "checkpoints/CatVTON/SCHP/exp-schp-201908261155-lip.pth"
    print(f"Loading SCHP Human Parsing from {schp_path}...")
    schp = SCHP(str(schp_path), device=device)
    print("SCHP loaded!")

    # 2. Load CatVTON Pipeline
    attn_ckpt_path = Path(__file__).parent / "checkpoints/CatVTON"
    print("Loading CatVTON Pipeline...")
    pipeline = CatVTONPipeline(
        base_ckpt="runwayml/stable-diffusion-inpainting",
        attn_ckpt=str(attn_ckpt_path),
        attn_ckpt_version="mix",
        weight_dtype=torch.float16,
        device=device,
        skip_safety_check=True
    )
    print("CatVTON Pipeline loaded successfully!")

    # 3. Load sample person and garment
    target_width, target_height = 768, 1024
    
    # Find sample garment
    sample_garment_dir = Path("public/images/san-pham/quan-ao-nam/ao/ao-thun")
    garment_files = list(sample_garment_dir.glob("*.jpg"))
    if not garment_files:
        print("Error: No garment files found in sample dir!")
        return

    garment_path = garment_files[0]
    print(f"Sample garment: {garment_path.name}")
    garment_raw = Image.open(garment_path).convert("RGB")

    # Garment preprocessing: Rembg to strip white box / hangers
    print("Removing garment background using rembg...")
    garment_nobg = rembg.remove(garment_raw)
    
    # Create white canvas for garment condition image
    cloth_image = Image.new("RGB", garment_nobg.size, (255, 255, 255))
    cloth_image.paste(garment_nobg, (0, 0), garment_nobg.split()[3])
    cloth_image = resize_and_padding(cloth_image, (target_width, target_height))
    print("Garment preprocessed into clean condition image!")

    # Sample person: If no real person photo exists, create realistic model canvas
    # Let's check public/images for a model photo
    model_files = list(Path("public/images/models").glob("*.jpg")) if Path("public/images/models").exists() else []
    if model_files:
        person_raw = Image.open(model_files[0]).convert("RGB")
    else:
        # Create a clean mannequin / person proxy for testing
        print("Using sample model image...")
        person_raw = Image.open(garment_files[1] if len(garment_files) > 1 else garment_files[0]).convert("RGB")

    person_image = resize_and_crop(person_raw, (target_width, target_height))

    # 4. Human Parsing via SCHP
    print("Parsing human body with SCHP...")
    parsed_person = schp(person_image)
    parsed_arr = np.array(parsed_person)

    # Lip labels: 5=Upper-clothes, 6=Dress, 7=Coat, 14=Left-arm, 15=Right-arm
    mask_arr = np.zeros((target_height, target_width), dtype=np.uint8)
    # Mask clothing and arms
    mask_arr[(parsed_arr == 5) | (parsed_arr == 6) | (parsed_arr == 7) | (parsed_arr == 14) | (parsed_arr == 15)] = 255
    
    # If parsing found very little clothing (e.g. flat garment used as model), fallback to torso region
    if np.sum(mask_arr > 0) < 5000:
        print("Refining mask bounding region for torso...")
        mask_arr[int(target_height * 0.22):int(target_height * 0.65), int(target_width * 0.2):int(target_width * 0.8)] = 255

    # Dilate and blur mask to avoid boundary seam
    kernel = np.ones((15, 15), np.uint8)
    mask_arr = cv2.dilate(mask_arr, kernel, iterations=1)
    mask = Image.fromarray(mask_arr).filter(ImageFilter.GaussianBlur(radius=7))

    # 5. Run AI Virtual Try-On Inference
    print("Running CatVTON Diffusion Inference (20 steps on RTX 3060)...")
    generator = torch.Generator(device=device).manual_seed(42)
    
    with torch.inference_mode():
        result = pipeline(
            image=person_image,
            condition_image=cloth_image,
            mask=mask,
            num_inference_steps=20,
            guidance_scale=2.5,
            generator=generator
        )[0]

    # Save output
    output_path = Path("ai-server/outputs/test_catvton_result.png")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(output_path, format="PNG")
    print(f"SUCCESS! AI Virtual Try-On Result saved to: {output_path}")
    print(f"Image size: {result.size}, mode: {result.mode}")

if __name__ == "__main__":
    run_test()
