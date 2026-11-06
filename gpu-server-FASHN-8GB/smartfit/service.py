from __future__ import annotations
from dataclasses import dataclass
from io import BytesIO
from typing import Callable
from pathlib import Path
import time
import json
from PIL import Image
from .config import PROFILE, PROFILE_NAME
from .images import load_image, compose_comparison, png_bytes
from .quality import analyze
from .storage import save_run
from .engine import ENGINE

CATEGORIES = {'tops','bottoms','one-pieces'}
PHOTO_TYPES = {'model','flat-lay'}

@dataclass
class RequestOptions:
    category: str='tops'
    photo_type: str='flat-lay'
    steps: int=0
    guidance: float=1.5
    seed: int=42
    segmentation_free: bool | None=None
    retry_if_flagged: bool=False

    def validate(self):
        if self.category not in CATEGORIES: raise ValueError('category: tops, bottoms, one-pieces')
        if self.photo_type not in PHOTO_TYPES: raise ValueError('photo_type: model, flat-lay')
        if self.steps and not 12 <= self.steps <= 50: raise ValueError('steps phai tu 12 den 50')
        if not 1.0 <= self.guidance <= 3.0: raise ValueError('guidance 1.0-3.0')
        if not 0 <= self.seed <= 2**31-1: raise ValueError('seed ngoai khoang')
        if self.segmentation_free is None:
            self.segmentation_free = False if self.category == 'one-pieces' else True
        return self


def process(person_bytes: bytes, garment_bytes: bytes, opts: RequestOptions,
            progress: Callable[[str], None] | None = None):
    opts.validate()
    def notify(s):
        if progress: progress(s)
    notify('Kiem tra anh...')
    person,pdiag=load_image(person_bytes,'person')
    garment,gdiag=load_image(garment_bytes,'garment')
    steps = opts.steps or PROFILE.steps
    notify('Khoi tao AI (lan dau can thoi gian)...')
    started=time.perf_counter()
    result=ENGINE.run(person,garment,category=opts.category,photo_type=opts.photo_type,
                      steps=steps,guidance=opts.guidance,seed=opts.seed,
                      segmentation_free=opts.segmentation_free)
    q=analyze(person,result)
    chosen_seed=opts.seed
    alternatives=[]
    if opts.retry_if_flagged and q.warnings:
        notify('Phat hien dau hieu can xem lai; thu them seed...')
        alternative=ENGINE.run(person,garment,category=opts.category,photo_type=opts.photo_type,
                               steps=steps,guidance=opts.guidance,seed=opts.seed+1,
                               segmentation_free=opts.segmentation_free)
        q2=analyze(person,alternative)
        alternatives=[alternative]
        # Do not automatically overwrite the first result with a heuristic
        # winner: border/sharpness cannot determine if a garment looks right.
        # The second candidate remains available for human review in Studio.
    elapsed=time.perf_counter()-started
    comparison=compose_comparison(person,result)
    quality={'relative_score':q.relative_score,'border_change':q.border_change,
             'blur_metric':q.blur_metric,'warnings':q.warnings,
             'input_warnings':{'person':pdiag.warnings,'garment':gdiag.warnings},
             'note':'Các cảnh báo tự động không phát hiện được mọi lỗi cổ áo, tay, dáng người và logo; cần kiểm tra bằng mắt.'}
    rid, paths=save_run(person=person,garment=garment,result=result,comparison=comparison,
                       category=opts.category,photo_type=opts.photo_type,
                       seed=chosen_seed,steps=steps,guidance=opts.guidance,
                       seconds=elapsed,profile=PROFILE_NAME,quality=quality)
    notify('Xong')
    return {'id':rid,'person':person,'garment':garment,'result':result,
            'comparison':comparison,'quality':quality,'seconds':elapsed,
            'paths':paths,'seed':chosen_seed,'alternatives':alternatives}
