"""Official FASHN VTON 1.5 pipeline with conservative 8 GB profile.
8 GB: CPU pose/parser, CPU checkpoint loading, sequential conditional/unconditional
CFG to reduce activation peak. Sequential CFG may run slower.
"""
import gc
import os
import threading
import time
import types
from pathlib import Path
from PIL import Image
from .config import PROFILE, WEIGHTS

class Engine:
    def __init__(self):
        self.pipeline = None
        self.lock = threading.Lock()
        self.last_seconds = None

    def load(self):
        if self.pipeline is not None: return self.pipeline
        try:
            import torch
            from fashn_vton import TryOnPipeline
        except ImportError as exc:
            raise RuntimeError('Chua cai FASHN VTON. Chay INSTALL.bat truoc.') from exc
        if not torch.cuda.is_available():
            raise RuntimeError('Khong phat hien GPU CUDA. Chay DIAGNOSTICS.bat.')
        required = [WEIGHTS/'model.safetensors', WEIGHTS/'dwpose'/'yolox_l.onnx',
                    WEIGHTS/'dwpose'/'dw-ll_ucoco_384.onnx']
        missing = [str(p) for p in required if not p.exists()]
        if missing:
            raise RuntimeError('Chua co model: ' + ', '.join(missing) + '. Chay DOWNLOAD_MODELS.bat.')
        torch.backends.cuda.matmul.allow_tf32=True
        try:
            torch.set_float32_matmul_precision('high')
        except Exception:
            pass

        if PROFILE.cpu_preprocessing or os.getenv('SMARTFIT_SAFE_MODE') == '1':
            # Overrides are dispatched by TryOnPipeline.__init__ automatically.
            class EfficientTryOnPipeline(TryOnPipeline):
                def _setup_tryon_model(self):
                    # Avoid loading the 2 GB state dict directly into an 8 GB GPU.
                    from fashn_vton.tryon_mmdit import TryOnModel
                    from fashn_vton.utils import load_checkpoint
                    self.tryon_model = TryOnModel()
                    weights = load_checkpoint(os.path.join(self.weights_dir, 'model.safetensors'), device='cpu')
                    self.tryon_model.load_state_dict(weights)
                    del weights
                    self.tryon_model.to(self.device, dtype=self.inference_dtype).eval()
                def _setup_pose_model(self):
                    from fashn_vton.dwpose import DWposeDetector
                    self.pose_model = DWposeDetector(
                        checkpoints_dir=os.path.join(self.weights_dir, 'dwpose'), device='cpu')
                def _setup_hp_model(self):
                    from fashn_human_parser import FashnHumanParser
                    self.hp_model = FashnHumanParser(device='cpu')
            p = EfficientTryOnPipeline(weights_dir=str(WEIGHTS), device='cuda')
            if PROFILE.sequential_cfg:
                # Default uses doubled batch for CFG (faster but more VRAM).
                # Here unconditional and conditional passes run separately.
                def sequential_cfg(model, x, times, **kwargs):
                    b = x.shape[0]
                    mask_yes = torch.ones(b, dtype=torch.bool, device=x.device)
                    mask_no = torch.zeros(b, dtype=torch.bool, device=x.device)
                    cond = model.forward(x, times, mask=mask_yes, **kwargs)['x']
                    uncond = model.forward(x, times, mask=mask_no, **kwargs)['x']
                    return {'v_c':cond, 'v_u':uncond}
                p.tryon_model.forward_for_cfg = types.MethodType(sequential_cfg, p.tryon_model)
        else:
            try:
                p = TryOnPipeline(weights_dir=str(WEIGHTS), device='cuda')
            except Exception as exc:
                # 12 GB: fallback to CPU preprocessing on ONNX CUDA DLL/driver errors.
                print('[WARN] GPU preprocess failed, retrying CPU preprocess:', exc)
                gc.collect()
                if torch.cuda.is_available(): torch.cuda.empty_cache()
                class CPUPreprocessTryOn(TryOnPipeline):
                    def _setup_pose_model(self):
                        from fashn_vton.dwpose import DWposeDetector
                        self.pose_model=DWposeDetector(checkpoints_dir=os.path.join(self.weights_dir,'dwpose'), device='cpu')
                    def _setup_hp_model(self):
                        from fashn_human_parser import FashnHumanParser
                        self.hp_model=FashnHumanParser(device='cpu')
                p=CPUPreprocessTryOn(weights_dir=str(WEIGHTS), device='cuda')
        self.pipeline=p
        return p

    def run(self, person: Image.Image, garment: Image.Image, *, category: str,
            photo_type: str, steps: int, guidance: float, seed: int,
            segmentation_free: bool=True):
        # Only one GPU job at a time; Gradio and REST API share this lock.
        import torch
        with self.lock:
            p=self.load()
            t0=time.perf_counter()
            try:
                result=p(person_image=person.convert('RGB'), garment_image=garment.convert('RGB'),
                         category=category, garment_photo_type=photo_type, num_samples=1,
                         num_timesteps=steps, guidance_scale=guidance, seed=seed,
                         segmentation_free=segmentation_free)
                torch.cuda.synchronize()
                self.last_seconds=time.perf_counter()-t0
                return result.images[0]
            except torch.cuda.OutOfMemoryError as exc:
                gc.collect()
                torch.cuda.empty_cache()
                raise RuntimeError('GPU khong du VRAM. Hay dong game/ung dung GPU; ban 8 GB da bat sequential CFG. Neu van loi, co the can GPU lon hon.') from exc

ENGINE=Engine()
