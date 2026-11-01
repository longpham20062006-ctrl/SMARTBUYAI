'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

type RunResult = {
  id: string;
  seconds: number;
  seed: number;
  image_url: string;
  comparison_url: string;
  quality?: { warnings?: string[]; input_warnings?: {person?: string[]; garment?: string[]}};
};
type Job = {
  status: 'queued' | 'running' | 'completed' | 'failed';
  stage: string;
  result: RunResult | null;
  error: string | null;
};

export default function SmartFitTryOn() {
  const [person, setPerson] = useState<File | null>(null);
  const [garment, setGarment] = useState<File | null>(null);

  // Capture a real webcam image on the laptop; inference still runs on the PC.
  const cameraVideo = useRef<HTMLVideoElement | null>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  function stopCamera() {
    cameraStream.current?.getTracks().forEach(t => t.stop());
    cameraStream.current = null;
    if (cameraVideo.current) cameraVideo.current.srcObject = null;
    setCameraOn(false);
  }
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('Webcam cần HTTPS hoặc mở website tại localhost trên laptop.');
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false, video: {width: {ideal: 1280}, height: {ideal: 960}}
      });
      cameraStream.current = stream;
      if (cameraVideo.current) {
        cameraVideo.current.srcObject = stream;
        await cameraVideo.current.play();
      }
      setCameraOn(true);
      setMessage('Camera laptop đã sẵn sàng.');
    } catch {
      stopCamera();
      setMessage('Không mở được camera. Kiểm tra quyền camera trong trình duyệt.');
    }
  }
  async function captureCamera() {
    const video = cameraVideo.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.93));
    if (!blob) return;
    setPerson(new File([blob], 'smartfit-webcam.jpg', {type: 'image/jpeg'}));
    stopCamera();
    setMessage('Đã chụp ảnh trên laptop.');
  }
  useEffect(() => () => { cameraStream.current?.getTracks().forEach(t => t.stop()); }, []);

  const [category, setCategory] = useState('tops');
  const [photoType, setPhotoType] = useState('flat-lay');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Chọn ảnh người và ảnh trang phục.');
  const [result, setResult] = useState<RunResult | null>(null);
  const [compare, setCompare] = useState(false);
  const [personPreview, setPersonPreview] = useState('');
  const [garmentPreview, setGarmentPreview] = useState('');
  useEffect(() => {
    const url = person ? URL.createObjectURL(person) : '';
    setPersonPreview(url); return () => { if (url) URL.revokeObjectURL(url); };
  }, [person]);
  useEffect(() => {
    const url = garment ? URL.createObjectURL(garment) : '';
    setGarmentPreview(url); return () => { if (url) URL.revokeObjectURL(url); };
  }, [garment]);
  const valid = (file?: File) => !file ||
    (['image/png','image/jpeg','image/webp'].includes(file.type) && file.size <= 20 * 1024 * 1024);

  async function run() {
    if (!person || !garment) { setMessage('Vui lòng chọn đủ hai ảnh.'); return; }
    if (!valid(person) || !valid(garment)) { setMessage('Chỉ hỗ trợ JPG/PNG/WEBP, tối đa 20MB mỗi ảnh.'); return; }
    setBusy(true); setResult(null); setCompare(false);
    try {
      setMessage('Đang gửi ảnh tới GPU...');
      const form = new FormData();
      form.append('person',person); form.append('garment',garment);
      form.append('category',category); form.append('photo_type',photoType);
      form.append('steps','30'); form.append('guidance','1.5');
      form.append('segmentation_free','true'); form.append('retry_if_flagged','false');
      const res = await fetch('/api/smartfit/jobs',{method:'POST',body:form});
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.detail || 'Không tạo được lượt xử lý');
      const jobId = payload.job_id as string;
      for(let attempt = 0; attempt < 300; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1800));
        const statusResp = await fetch(`/api/smartfit/jobs/${jobId}`,{cache:'no-store'});
        const job = (await statusResp.json()) as Job & {detail?: string};
        if(!statusResp.ok) throw new Error(job.detail || 'Không thể lấy trạng thái');
        if(job.status === 'failed') throw new Error(job.error || 'AI xử lý không thành công');
        if(job.status === 'completed' && job.result) {
          setResult(job.result); setMessage(`Đã tạo ảnh trong ${job.result.seconds} giây. Hãy kiểm tra tay và cổ áo.`);return;
        }
        setMessage(job.stage || 'Đang xử lý trên GPU...');
      }
      throw new Error('Chưa có phản hồi. Kiểm tra lịch sử hoặc trạng thái máy AI.');
    } catch(err) {
      setMessage(err instanceof Error ? err.message : 'Đã có lỗi');
    } finally { setBusy(false); }
  }

  const field: CSSProperties = {display:'flex',flexDirection:'column',gap:8,flex:1,minWidth:220};
  const img: CSSProperties = {width:'100%',height:300,objectFit:'contain',borderRadius:12,background:'#f3f4f7'};
  return <section style={{maxWidth:1100,margin:'0 auto',padding:24,fontFamily:'Arial, sans-serif',color:'#222'}}>
    <h2>SmartFit AI · Thử đồ ảo</h2>
    <p>Ảnh người và ảnh sản phẩm sẽ được xử lý bởi GPU của bạn, không phải API cloud.</p>
    <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
      <div style={field}>
        <label>Ảnh người</label>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPerson(e.target.files?.[0]||null)}/>
        {personPreview && <img src={personPreview} style={img} alt="Người gốc"/>}

        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button type="button" onClick={startCamera}>Bật webcam laptop</button>
          {cameraOn && <button type="button" onClick={captureCamera}>Chụp ảnh</button>}
          {cameraOn && <button type="button" onClick={stopCamera}>Tắt webcam</button>}
        </div>
        <video ref={cameraVideo} autoPlay muted playsInline style={{width:'100%',maxHeight:280,display:cameraOn?'block':'none',borderRadius:12}} />

        <label>Ảnh trang phục</label>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setGarment(e.target.files?.[0]||null)}/>
        {garmentPreview && <img src={garmentPreview} style={img} alt="Ảnh trang phục"/>}
        <label>Loại trang phục</label>
        <select value={category} onChange={e=>setCategory(e.target.value)}><option value="tops">Áo / hoodie / khoác</option><option value="bottoms">Quần / chân váy</option><option value="one-pieces">Váy liền</option></select>
        <label>Loại ảnh trang phục</label>
        <select value={photoType} onChange={e=>setPhotoType(e.target.value)}><option value="flat-lay">Ảnh sản phẩm</option><option value="model">Ảnh trên người mẫu</option></select>
        <button disabled={busy} onClick={run} style={{padding:14,background:'#6453df',color:'white',border:0,borderRadius:10,cursor:'pointer'}}>{busy?'Đang xử lý...':'Thử đồ bằng AI'}</button>
      </div>
      <div style={field}>
        <h3>Kết quả</h3>
        {result ? <>
          <img src={compare?result.comparison_url:result.image_url} style={{...img,height:540}} alt={compare?'So sánh ảnh':'Ảnh thử đồ AI'} />
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={()=>setCompare(!compare)}>{compare?'Xem kết quả':'So sánh trước/sau'}</button>
            <a href={result.image_url} download={`smartfit-${result.id}.png`}>Tải ảnh PNG</a>
          </div>
          {(result.quality?.warnings?.length||0)>0 && <p>Chú ý: {result.quality?.warnings?.join(' · ')}</p>}
        </> : <div style={{...img,display:'grid',placeItems:'center'}}>Kết quả sẽ xuất hiện ở đây</div>}
        <p role="status" aria-live="polite">{message}</p>
      </div>
    </div>
  </section>;
}
