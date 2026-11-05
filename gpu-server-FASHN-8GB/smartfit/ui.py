from __future__ import annotations
import json
from pathlib import Path
import traceback
import gradio as gr
from PIL import Image
from .config import PROFILE, PROFILE_NAME, DATA
from .images import png_bytes, blend_comparison
from .service import RequestOptions, process
from .storage import list_runs, get_run

CATS={'Áo / khoác / hoodie':'tops','Quần / chân váy':'bottoms','Váy liền / jumpsuit':'one-pieces'}
TYPES={'Ảnh sản phẩm / flat-lay':'flat-lay','Trang phục trên người mẫu':'model'}


def infer_ui(person,garment,category,photo_type,seed,steps,guidance,maskless,retry,progress=gr.Progress()):
    if person is None or garment is None: raise gr.Error('Cần cả ảnh người và ảnh trang phục.')
    try:
        op=RequestOptions(category=CATS[category],photo_type=TYPES[photo_type],
               steps=int(steps),guidance=float(guidance),seed=int(seed),
               segmentation_free=bool(maskless),retry_if_flagged=bool(retry))
        progress(0.05,desc='Kiểm tra ảnh')
        run=process(png_bytes(person),png_bytes(garment),op,
                    progress=lambda s: progress(0.5,desc=s))
        q=run['quality']
        msg=f"**ID:** `{run['id']}` · **Thời gian:** {run['seconds']:.1f}s · **Seed:** {run['seed']}\n\n"
        msg+=f"**Chỉ số kiểm tra ảnh tương đối:** {q['relative_score']:.3f} (không phải điểm chân thực).\n\n"
        if q['warnings'] or q['input_warnings']['person'] or q['input_warnings']['garment']:
            msg+='**Cần kiểm tra:** '+ '; '.join(q['warnings']+q['input_warnings']['person']+q['input_warnings']['garment'])
        else: msg+='Không thấy cảnh báo từ các phép kiểm tra đơn giản; vẫn nên xem kỹ tay, cổ áo, họa tiết.'
        gallery=[(run['result'],'Ảnh đã chọn')]+[(img,f'Ảnh dự phòng {i+1}') for i,img in enumerate(run['alternatives'])]
        progress(1,desc='Hoàn tất')
        return run['person'],run['garment'],run['result'],run['comparison'],gallery,run['paths']['output'],msg
    except Exception as e:
        raise gr.Error(f'{type(e).__name__}: {e}')


def compare_ui(orig,result,alpha):
    if orig is None or result is None: return None
    return blend_comparison(orig,result,alpha)


def history_options():
    rows=list_runs(100)
    options=[(f"{r['created_at']} | {r['category']} | {r['seconds']:.1f}s | {r['id']}",r['id']) for r in rows]
    return gr.update(choices=options,value=options[0][1] if options else None)


def history_preview(rid):
    if not rid: return None,None,None,'Chưa có lịch sử.'
    row=get_run(rid)
    if not row: return None,None,None,'Không tìm thấy.'
    q=json.loads(row['quality_json'])
    return Image.open(row['person_path']), Image.open(row['output_path']), row['output_path'], (
        f"Ngày: {row['created_at']} | Category: {row['category']} | GPU: {row['profile']} | "
        f"Steps: {row['steps']} | Seed: {row['seed']} | {row['seconds']:.1f}s\n\n"+json.dumps(q,ensure_ascii=False,indent=2))


def batch_ui(people,garment,category,photo_type,steps,seed,progress=gr.Progress()):
    if not people or garment is None: raise gr.Error('Cần danh sách ảnh người và 1 ảnh trang phục.')
    if len(people)>10: raise gr.Error('Tối đa 10 ảnh mỗi lần để tránh chờ lâu và quá tải GPU.')
    outputs=[]; log=[]
    g=png_bytes(garment)
    for i,p in enumerate(people):
        try:
            progress((i+0.1)/len(people),desc=f'Ảnh {i+1}/{len(people)}')
            file_path=p if isinstance(p,str) else p.name
            raw=Path(file_path).read_bytes()
            opts=RequestOptions(category=CATS[category],photo_type=TYPES[photo_type],
                 steps=int(steps),seed=int(seed)+i)
            run=process(raw,g,opts)
            outputs.append((run['result'], f"{Path(file_path).name} — {run['seconds']:.1f}s"))
            log.append(f"OK: {Path(file_path).name} → {run['id']}")
        except Exception as e:
            log.append(f"LỖI: {Path(file_path).name}: {e}")
    return outputs,'\n'.join(log)


