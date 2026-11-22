'use client';

import React, { useState, useEffect } from 'react';
import { Gamepad2, Copy, Check } from 'lucide-react';

export default function SmaraPlayCodeWidget() {
  const [codes, setCodes] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/game-code')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setCodes(data);
      })
      .catch(() => {});
  }, []);

  if (!codes) return null;

  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="smara-glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-sky-300/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-400/20 border border-sky-300/35 flex items-center justify-center shrink-0">
          <Gamepad2 className="w-5 h-5 text-sky-300" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
            Kode Harian SMARA PLAY ({codes.today.date})
          </p>
          <p className="text-lg sm:text-xl font-mono font-extrabold text-white tracking-wider">
            {codes.today.password}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <span className="text-[11px] text-sky-200/75 font-mono">
          Besok: {codes.tomorrow.password}
        </span>
        <button
          type="button"
          onClick={() => copyCode(codes.today.password)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-400/20 hover:bg-sky-400/35 border border-sky-300/30 text-sky-100 text-xs font-bold transition cursor-pointer"
        >
          {copied === codes.today.password ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" /> Tersalin
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Salin Kode
            </>
          )}
        </button>
      </div>
    </div>
  );
}
