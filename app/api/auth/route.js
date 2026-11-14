import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'kopi-jawa-default-secret-key';

export function signSession(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySession(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function GET(request) {
  const token = request.cookies.get('kj_session')?.value;
  const session = verifySession(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}

export async function POST(request) {
  const body = await request.json();

  if (body.action === 'LOGOUT') {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('kj_session');
    return res;
  }

  const { username, password } = body;
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'kopijawa123';
  const viewerUser = process.env.VIEWER_USER || 'viewer';
  const viewerPass = process.env.VIEWER_PASS || 'lihat123';

  let role = null;
  if (username === adminUser && password === adminPass) {
    role = 'admin';
  } else if (username === viewerUser && password === viewerPass) {
    role = 'viewer';
  }

  if (!role) {
    return NextResponse.json({ error: 'Username atau password salah!' }, { status: 401 });
  }

  const token = signSession({ username, role });
  const res = NextResponse.json({ success: true, user: { username, role } });
  res.cookies.set('kj_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // Sesi aktif 7 hari
  });
  return res;
}
