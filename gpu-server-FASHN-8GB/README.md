# CẬP NHẬT: BẢN TÍCH HỢP WEBSITE

**Xem `README_WEB.md` trước** để cài `START_WEB.bat`, giao diện `/web-demo/`, API `/api/v1/jobs` và thư mục Next.js.

---

# SMARTFIT AI STUDIO — FASHN VTON v1.5, Windows / RTX GPU

**Phần mềm phát triển cho đồ án**: chạy model open-source trên PC, không gọi Colab hay dịch vụ inference cloud.
Giải pháp gồm **giao diện GUI**, API FastAPI, webcam, ảnh sản phẩm, tự nhận diện pose + human parsing,
truy xuất lịch sử (SQLite), xuất PNG, batch tuần tự, trước/sau, chế độ thử lại và kiểm tra ảnh đầu vào.

## Cài đặt WINDOWS (bắt buộc theo thứ tự)

1. Cài **NVIDIA driver**, **Python 3.11 64-bit** (chọn *py launcher*) và **Git for Windows**.
2. Giải nén vào thư mục không có ký tự lạ, vd. `D:\SmartFitAI\`.
3. Chạy `INSTALL.bat`, đợi đến khi hiện `Cai thu vien xong`.
4. Chạy `DOWNLOAD_MODELS.bat` khi có Internet để tải đầy đủ trọng số (vài GB), kể cả parser.
5. Chạy `START_SMARTFIT.bat`. Nếu gặp vấn đề ONNX CUDA hoặc hết VRAM với bản 12 GB, chạy `START_SAFE_MODE.bat` để chuyển sang CPU preprocessing và CFG tuần tự. Mở `http://127.0.0.1:7860/studio`.
6. Từ lần chạy sau, `HF_HUB_OFFLINE=1`; chương trình không gửi ảnh người/áo lên server ngoài.
7. Nếu lỗi, chạy `DIAGNOSTICS.bat`, gửi thông báo lỗi và thông tin PyTorch/CUDA.

**LƯU Ý**: File ZIP chỉ chứa ứng dụng và trình cài. Code mô hình, thư viện và trọng số của FASHN chưa được kèm theo vì dung lượng lớn. Lần đầu bắt buộc tải repo và weights. Bạn phải có đủ dung lượng ổ cứng, RAM và Internet.

## Chức năng
- Ảnh người: Upload, dán hoặc webcam
- Ảnh quần áo: Upload/dán; chọn `flat-lay` (sản phẩm) hoặc `model` (người mẫu)
- Áo, quần/chân váy, váy liền (category tương ứng tops/bottoms/one-pieces)
- Pose + parsing bằng **DWPose + FASHN Human Parser** tích hợp trong pipeline gốc
- Maskless mặc định, không tô vùng quần áo
- Chế độ 8 GB: pose + parser trên CPU, tải trọng số trên CPU, CFG tuần tự giảm VRAM
- Chế độ 12 GB: pipeline GPU chính thức, ưu tiên tốc độ; fallback CPU preprocess nếu thư viện GPU có vấn đề
- Tùy chỉnh steps (12-50), guidance (1-3), seed, maskless/segmentation mode
- Tạo thêm ứng viên nếu phát hiện cảnh báo (chỉ số heuristic, không bảo đảm chọn ảnh đẹp)
- Kiểm tra ảnh: định dạng, EXIF orientation, kích thước, sáng/tối, quá mờ và thay đổi nền
- So sánh 2 ảnh, thanh chồng ảnh, lưu PNG
- Lịch sử SQLite, xem chi tiết, tải lại kết quả
- Xử lý danh sách tối đa 10 ảnh tuần tự cùng một trang phục
- REST API cho website, Swagger UI, ví dụ Python/client curl

## REST API (localhost-only)

- `GET /api/health`
- `POST /api/tryon` dạng multipart: `person`, `garment`, `category`, `photo_type`, `steps`, `guidance`, `seed`, `segmentation_free`, `retry_if_flagged`
- `GET /api/history`
- `GET /api/results/{id}/output` và `/comparison`
- `GET /api/docs` (Swagger UI)

Ví dụ PowerShell (có `curl.exe`):

