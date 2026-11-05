from __future__ import annotations
import io
from pathlib import Path
import json
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from .config import PROFILE_NAME, API_KEY, MAX_UPLOAD_MB, DATA
from .storage import list_runs, get_run
from .service import RequestOptions, process

app=FastAPI(title='SmartFit AI Local API',version='2.0.0',docs_url='/api/docs',openapi_url='/api/openapi.json')


def authorized(value: str | None):
    if API_KEY and value != API_KEY:
        raise HTTPException(401,'Invalid X-SmartFit-Key')

@app.get('/api/health')
def health():
    try:
        import torch
        return {'ok':True,'profile':PROFILE_NAME,'cuda':torch.cuda.is_available(),
                'gpu':torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
                'vram_total_gb':round(torch.cuda.get_device_properties(0).total_memory/1024**3,2) if torch.cuda.is_available() else 0}
    except Exception as e:
        return {'ok':False,'error':str(e)}

@app.post('/api/tryon')
async def tryon(person: UploadFile=File(...), garment: UploadFile=File(...),
                category: str=Form('tops'),photo_type: str=Form('flat-lay'),
                steps: int=Form(0), guidance: float=Form(1.5), seed: int=Form(42),
                segmentation_free: bool=Form(True), retry_if_flagged: bool=Form(False),
                x_smartfit_key: str | None=Header(default=None)):
    authorized(x_smartfit_key)
    try:
        # Read size +1 to reject oversized uploads without loading entire stream.
        a=await person.read(MAX_UPLOAD_MB*1024*1024+1)
        b=await garment.read(MAX_UPLOAD_MB*1024*1024+1)
        options=RequestOptions(category,photo_type,steps,guidance,seed,segmentation_free,retry_if_flagged)
        from starlette.concurrency import run_in_threadpool
        run=await run_in_threadpool(process,a,b,options)
        return {'id':run['id'],'seconds':round(run['seconds'],2),
                'seed':run['seed'],'quality':run['quality'],
                'image_url':f"/api/results/{run['id']}/output",
                'comparison_url':f"/api/results/{run['id']}/comparison"}
    except ValueError as e:
        raise HTTPException(422,str(e)) from e
    except RuntimeError as e:
        raise HTTPException(503,str(e)) from e

@app.get('/api/history')
def history(limit: int=30,x_smartfit_key: str | None=Header(default=None)):
    authorized(x_smartfit_key)
    return [{'id':r['id'],'created_at':r['created_at'],'category':r['category'],
             'seconds':r['seconds'],'profile':r['profile']} for r in list_runs(limit)]

@app.get('/api/results/{rid}/{kind}')
def download(rid: str,kind: str,x_smartfit_key: str | None=Header(default=None)):
    authorized(x_smartfit_key)
    if kind not in {'output','comparison','person','garment'}: raise HTTPException(404)
    row=get_run(rid)
    if not row: raise HTTPException(404,'Not found')
    path=Path(row[f'{kind}_path'])
    if not path.is_file(): raise HTTPException(404,'Missing output file')
    return FileResponse(path,media_type='image/png',filename=f'{rid}_{kind}.png')

# Website integration API: asynchronous jobs, versioned endpoints
from .web_api import router as web_router
app.include_router(web_router)
