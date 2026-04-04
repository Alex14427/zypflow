import { NextResponse } from 'next/server';
import { collectSystemDiagnostics } from '@/lib/system-diagnostics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics = await collectSystemDiagnostics();

  return NextResponse.json({
    status: diagnostics.status === 'healthy' ? 'ok' : 'degraded',
    summary: diagnostics.summary,
    mode: diagnostics.status === 'local_smoke' ? 'local' : 'live',
    timestamp: new Date().toISOString(),
  }, {
    status: diagnostics.status === 'degraded' ? 503 : 200,
  });
}
