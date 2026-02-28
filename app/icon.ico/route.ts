export const runtime = 'edge';

import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.redirect('/favicon.ico');  // or the real path if different
}