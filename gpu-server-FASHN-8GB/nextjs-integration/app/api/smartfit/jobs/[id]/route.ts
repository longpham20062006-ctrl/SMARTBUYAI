import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{32}$/.test(id)) return NextResponse.json({ detail: 'ID không hợp lệ' }, { status: 400 });
  const base = process.env.SMARTFIT_BACKEND_URL ?? 'http://127.0.0.1:7860';
  const key = process.env.SMARTFIT_API_KEY;
  try {
    const response = await fetch(`${base}/api/v1/jobs/${id}`, {
      headers: key ? { 'X-SmartFit-Key': key } : {}, cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    const data = await response.json().catch(() => ({ detail: 'Không nhận được trạng thái AI' }));
    // Ensure browser-facing links are to our authenticated image proxy.
    if (data?.result?.id) {
      data.result.image_url = `/api/smartfit/results/${data.result.id}/output`;
      data.result.comparison_url = `/api/smartfit/results/${data.result.id}/comparison`;
    }
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ detail: 'Máy AI không phản hồi' }, { status: 502 });
  }
}
