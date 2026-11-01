"""Explainable, non-learned quality warnings (NOT an aesthetic/realism score).

Never rewrite generated pixels or claim that a heuristic recognizes clothing
fidelity. The user should review face, hands, collar, print and body pose.
"""
from dataclasses import dataclass
import cv2
import numpy as np
from PIL import Image, ImageOps


@dataclass
class QualityReport:
    relative_score: float
    border_change: float
    blur_metric: float
    warnings: list[str]


def _face_boxes(img):
    # Lightweight and imperfect, only for frontal/visible faces.
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    try:
        detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        if detector.empty():
            return []
        return sorted(detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5,
               minSize=(42,42)), key=lambda b: b[2] * b[3], reverse=True)
    except Exception:
        return []


def analyze(original: Image.Image, result: Image.Image) -> QualityReport:
    target = result.convert('RGB')
    warnings: list[str] = []
    if abs(original.width / original.height - target.width / target.height) > 0.12:
        warnings.append('Khung hình kết quả khác tỷ lệ ảnh gốc; cần kiểm tra bố cục và chân tay.')
    base = ImageOps.fit(original.convert('RGB'), target.size, method=Image.Resampling.LANCZOS)
    a = np.asarray(base, dtype=np.float32)
    b = np.asarray(target, dtype=np.float32)
    h, w = b.shape[:2]
    # Compare ONLY outer border bands. This is not guaranteed to be background.
    edge_h, edge_w = max(8, int(h * .08)), max(8, int(w * .08))
    m = np.zeros((h, w), dtype=bool)
    m[:edge_h,:] = True; m[-edge_h:,:] = True
    m[:,:edge_w] = True; m[:,-edge_w:] = True
    diff = float(np.mean(np.abs(a[m]-b[m])) / 255)
    gray = cv2.cvtColor(b.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if diff > 0.20:
        warnings.append('Mép ảnh khác ảnh gốc khá nhiều; kiểm tra xem nền hoặc cơ thể có bị dịch chuyển.')
    if blur < 22:
        warnings.append('Ảnh kết quả ít sắc nét; thử nguồn ảnh rõ hơn.')
    # Optional face drift signal. No identity recognition involved.
    a8 = a.astype(np.uint8); b8=b.astype(np.uint8)
    f1=_face_boxes(a8); f2=_face_boxes(b8)
    if f1 and not f2:
        warnings.append('Không tìm được khuôn mặt ở ảnh kết quả; hãy tự kiểm tra mặt/tóc.')
    elif f1 and f2:
        x1,y1,w1,h1=map(int,f1[0]); x2,y2,w2,h2=map(int,f2[0])
        shift=((x1+w1/2-x2-w2/2)**2 + (y1+h1/2-y2-h2/2)**2)**.5
        if shift/max(w,h)>0.075 or abs(w1-w2)/max(w1,1)>0.22:
            warnings.append('Vị trí/kích thước mặt thay đổi; có thể AI đã làm lệch tư thế.')
    # Don't make a numerical claim about garment quality.
    score = max(0., min(1., 1.0 - diff * 0.8 - (0.15 if blur < 22 else 0)))
    return QualityReport(round(score,4), round(diff,4), round(blur,1), warnings)
