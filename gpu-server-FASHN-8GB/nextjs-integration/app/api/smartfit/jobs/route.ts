// Server-side relay: API key is NEVER sent to the browser.
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function backend() { return process.env.SMARTFIT_BACKEND_URL ?? 'http://127.0.0.1:7860'; }
function headers(): HeadersInit {
  const key = process.env.SMARTFIT_API_KEY || '';
  return key ? { 'X-SmartFit-Key': key } : {};
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const person = form.get('person'); const garment = form.get('garment');
    if (!(person instanceof File) || !(garment instanceof File)) {
      return NextResponse.json({ detail: 'Thiếu ảnh người hoặc trang phục' }, { status: 422 });
    }
    if (person.size > 20 * 1024 * 1024 || garment.size > 20 * 1024 * 1024) {
      return NextResponse.json({ detail: 'Mỗi ảnh tối đa 20MB' }, { status: 413 });
    }
    const response = await fetch(`${backend()}/api/v1/jobs`, {
      method: 'POST', body: form, headers: headers(), cache: 'no-store', signal: AbortSignal.timeout(30000),
    });
    const data = await response.json().catch(() => ({ detail: 'Không đọc được phản hồi của AI' }));
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ detail: 'Không kết nối được máy tính đang chạy SmartFit AI' }, { status: 502 });
  }
}
