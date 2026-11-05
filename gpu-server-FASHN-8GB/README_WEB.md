# SmartFit AI · FASHN VTON v1.5 · Local Web Edition (GPU 8 GB)

**Mục đích:** ghép chức năng thử quần áo AI vào website hiện có (Next.js, React, ASP.NET, HTML/JS), còn suy luận vẫn chạy trên máy Windows có GPU NVIDIA. **Không cần API cloud trả tiền.**

## 1. Cài và chạy trên PC

Nếu đang dùng bản SmartFit FASHN 8 GB cũ, hãy **sao lưu `data`, `models_cache`, `weights`, `.venv`** trước khi nâng cấp. ZIP mới có thể giải nén thành **thư mục mới** để tránh ghi đè dữ liệu. Nếu bạn đã tải trọng số ở bản cũ, có thể sao chép `weights/` và `models_cache/` vào thư mục mới để **không tải lại**; cần chạy `INSTALL.bat` cho môi trường `.venv` riêng.

1. Windows 10/11, NVIDIA GPU với **8 GB VRAM thực**, RAM máy khuyến nghị từ 16 GB, Python **3.11 x64**, Git, driver NVIDIA.
2. Chạy `INSTALL.bat` để cài PyTorch CUDA + mã nguồn FASHN chính thức + dịch vụ.
3. Chạy `DOWNLOAD_MODELS.bat` một lần khi có Internet. Lần này file `.bat` cũng tải trước FASHN Human Parser để tránh lỗi khi chạy offline.
4. Chạy `START_WEB.bat`. Truy cập **http://127.0.0.1:7860/web-demo/**.
5. Studio cũ vẫn có tại **http://127.0.0.1:7860/studio** và API docs **http://127.0.0.1:7860/api/docs**.

> Máy 8 GB sát mức VRAM FASHN công bố. Đã áp dụng CFG tuần tự và pose/parser CPU trong mã cũ, nhưng **không bảo đảm hết VRAM trên mọi cấu hình**. Chạy một yêu cầu GPU mỗi lần. Bản native sinh ảnh khoảng **576×864**, không phải camera real-time.

## 2. Web demo độc lập

`web-demo/index.html` (mở bằng `/web-demo/` qua server) cho phép:

- Tải hoặc kéo thả ảnh người và quần áo; chụp webcam; chọn loại áo/quần/váy và loại ảnh sản phẩm.
- Chạy qua API job nền; xem trạng thái, cảnh báo, số giây xử lý.
- Xem kết quả / ảnh trước sau, tải PNG.
- Chọn steps (20 nhanh, **30 cân bằng** mặc định), guidance, seed, maskless hoặc segmentation, thử lại nếu cần.

Web demo dùng **đúng domain/port** với backend nên không cần CORS hay lưu API key phía client. Để thêm vào trang HTML khác, có thể tạo iframe cho *demo cục bộ* hoặc dùng các endpoint API bên dưới.

## 3. API bất đồng bộ (phù hợp website)

### POST /api/v1/jobs — multipart/form-data

| Trường | Giá trị | Ghi chú |
|---|---|---|
| person | File | JPG/PNG/WEBP, ≤20 MB |
| garment | File | JPG/PNG/WEBP, ≤20 MB |
| category | tops / bottoms / one-pieces | Bắt buộc hiểu đúng loại trang phục |
| photo_type | flat-lay / model | Ảnh sản phẩm hoặc đang mặc trên người mẫu |
| steps | 20/30/40 | Mặc định 30; nhiều bước thường chậm hơn |
| guidance | 1.0–3.0 | Mặc định 1.5 |
| seed | 0–2147483647 | Mặc định 42 |
| segmentation_free | true/false | Mặc định true (maskless) |
| retry_if_flagged | true/false | Mặc định false; tạo ứng viên thứ 2 nếu cảnh báo |

Phản hồi **HTTP 202**:

```json
{"job_id":"...","status":"queued","status_url":"/api/v1/jobs/..."}
```

### GET /api/v1/jobs/{job_id}

- `queued` → `running` → `completed` hoặc `failed`.
- Khi `completed`, nhận `result.image_url`, `result.comparison_url`, `result.quality`.
- Hàng chờ giới hạn; lúc bận có thể trả **429**.
- Trạng thái job được giữ trong RAM khoảng 1 giờ sau khi hoàn thành; ảnh được lưu vào `data/` và lịch sử SQLite lâu hơn.
- Khởi động lại server khi job đang chạy sẽ hủy tác vụ, nhưng không xóa kết quả đã lưu.

### Các endpoint khác

- `GET /api/v1/health`
- `GET /api/v1/results/{run_id}/output`
- `GET /api/v1/results/{run_id}/comparison`
- `GET /api/v1/history?limit=20`

