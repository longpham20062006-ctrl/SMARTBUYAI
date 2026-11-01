import sys
print('Python:',sys.version)
try:
 import torch
 print('PyTorch:',torch.__version__)
 print('CUDA:',torch.cuda.is_available())
 if torch.cuda.is_available():
  p=torch.cuda.get_device_properties(0)
  print('GPU:',p.name)
  print('GPU VRAM GB:',round(p.total_memory/1024**3,2))
  print('BF16 supported:',torch.cuda.is_bf16_supported())
except Exception as e:
 print('Diagnostic error:',type(e).__name__,str(e))
try:
 import onnxruntime as ort
 print('ONNX providers:',ort.get_available_providers())
except Exception as e:
 print('ONNX runtime error:',str(e))
