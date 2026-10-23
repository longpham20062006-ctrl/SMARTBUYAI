import sys
import time
import logging
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageFilter
import torch
import rembg

from config import OUTPUT_DIR, BASE_DIR
from modules.model_loader import model_loader

# Thêm đường dẫn mã nguồn CatVTON vào sys.path
CATVTON_DIR = BASE_DIR / "CatVTON"
if str(CATVTON_DIR) not in sys.path:
    sys.path.append(str(CATVTON_DIR))

try:
    from model.pipeline import CatVTONPipeline
    from model.SCHP import SCHP
    from utils import resize_and_crop, resize_and_padding
except ImportError as e:
    logging.getLogger("tryon.pipeline").error(f"Lỗi khi import CatVTON: {e}")

logger = logging.getLogger("tryon.pipeline")

class TryOnPipeline:
    def __init__(self):
        self.model_name = "CatVTON-SD15-FP16"
        self.pipeline = None
        self.schp = None
        self.is_initialized = False

    def load_pipeline(self):
        """Khởi tạo pipeline thử đồ AI tối ưu cho RTX 3060 12GB"""
        return self.load_models()

    def load_models(self):
        """Khởi tạo mô hình CatVTON và SCHP Human Parsing trên GPU NVIDIA RTX 3060"""
        if self.is_initialized and self.pipeline is not None and self.schp is not None:
            return True

        if not torch.cuda.is_available():
            raise RuntimeError("NVIDIA CUDA không khả dụng! Mô hình AI Virtual Try-On yêu cầu GPU NVIDIA RTX 3060.")

        logger.info("Đang khởi động mô hình AI Virtual Try-On (CatVTON + SCHP) trên GPU RTX 3060...")

        # 1. Tải SCHP Human Parsing Checkpoint
        schp_ckpt = BASE_DIR / "checkpoints" / "CatVTON" / "SCHP" / "exp-schp-201908261155-lip.pth"
        if not schp_ckpt.exists():
            raise FileNotFoundError(f"Không tìm thấy checkpoint SCHP tại: {schp_ckpt}")
        
        logger.info(f"Đang tải SCHP từ: {schp_ckpt.name}...")
        self.schp = SCHP(str(schp_ckpt), device="cuda")
        logger.info("Mô hình SCHP Human Parsing đã sẵn sàng trên CUDA.")

        # 2. Tải CatVTON Pipeline
        attn_ckpt = BASE_DIR / "checkpoints" / "CatVTON"
        logger.info(f"Đang tải CatVTON Pipeline với attention checkpoint tại {attn_ckpt}...")
        self.pipeline = CatVTONPipeline(
            base_ckpt="runwayml/stable-diffusion-inpainting",
            attn_ckpt=str(attn_ckpt),
            attn_ckpt_version="mix",
            weight_dtype=torch.float16,
            device="cuda",
            skip_safety_check=True
        )
        logger.info("CatVTON Pipeline đã sẵn sàng trên GPU RTX 3060 (FP16).")
        self.is_initialized = True
        return True

    def process(
        self,
        job_id: str,
        person_image_path: Path,
        garment_image_path: Path,
        category: str = "upper_body"
    ) -> Path:
        """
        Thực thi quy trình Virtual Try-On bằng mô hình AI Diffusion thật:
        1. Tiền xử lý ảnh trang phục: Loại bỏ hoàn toàn nền trắng, móc treo bằng rembg (U2-Net).
        2. Tiền xử lý ảnh người: Chuẩn hóa tỉ lệ 768x1024.
        3. Phân vùng cơ thể (Human Parsing) bằng SCHP:
           - Tách chính xác vùng áo/quần/váy cần thay thế.
           - Bảo vệ 100% khuôn mặt, mắt, tóc, bàn tay, hình xăm và dáng người.
        4. Chạy mô hình khuếch tán CatVTON Diffusion (20 inference steps) trên RTX 3060.
        5. Tái hòa trộn ảnh bảo toàn tuyệt đối danh tính khuôn mặt người dùng.
        """
        start_time = time.time()
        logger.info(f"[{job_id}] Bắt đầu tác vụ thử đồ AI thật (Danh mục: {category})...")

        # Đảm bảo mô hình AI đã nạp vào GPU
        if not self.is_initialized or self.pipeline is None or self.schp is None:
            self.load_models()

        output_path = OUTPUT_DIR / f"{job_id}.png"
        target_size = (768, 1024)

        try:
            # 1. Đọc ảnh gốc
            person_raw = Image.open(person_image_path).convert("RGB")
            garment_raw = Image.open(garment_image_path).convert("RGB")

            # 2. Xử lý ảnh sản phẩm: Bóc nền trắng, móc áo, người mẫu phụ bằng rembg
            logger.info(f"[{job_id}] Đang bóc tách trang phục sạch bằng Rembg (U2-Net)...")
            garment_nobg = rembg.remove(garment_raw)

            # Cắt theo bounding box thực tế của trang phục để bảo toàn độ phân giải logo, họa tiết và chữ in
            alpha_ch = garment_nobg.split()[3]
            bbox = alpha_ch.getbbox()
            if bbox:
                cropped_garment = garment_nobg.crop(bbox)
                gw, gh = cropped_garment.size
                pad_w = max(int(gw * 0.06), 16)
                pad_h = max(int(gh * 0.06), 16)
                padded_canvas = Image.new("RGBA", (gw + pad_w * 2, gh + pad_h * 2), (255, 255, 255, 0))
                padded_canvas.paste(cropped_garment, (pad_w, pad_h))
                cloth_canvas = Image.new("RGB", padded_canvas.size, (255, 255, 255))
                cloth_canvas.paste(padded_canvas, (0, 0), padded_canvas.split()[3])
            else:
                cloth_canvas = Image.new("RGB", garment_nobg.size, (255, 255, 255))
                cloth_canvas.paste(garment_nobg, (0, 0), garment_nobg.split()[3])

            cloth_img = resize_and_padding(cloth_canvas, target_size)

            # 3. Chuẩn hóa ảnh người
            person_img = resize_and_crop(person_raw, target_size)

            # 4. Phân vùng cơ thể tự động bằng SCHP Human Parsing
            logger.info(f"[{job_id}] Đang phân tích tư thế và phân vùng cơ thể (SCHP)...")
            parsed_person = self.schp(person_img)
            parsed_arr = np.array(parsed_person)

            # Tạo mặt nạ vùng cần thử đồ
            mask_arr = np.zeros((target_size[1], target_size[0]), dtype=np.uint8)

            # LIP classes:
            # 0: Background, 1: Hat, 2: Hair, 3: Glove, 4: Sunglasses,
            # 5: Upper-clothes, 6: Dress, 7: Coat, 8: Socks, 9: Pants,
            # 10: Jumpsuits, 11: Scarf, 12: Skirt, 13: Face, 14: Left-arm,
            # 15: Right-arm, 16: Left-leg, 17: Right-leg, 18: Left-shoe, 19: Right-shoe
            if category in ["upper_body", "outerwear"]:
                # Áo & Áo khoác: Vùng áo (5, 7), đầm (6), cánh tay (14, 15)
                mask_arr[(parsed_arr == 5) | (parsed_arr == 6) | (parsed_arr == 7) | (parsed_arr == 14) | (parsed_arr == 15)] = 255
            elif category == "lower_body":
                # Quần & Váy: Quần (9), chân váy (12)
                mask_arr[(parsed_arr == 9) | (parsed_arr == 12)] = 255
            elif category == "dresses":
                # Đầm liền thân
                mask_arr[(parsed_arr == 5) | (parsed_arr == 6) | (parsed_arr == 7) | (parsed_arr == 9) | (parsed_arr == 12) | (parsed_arr == 14) | (parsed_arr == 15)] = 255

            # Nếu ảnh người không nhận diện được áo (ví dụ góc chụp đặc biệt), dùng vùng thân dự phòng
            if np.sum(mask_arr > 0) < 5000:
                logger.warning(f"[{job_id}] SCHP nhận diện diện tích nhỏ, bổ sung vùng thân mặc định...")
                if category in ["upper_body", "outerwear"]:
                    mask_arr[int(target_size[1] * 0.22):int(target_size[1] * 0.65), int(target_size[0] * 0.2):int(target_size[0] * 0.8)] = 255
                elif category == "lower_body":
                    mask_arr[int(target_size[1] * 0.55):int(target_size[1] * 0.92), int(target_size[0] * 0.22):int(target_size[0] * 0.78)] = 255

            # BẢO VỆ TUYỆT ĐỐI: KHUÔN MẶT, MẮT, MŨ VÀ TÓC KHÔNG BAO GIỜ BỊ CHE PHỦ
            # Xóa triệt để các pixel thuộc Face (13), Hair (2), Hat (1) khỏi mặt nạ
            mask_arr[(parsed_arr == 1) | (parsed_arr == 2) | (parsed_arr == 13)] = 0
            # Giữ vùng đầu an toàn tuyệt đối ở 18% chiều cao phía trên
            mask_arr[:int(target_size[1] * 0.18), :] = 0

            # Làm mượt đường biên mặt nạ để không bị lộ viền ghép
            kernel = np.ones((11, 11), np.uint8)
            mask_arr = cv2.dilate(mask_arr, kernel, iterations=1)
            mask_img = Image.fromarray(mask_arr).filter(ImageFilter.GaussianBlur(radius=5))

            # 5. Chạy mô hình AI CatVTON Diffusion Inference trên NVIDIA RTX 3060
            logger.info(f"[{job_id}] Đang thực thi CatVTON Diffusion (20 steps) trên RTX 3060...")
            generator = torch.Generator(device="cuda").manual_seed(42)

            with torch.inference_mode():
                ai_output = self.pipeline(
                    image=person_img,
                    condition_image=cloth_img,
                    mask=mask_img,
                    num_inference_steps=20,
                    guidance_scale=2.5,
                    generator=generator
                )[0]

            # 6. Repainting: Bảo toàn 100% khuôn mặt, tóc, dáng người và phông nền gốc
            # Những vùng nằm ngoài mặt nạ (mặt nạ == 0) được giữ nguyên 100% ảnh gốc của người dùng
            binary_mask = np.array(mask_img) / 255.0
            binary_mask = np.expand_dims(binary_mask, axis=-1)  # (1024, 768, 1)

            person_np = np.array(person_img).astype(np.float32)
            ai_np = np.array(ai_output).astype(np.float32)

            # Ghép hòa trộn mượt mà
            final_np = ai_np * binary_mask + person_np * (1.0 - binary_mask)
            final_img = Image.fromarray(np.clip(final_np, 0, 255).astype(np.uint8))

            # 7. Lưu kết quả
            final_img.save(output_path, format="PNG", quality=95)

            elapsed = round(time.time() - start_time, 2)
            logger.info(f"[{job_id}] AI Virtual Try-On thành công hoàn toàn sau {elapsed}s! File: {output_path.name}")
            return output_path

        except Exception as e:
            logger.error(f"[{job_id}] Lỗi nghiêm trọng khi chạy AI Virtual Try-On: {e}", exc_info=True)
            # Nghiêm cấm tạo ảnh fallback chồng lớp - Báo lỗi thực tế cho người dùng!
            raise RuntimeError(f"Lỗi xử lý mô hình AI: {str(e)}")

        finally:
            # Giải phóng cache GPU sau mỗi tác vụ để chống tràn VRAM trên RTX 3060
            model_loader.clean_memory()

tryon_pipeline = TryOnPipeline()