def build_ui():
    theme=gr.themes.Soft(primary_hue='indigo')
    with gr.Blocks(theme=theme, title=f'SmartFit AI | FASHN VTON 1.5 {PROFILE_NAME}') as demo:
        gr.Markdown(f'# SmartFit AI Studio · FASHN VTON v1.5\n**Chế độ GPU:** `{PROFILE.label}` · Chạy trên máy · Ảnh xuất theo độ phân giải gốc của mô hình (576×864 trước khi bỏ padding).')
        with gr.Tab('Thử đồ AI'):
            with gr.Row():
                with gr.Column(scale=1):
                    person=gr.Image(label='Ảnh người — tải lên hoặc webcam',type='pil',sources=['upload','webcam','clipboard'])
                    garment=gr.Image(label='Ảnh quần áo',type='pil',sources=['upload','clipboard'])
                    category=gr.Dropdown(choices=list(CATS),value=list(CATS)[0],label='Loại quần áo')
                    photo_type=gr.Radio(choices=list(TYPES),value=list(TYPES)[0],label='Loại ảnh sản phẩm')
                    with gr.Accordion('Nâng cao: chất lượng / tốc độ',open=False):
                        steps=gr.Slider(12,50,value=PROFILE.steps,step=1,label='Số bước (20 nhanh, 30 cân bằng, 50 chậm)')
                        guidance=gr.Slider(1.0,3.0,value=PROFILE.guidance,step=0.1,label='Guidance')
                        seed=gr.Number(value=42,precision=0,label='Seed')
                        maskless=gr.Checkbox(value=True,label='Maskless (giữ cơ thể tự nhiên, mặc định)')
                        retry=gr.Checkbox(value=False,label='Tạo thêm ứng viên khi phát hiện cảnh báo (chậm hơn)')
                    btn=gr.Button('Tạo ảnh thử đồ',variant='primary',size='lg')
                with gr.Column(scale=1):
                    output=gr.Image(label='Kết quả AI',type='pil')
                    report=gr.Markdown('Chưa có kết quả.')
                    file_out=gr.File(label='Tải PNG kết quả')
            with gr.Row():
                original=gr.Image(label='Người gốc',interactive=False,type='pil')
                garment_out=gr.Image(label='Sản phẩm gốc',interactive=False,type='pil')
                side=gr.Image(label='So sánh trước/sau',interactive=False,type='pil')
            alternatives=gr.Gallery(label='Kết quả / các ảnh ứng viên',columns=2,object_fit='contain',height=240)
            gr.Markdown('**Chồng ảnh trước/sau:** 0 = người gốc; 1 = ảnh AI')
            alpha=gr.Slider(0,1,value=0.5,step=0.05,label='Thanh so sánh')
            overlay=gr.Image(label='Ảnh chồng để đối chiếu chi tiết',interactive=False,type='pil')
            btn.click(infer_ui,inputs=[person,garment,category,photo_type,seed,steps,guidance,maskless,retry],
                      outputs=[original,garment_out,output,side,alternatives,file_out,report])
            alpha.change(compare_ui,[original,output,alpha],overlay)
            output.change(compare_ui,[original,output,alpha],overlay)
        with gr.Tab('Xử lý nhiều ảnh'):
            gr.Markdown('Tối đa 10 ảnh người với **cùng một sản phẩm**, xử lý tuần tự để không tràn VRAM. Kết quả lưu vào lịch sử.')
            bpeople=gr.File(label='Chọn nhiều ảnh người',file_count='multiple',file_types=['image'])
            bgarment=gr.Image(label='Ảnh trang phục',type='pil')
            with gr.Row():
                bcat=gr.Dropdown(list(CATS),value=list(CATS)[0],label='Loại')
                btype=gr.Dropdown(list(TYPES),value=list(TYPES)[0],label='Ảnh sản phẩm')
                bsteps=gr.Slider(12,50,value=PROFILE.steps,step=1,label='Steps')
                bseed=gr.Number(value=42,precision=0,label='Seed gốc')
            bbtn=gr.Button('Chạy hàng loạt',variant='primary')
            bresults=gr.Gallery(label='Ảnh hoàn tất',columns=3)
            blog=gr.Textbox(label='Nhật ký',lines=6)
            bbtn.click(batch_ui,[bpeople,bgarment,bcat,btype,bsteps,bseed],[bresults,blog])
        with gr.Tab('Lịch sử'):
            refresh=gr.Button('Tải lại lịch sử')
            history_dropdown=gr.Dropdown(choices=[],label='Chọn lượt thử')
            refresh.click(history_options,outputs=history_dropdown)
            with gr.Row():
                hperson=gr.Image(label='Ảnh gốc',interactive=False)
                hresult=gr.Image(label='Kết quả đã lưu',interactive=False)
            hfile=gr.File(label='Tải ảnh trong lịch sử')
            hdetail=gr.Textbox(label='Thông số và kiểm tra ảnh',lines=8)
            history_dropdown.change(history_preview,[history_dropdown],[hperson,hresult,hfile,hdetail])
        with gr.Tab('Hệ thống / API'):
            gr.Markdown('### Tất cả xử lý tại máy của bạn\n- REST API: **`POST /api/tryon`**\n- Swagger: **`/api/docs`**\n- Kiểm tra GPU: **`GET /api/health`**\n- Lịch sử: **`GET /api/history`**\n- Khi không đặt `SMARTFIT_API_KEY`, chỉ sử dụng máy cục bộ (`127.0.0.1`).')
            gr.Markdown('**Lưu ý:** model tự phân tích pose và quần áo, nhưng bạn vẫn cần chọn category chính xác; AI không bảo đảm giữ nguyên logo, dáng người hay tay trong mọi ảnh. Hãy kiểm tra bằng mắt trước khi sử dụng kết quả.')
    return demo
