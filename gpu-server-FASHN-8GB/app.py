"""One local server: Gradio UI + FastAPI for future website integration."""
from smartfit.config import HOST, PORT, API_KEY
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from smartfit.api import app
from smartfit.ui import build_ui
import gradio as gr
import uvicorn

# Security: permit only loopback, explicit RFC1918 LAN addresses, or a Tailscale
# 100.64.0.0/10 address for a closed demo. Never bind to 0.0.0.0 or public IPs.
from ipaddress import ip_address, ip_network

def _allowed_demo_bind(host: str) -> bool:
    if host in ("127.0.0.1", "localhost", "::1", "0.0.0.0"):
        return True
    try:
        address = ip_address(host)
    except ValueError:
        return False
    allowed = [
        ip_network("10.0.0.0/8"),
        ip_network("172.16.0.0/12"),
        ip_network("192.168.0.0/16"),
        ip_network("100.64.0.0/10"),  # Tailscale / CGNAT; verify it is your own PC
    ]
    return address.version == 4 and any(address in block for block in allowed)

if not _allowed_demo_bind(HOST):
    raise RuntimeError(
        "SMARTFIT_HOST phải là IP riêng của PC (LAN 192.168.x.x/10.x.x.x) "
        "hoặc IP Tailscale 100.x.x.x. Không hỗ trợ mở port công khai."
    )
from fastapi.responses import PlainTextResponse

@app.exception_handler(OSError)
async def os_error_handler(request, exc):
    return PlainTextResponse("Not Found", status_code=404)

app.mount('/web-demo', StaticFiles(directory=str(Path(__file__).resolve().parent/'web-demo'), html=True), name='web-demo')

if __name__ == '__main__':
    ui=build_ui()
    # Mount keeps /api/* routes outside the UI.
    asgi=gr.mount_gradio_app(app,ui,path='/studio',allowed_paths=[str(__import__('pathlib').Path(__file__).resolve().parent/'data')])
    print(f'\nSmartFit AI: http://{HOST}:{PORT}/studio')
    print(f'API docs:   http://{HOST}:{PORT}/api/docs')
    print(f'Web demo:   http://{HOST}:{PORT}/web-demo/')
    uvicorn.run(asgi,host=HOST,port=PORT,log_level='info')
