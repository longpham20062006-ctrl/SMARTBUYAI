from pathlib import Path
import datetime as dt
import json
import sqlite3
import uuid
from .config import DATA

SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
 id TEXT PRIMARY KEY, created_at TEXT NOT NULL, category TEXT NOT NULL,
 photo_type TEXT NOT NULL, seed INTEGER NOT NULL, steps INTEGER NOT NULL,
 guidance REAL NOT NULL, seconds REAL NOT NULL, profile TEXT NOT NULL,
 quality_json TEXT NOT NULL, person_path TEXT NOT NULL, garment_path TEXT NOT NULL,
 output_path TEXT NOT NULL, comparison_path TEXT NOT NULL
);
"""

def init_db():
    DATA.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DATA/'history.db', timeout=30) as conn:
        conn.execute(SCHEMA)

def save_run(*, person, garment, result, comparison, category, photo_type,
             seed, steps, guidance, seconds, profile, quality):
    init_db()
    rid = uuid.uuid4().hex[:16]
    folder = DATA / 'runs' / rid
    folder.mkdir(parents=True, exist_ok=False)
    files = {'person':person,'garment':garment,'output':result,'comparison':comparison}
    paths = {}
    for name, img in files.items():
        path = folder/f'{name}.png'
        img.convert('RGB').save(path)
        paths[name]=str(path.resolve())
    created = dt.datetime.now().astimezone().isoformat(timespec='seconds')
    with sqlite3.connect(DATA/'history.db', timeout=30) as conn:
        conn.execute("""INSERT INTO runs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
          (rid,created,category,photo_type,int(seed),int(steps),float(guidance),
           float(seconds),profile,json.dumps(quality,ensure_ascii=False),
           paths['person'],paths['garment'],paths['output'],paths['comparison']))
    return rid, paths

def list_runs(limit=50):
    init_db()
    limit=max(1,min(int(limit),500))
    with sqlite3.connect(DATA/'history.db') as conn:
        conn.row_factory=sqlite3.Row
        rows=conn.execute('SELECT * FROM runs ORDER BY created_at DESC LIMIT ?', (limit,)).fetchall()
    return [dict(row) for row in rows]

def get_run(rid):
    init_db()
    with sqlite3.connect(DATA/'history.db') as conn:
        conn.row_factory=sqlite3.Row
        row=conn.execute('SELECT * FROM runs WHERE id=?', (rid,)).fetchone()
    return dict(row) if row else None
