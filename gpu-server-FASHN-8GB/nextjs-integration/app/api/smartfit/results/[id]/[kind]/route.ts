import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await context.params;
  if (!/^[0-9a-f]{16}$/.test(id) || !['output','comparison'].includes(kind)) {
    return NextResponse.json({ detail: 'Không tìm thấy ảnh' }, { status: 404 });
  }
  const base = process.env.SMARTFIT_BACKEND_URL ?? 'http://127.0.0.1:7860';
  const key = process.env.SMARTFIT_API_KEY;
  try {
    const response = await fetch(`${base}/api/v1/results/${id}/${kind}`, {
      headers: key ? { 'X-SmartFit-Key': key } : {}, cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return NextResponse.json({ detail: 'Không lấy được ảnh AI' }, { status: response.status });
    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'image/png', 'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': kind === 'output' ? `inline; filename="smartfit-${id}.png"` : 'inline',
      },
    });
  } catch {
    return NextResponse.json({ detail: 'Máy AI không phản hồi' }, { status: 502 });
  }
}
