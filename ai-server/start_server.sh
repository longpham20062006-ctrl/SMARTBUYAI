#!/usr/bin/env bash
# Script khởi động AI Try-On Server trên Linux / WSL2
cd "$(dirname "$0")"

echo "======================================================================"
echo "  SMARTBUY AI - VIRTUAL TRY-ON SERVER (RTX 3060 12GB)"
echo "  CUDA GPU Acceleration: Enabled"
echo "======================================================================"

if [ ! -f ".venv/bin/python" ]; then
    echo "[!] Tạo môi trường venv..."
    python3.10 -m venv .venv || python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

echo "[*] Khởi động uvicorn server..."
uvicorn app:app --host 0.0.0.0 --port 8000