API đồng bộ cũ `/api/tryon` được giữ lại để không làm hỏng tích hợp trước. **Ưu tiên API v1 job** cho website để không gặp timeout khi tạo ảnh lâu.

## 4. Tích hợp vào Next.js hiện tại

Sao chép các file **trong thư mục** `nextjs-integration/` vào **thư mục gốc của dự án Next.js App Router**:

```text
app/api/smartfit/jobs/route.ts
app/api/smartfit/jobs/[id]/route.ts
app/api/smartfit/results/[id]/[kind]/route.ts
components/SmartFitTryOn.tsx
```

Tạo file `.env.local` tại thư mục gốc Next.js:

```env
SMARTFIT_BACKEND_URL=http://127.0.0.1:7860
SMARTFIT_API_KEY=
```

Sử dụng trên trang Next.js:

```tsx
import SmartFitTryOn from '@/components/SmartFitTryOn';
export default function TryOnPage() {
  return <SmartFitTryOn />;
}
```

**Chú ý kiến trúc:** `127.0.0.1` trong các route Next.js là **máy đang chạy Next.js server**, không phải PC của khách. Khi Next.js và SmartFit cùng chạy trên PC của bạn thì hoạt động được. **Nếu website host ở nơi khác**, server của website sẽ không tự truy cập được RTX 3060 qua `localhost`: cần kết nối an toàn bằng VPN/tunnel HTTPS hoặc đặt GPU backend trên máy có địa chỉ riêng, có xác thực và reverse proxy. Đừng mở port 7860 ra Internet.

Next.js proxy là nơi đặt `SMARTFIT_API_KEY`, không truyền token cho browser. Bản mẫu chưa có **login, quota theo người dùng, CSRF/rate-limit**; phải bổ sung ở lớp web trước khi cho khách công khai sử dụng.

## 5. Lưu ý về ảnh lỗi (ảnh trước của bạn)

Bản này cải thiện **cách đưa vào web** và **quan sát chất lượng**, không thay đổi kiến trúc/trọng số FASHN. Do đó nó **không bảo đảm tự sửa hoàn toàn ảnh biến dạng** như ảnh người cúi đầu + áo rộng bạn đã gửi. Đã thực hiện:

- Mặc định 30 bước và guidance 1.5 khi gọi API web; maskless mặc định.
- Không dùng bộ lọc tăng nét/CLAHE, không tự xóa nền áo bằng GrabCut (tránh sai màu, logo).
- Cảnh báo khung ảnh, thay đổi phần mép, độ mờ, một số thay đổi vị trí khuôn mặt (heuristic).
- Không tự thay ảnh kết quả bằng "seed điểm cao hơn" dựa trên độ sắc nét/mép ảnh vì đó không phải điểm chân thực.
- Có thể thử `segmentation_free=false` nếu áo cũ còn sót; **cần đánh giá trực quan**.

Để xử lý ảnh giống màn hình bạn gửi, nên dùng ảnh người chính diện, ít bị che cổ/tay; chọn đúng `photo_type=flat-lay` với ảnh sản phẩm, `photo_type=model` nếu ảnh trang phục đang mặc trên người mẫu. Nếu model sinh ảnh lệch bố cục, **không có thuật toán ép giữ nền/tay đơn giản nào sửa chắc chắn mà không tạo lỗi ghép khác**.

## 6. Bảo mật và riêng tư

- `START_WEB.bat` chỉ bind `127.0.0.1` và app chủ động từ chối bind public.
- Khi chạy local không đặt `SMARTFIT_API_KEY` vẫn an toàn hơn so với mở mạng, nhưng **mọi chương trình/trang web có thể truy cập localhost trong một số điều kiện**, nên không dùng như sản phẩm công khai.
- Nếu dùng Next.js proxy, hãy đặt khóa dài ở môi trường **server**, kiểm tra xác thực khách hàng, quota, tối đa file, HTTPS, quyền xem ảnh theo người dùng, TTL/xóa ảnh.
- Theo mặc định, ảnh người/áo và kết quả được lưu trong `data/runs/`; cần xin phép người dùng và có chính sách xóa dữ liệu khi triển khai thực tế.
- Các hình ảnh riêng tư không gửi đến dịch vụ inference bên ngoài; **lần đầu** cần tải mã nguồn/trọng số, sau đó có thể chạy offline.

## 7. Kiểm tra không cần GPU

```bat
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Nguồn lõi mô hình: https://github.com/fashn-AI/fashn-vton-1.5 (Apache-2.0; xem cả giấy phép thành phần Human Parser nếu thương mại hóa).