```powershell
curl.exe -X POST http://127.0.0.1:7860/api/tryon -F "person=@D:\pics\person.jpg" -F "garment=@D:\pics\shirt.png" -F "category=tops" -F "photo_type=flat-lay" -F "steps=20" -F "seed=42"
```

## Nguyên tắc chất lượng
- **Không chỉnh màu / sharpen / tách nền cưỡng bức** với ảnh sản phẩm vì dễ làm méo sắc vải.
- Không upscale giả. Mô hình FASHN công bố ảnh output tại khoảng 576×864 (tỉ lệ trả về có thể biến đổi sau unpadding).
- Dùng 1 mẫu/1 inference. Bản 12 GB có thể chọn 30 bước hoặc thêm ảnh khi cần.
- Các số liệu `relative_score` chỉ kiểm tra thay đổi 4 góc và độ sắc nét, **không phải bộ đánh giá chân thực**; không bảo đảm chọn kết quả tốt nhất.
- Khuôn mặt/tóc/tay thường được model cố gắng giữ; **không thể cam kết tuyệt đối**.
- Nếu bạn đổi từ áo dài tay sang áo ngắn tay, AI có thể để lại bóng/vết áo cũ.
- Ảnh frontal và rõ, không che cổ/tay là tốt nhất.

## 8 GB vs 12 GB

| | 8 GB | 12 GB |
|---|---|---|
| Model gốc | FASHN VTON v1.5 | FASHN VTON v1.5 |
| Native output | ~576×864 | ~576×864 |
| Default steps | 20 | 30 |
| Preprocessing | CPU | CUDA, fallback CPU |
| CFG | 2 pass tuần tự (tiết kiệm VRAM, chậm hơn) | 2 nhánh cùng batch (nhanh hơn, tốn VRAM) |
| VRAM | Sát ngưỡng model, có thể OOM | Dư hơn, không đảm bảo với mọi hệ thống |
| Batch | 1 ảnh/lượt | 1 ảnh/lượt |

RTX 3060 dòng desktop thường có 12 GB, laptop có bản 6 GB; hãy kiểm tra dung lượng thực tế với `nvidia-smi`, không suy ra từ tên máy.

## Giới hạn và xử lý sự cố

- **8 GB OOM:** GPU đúng 8 GB vẫn có thể không đủ tùy driver và model. Đóng game/browser GPU; nếu vẫn OOM, không có cấu hình nào đảm bảo máy 8 GB chạy bản official 100%.
- **DLL onnxruntime CUDA:** 12 GB tự fallback CPU preprocess nếu lỗi ngay lúc tải; nếu lỗi khi predict, dùng 8 GB profile hoặc buộc CPU preprocess trong code.
- **Python 3.13 / pillow build:** không dùng; chỉ sử dụng Python 3.11 x64.
- **PyTorch không có CUDA:** xác nhận INSTALL đã cài CUDA wheel và NVIDIA driver.
- **Mạng sau cài:** để offline khi có đủ cả 3 checkpoint và human parser cache. Nếu báo thiếu model, chạy DOWNLOAD_MODELS.bat lại khi có Internet.
- **Thời gian inference:** phụ thuộc GPU; số ~5 giây từ hãng là trên H100, không phải RTX 3060.
- **Giấy phép:** dự án FASHN VTON v1.5 Apache-2.0; kiểm tra thêm giấy phép các phần phụ thuộc (đặc biệt FASHN Human Parser) trước khi thương mại hóa.
- **Không phát public:** Server bind `127.0.0.1`, không mở cổng cho người ngoài hoặc reverse proxy khi chưa cấu hình xác thực, HTTPS, giới hạn tải file. Nếu cần truy cập máy khác, phải đặt `SMARTFIT_API_KEY` và hạ tầng bảo mật.
- **Privacy:** mặc định lưu ảnh vào `data/runs/` để lịch sử hoạt động; xóa thư mục `data` nếu muốn xóa các ảnh/DB đã lưu.
- **Benchmark:** chạy 5 ảnh trên máy thật và ghi thời gian; không suy đoán trước tốc độ ảnh/giây.

## Kiểm thử (không cần GPU)

```bat
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

## Repo chính thức

- https://github.com/fashn-AI/fashn-vton-1.5
- https://huggingface.co/fashn-ai/fashn-vton-1.5
