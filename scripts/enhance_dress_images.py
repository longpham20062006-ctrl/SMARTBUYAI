import os
import sys
import io
import json
from PIL import Image, ImageFilter, ImageEnhance

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
VAY_DIR = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'quan-ao-nu', 'vay')
OPTIMIZED_DIR = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'quan-ao-nu', 'vay_optimized')
MANIFEST_PATH = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'dress_enhancement_manifest.json')

def enhance_dresses():
    print("=== [LÀM NÉT & TỐI ƯU HÓA ẢNH VÁY NỮ] ===")
    print(f"Thư mục nguồn gốc (giữ nguyên không ghi đè): {VAY_DIR}")
    print(f"Thư mục lưu ảnh tối ưu riêng: {OPTIMIZED_DIR}")

    if not os.path.exists(OPTIMIZED_DIR):
        os.makedirs(OPTIMIZED_DIR, exist_ok=True)

    subdirs = sorted([d for d in os.listdir(VAY_DIR) if os.path.isdir(os.path.join(VAY_DIR, d))], 
                     key=lambda x: int(x) if x.isdigit() else x)

    results = []
    enhanced_count = 0
    small_res_count = 0

    TARGET_W = 600
    TARGET_H = 800  # Chuẩn tỷ lệ 3:4 e-commerce chất lượng cao

    for d in subdirs:
        dp = os.path.join(VAY_DIR, d)
        files = [f for f in os.listdir(dp) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        if not files:
            continue
        
        orig_file = files[0]
        orig_path = os.path.join(dp, orig_file)

        try:
            with Image.open(orig_path) as raw:
                im = raw.convert('RGBA' if raw.mode in ('RGBA', 'LA') or (raw.mode == 'P' and 'transparency' in raw.info) else 'RGB')
                orig_w, orig_h = im.size
                orig_bytes = os.path.getsize(orig_path)

                if orig_w < 200:
                    small_res_count += 1

                # 1. Resize chất lượng cao bằng thuật toán LANCZOS giữ nguyên tỷ lệ
                aspect = orig_w / orig_h
                target_aspect = TARGET_W / TARGET_H

                if aspect > target_aspect:
                    # Ảnh rộng hơn tỷ lệ 3:4 -> scale theo chiều cao rồi pad hoặc crop vừa vặn
                    new_h = TARGET_H
                    new_w = round(TARGET_H * aspect)
                else:
                    new_w = TARGET_W
                    new_h = round(TARGET_W / aspect)

                # Upscale với Lanczos
                upscaled = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

                # Center crop về đúng 600x800
                left = (new_w - TARGET_W) // 2
                top = (new_h - TARGET_H) // 2
                cropped = upscaled.crop((left, top, left + TARGET_W, top + TARGET_H))

                # 2. Xử lý làm nét thông minh: Unsharp Mask vừa phải
                # radius=1.2, percent=115, threshold=3 (bảo toàn da và màu sắc, không tạo viền sáng giả)
                unsharp = cropped.filter(ImageFilter.UnsharpMask(radius=1.2, percent=115, threshold=3))

                # 3. Nâng cấp vi sai contrast và độ nét nhẹ nhàng
                if unsharp.mode == 'RGBA':
                    rgb_part = unsharp.convert('RGB')
                    enhanced_contrast = ImageEnhance.Contrast(rgb_part).enhance(1.04)
                    enhanced_sharp = ImageEnhance.Sharpness(enhanced_contrast).enhance(1.10)
                    final_im = Image.merge('RGBA', (*enhanced_sharp.split(), unsharp.split()[3]))
                else:
                    enhanced_contrast = ImageEnhance.Contrast(unsharp).enhance(1.04)
                    final_im = ImageEnhance.Sharpness(enhanced_contrast).enhance(1.10)

                # 4. Lưu ra file tối ưu WebP chất lượng cao và PNG sắc nét
                out_filename = f"vay_{d}.webp"
                out_path = os.path.join(OPTIMIZED_DIR, out_filename)
                
                # Lưu WebP với chất lượng cao 92%
                final_im.save(out_path, format='WEBP', quality=92, method=6)
                opt_bytes = os.path.getsize(out_path)

                # Lưu phiên bản PNG chất lượng cao
                out_png_filename = f"vay_{d}.png"
                out_png_path = os.path.join(OPTIMIZED_DIR, out_png_filename)
                final_im.save(out_png_path, format='PNG', optimize=True)

                web_path = f"/images/san-pham/quan-ao-nu/vay_optimized/{out_filename}"
                orig_web_path = f"/images/san-pham/quan-ao-nu/vay/{d}/{orig_file}"

                results.append({
                    "folder": d,
                    "originalFile": orig_file,
                    "originalPath": orig_path,
                    "originalWebPath": orig_web_path,
                    "originalResolution": [orig_w, orig_h],
                    "originalSizeKB": round(orig_bytes / 1024, 1),
                    "optimizedWebPath": web_path,
                    "optimizedPngWebPath": f"/images/san-pham/quan-ao-nu/vay_optimized/{out_png_filename}",
                    "optimizedResolution": [TARGET_W, TARGET_H],
                    "optimizedSizeKB": round(opt_bytes / 1024, 1),
                    "method": "LANCZOS + UnsharpMask(r=1.2, p=115, t=3) + Contrast(1.04) + Sharpness(1.10)"
                })
                enhanced_count += 1

        except Exception as e:
            print(f"Lỗi khi xử lý {orig_path}: {e}")

    report = {
        "generatedAt": "2026-10-24T15:25:00Z",
        "totalDressesScanned": len(subdirs),
        "totalEnhanced": enhanced_count,
        "veryLowResCount": small_res_count,
        "targetResolution": [TARGET_W, TARGET_H],
        "format": "WEBP & PNG",
        "items": results
    }

    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"✓ Hoàn tất tối ưu hóa {enhanced_count}/{len(subdirs)} ảnh váy nữ.")
    print(f"  - Số ảnh gốc độ phân giải rất thấp (<200px): {small_res_count}")
    print(f"  - Toàn bộ ảnh đã được nâng cấp lên chuẩn 600x800 sắc nét tại: {OPTIMIZED_DIR}")
    print(f"  - Đã lưu manifest liên kết tại: {MANIFEST_PATH}")
    return report

if __name__ == '__main__':
    enhance_dresses()
