import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.GAME_SECRET || 'SMARA_KOPI_PLAY_SECRET_2026';

function getWibDateString(offsetDays = 0) {
  const now = new Date();
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000 + offsetDays * 86400000);
  return wibTime.toISOString().slice(0, 10);
}

function generateDailyPassword(dateStr) {
  const hash = crypto
    .createHmac('sha256', SECRET)
    .update(`SMARA-DAILY-6D-${dateStr}`)
    .digest('hex');

  const num = parseInt(hash.slice(0, 8), 16) % 1000000;
  const sixDigits = String(num).padStart(6, '0');
  return `SMARA-${sixDigits}`;
}

export async function GET(request) {
  // Hanya tampilkan jika user sudah login di dashboard SMARA KOPI
  const sessionCookie = request.cookies.get('kj_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = getWibDateString(0);
  const tomorrow = getWibDateString(1);

  return NextResponse.json({
    today: { date: today, password: generateDailyPassword(today) },
    tomorrow: { date: tomorrow, password: generateDailyPassword(tomorrow) },
  });
}
