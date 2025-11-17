import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Functions URL not configured' }, { status: 500 });
    }
    let functionsUrl = '';
    try {
      const host = new URL(supabaseUrl).hostname;
      const ref = host.split('.')[0];
      functionsUrl = `https://${ref}.functions.supabase.co/cakto`;
    } catch {
      return NextResponse.json({ error: 'Functions URL invalid' }, { status: 500 });
    }
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const sig = request.headers.get('x-cakto-signature');
    const altSig = request.headers.get('x-signature');
    if (sig) headers['x-cakto-signature'] = sig;
    if (altSig) headers['x-signature'] = altSig;
    const resp = await fetch(functionsUrl, { method: 'POST', headers, body });
    const json = await resp.json().catch(() => ({ success: false }));
    return NextResponse.json(json, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy error', message: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
