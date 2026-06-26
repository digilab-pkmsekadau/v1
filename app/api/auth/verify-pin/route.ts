import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { verifyPin, setSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== 'string' || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN harus 6 digit' }, { status: 400 });
    }

    const isValid = await verifyPin(pin);
    if (!isValid) {
      return NextResponse.json({ error: 'PIN salah' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    await setSession(response);
    return response;
  } catch (err) {
    console.error('verify-pin error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
