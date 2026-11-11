import { NextRequest, NextResponse } from 'next/server';
import { GET as getPayrollExport } from '../export-payroll-excel/route';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.searchParams.set('format', 'csv');
  const modifiedRequest = new Request(url.toString(), {
    headers: request.headers,
    method: 'GET',
  });
  return getPayrollExport(modifiedRequest);
}
