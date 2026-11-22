'use client';
import SmaraPlayCodeWidget from '@/components/SmaraPlayCodeWidget';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Coffee,
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  Receipt,
  Plus,
  Trash2,
  Edit3,
  AlertCircle,
  Database,
  RefreshCw,
  Check,
  X,
  Lock,
  LogOut,
  Eye,
  ShieldCheck,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Percent,
} from 'lucide-react';

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(angka) || 0);
};

const generateRandomBahanId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function SmaraLogo({ size = 'md' }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <div className="flex flex-col items-center select-none">
        <img
          src="/logo-smara.jpg"
          alt="SMARA KOPI"
          onError={() => setImgError(true)}
          className={`${
            size === 'lg' ? 'w-32 h-32' : 'w-24 h-24'
          } object-contain mix-blend-screen drop-shadow-[0_0_16px_rgba(125,211,252,0.35)]`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        viewBox="0 0 120 105"
        className={`${
          size === 'lg' ? 'w-24 h-20' : 'w-16 h-14'
        } drop-shadow-[0_0_14px_rgba(125,211,252,0.45)]`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M66 10C39 10 18 31 18 57C18 82 39 101 65 101C80 101 93 94 102 84C95 87 87 89 78 89C53 89 35 71 35 48C35 30 47 16 66 10Z"
          fill="#93D5FA"
        />
        <path
          d="M66 47C66 47 50 38 50 27C50 21 55 17 60 17C64 17 67 20 68 23C70 19 74 16 79 16C85 16 90 21 90 27C90 38 74 47 72 49"
          stroke="#93D5FA"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M47 55H88V68C88 79 79 87 67.5 87C56 87 47 79 47 68V55Z"
          fill="#93D5FA"
        />
        <ellipse cx="67.5" cy="55" rx="20.5" ry="4.5" fill="#092447" stroke="#93D5FA" strokeWidth="3" />
        <path
          d="M88 60H94C98.5 60 101 63 101 67C101 71.5 98 75 93.5 75H87"
          stroke="#93D5FA"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
      <div className={`${size === 'lg' ? 'text-2xl mt-2' : 'text-sm mt-1'} font-extrabold tracking-[0.18em]`}>
        <span className="text-white">SMARA </span>
        <span className="text-sky-300">KOPI</span>
      </div>
    </div>
  );
}

export default function SmaraKopiApp() {
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState('Memproses data...');
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === 'error' ? 7500 : 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const [bahanBaku, setBahanBaku] = useState([]);
  const [produk, setProduk] = useState([]);
  const [resepDetail, setResepDetail] = useState([]);
  const [operasional, setOperasional] = useState([]);
  const [inventaris, setInventaris] = useState([]);

  // Dropdown State untuk Bahan Baku & Menu
  const [expandedBahanIds, setExpandedBahanIds] = useState([]);
  const toggleBahanDropdown = (id) => {
    setExpandedBahanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const [expandedMenuIds, setExpandedMenuIds] = useState([]);
  const toggleMenuDropdown = (id) => {
    setExpandedMenuIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const [targetCupHarian, setTargetCupHarian] = useState(25);

  const [newBahan, setNewBahan] = useState({
    id: '',
    nama_bahan: '',
    ukuran_kemasan: '',
    satuan: 'gr',
    harga_beli: '',
  });
  const [editingBahanId, setEditingBahanId] = useState(null);

  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({
    nama_produk: '',
    harga_jual: '',
    resep: [],
  });
  const [selectedBahanInput, setSelectedBahanInput] = useState('');
  const [jumlahPemakaianInput, setJumlahPemakaianInput] = useState('');

  const [newOps, setNewOps] = useState({
    nama_kebutuhan: '',
    periode: '1 Bulan',
    biaya_bulanan: '',
    catatan: '',
  });
  const [newInv, setNewInv] = useState({
    nama_barang: '',
    kondisi: 'Baru',
    harga_barang: '',
    status_kebutuhan: 'Terpenuhi',
  });

  useEffect(() => {
    setNewBahan((prev) => ({ ...prev, id: generateRandomBahanId() }));
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {} finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/kopi-jawa');
      const data = await res.json();
      if (res.status === 401) {
        setUser(null);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data');
      setBahanBaku(data.bahanBaku || []);
      setProduk(data.produk || []);
      setResepDetail(data.resepDetail || []);
      setOperasional(data.operasional || []);
      setInventaris(data.inventaris || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      setUser(data.user);
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LOGOUT' }),
    });
    setUser(null);
  };

  const sendAction = async (action, payload, label = 'Memproses database...', successMessage = 'Berhasil diperbarui!') => {
    if (!isAdmin) return false;
    setSavingLabel(label);
    setSaving(true);
    try {
      const res = await fetch('/api/kopi-jawa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan ke database');
      await fetchAllData();
      showToast('success', successMessage);
      return true;
    } catch (err) {
      showToast('error', err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const bahanMap = useMemo(() => {
    const map = {};
    bahanBaku.forEach((b) => {
      const unitPrice = Number(b.harga_beli) / Number(b.ukuran_kemasan);
      map[b.id] = { ...b, harga_per_unit: unitPrice };
    });
    return map;
  }, [bahanBaku]);

  const menuEnriched = useMemo(() => {
    return produk.map((p) => {
      const items = resepDetail.filter((r) => r.produk_id === p.id);
      const totalHpp = items.reduce((acc, item) => {
        const b = bahanMap[item.bahan_baku_id];
        return acc + (b ? Number(item.jumlah_pemakaian) * b.harga_per_unit : 0);
      }, 0);
      const hargaJual = Number(p.harga_jual);
      const profit = hargaJual - totalHpp;
      const marginPct = totalHpp > 0 ? (profit / totalHpp) * 100 : 0;

      return { ...p, resep: items, totalHpp, hargaJual, profit, marginPct };
    });
  }, [produk, resepDetail, bahanMap]);

  const stats = useMemo(() => {
    const avgHargaJual =
      menuEnriched.length > 0 ? menuEnriched.reduce((acc, m) => acc + m.hargaJual, 0) / menuEnriched.length : 0;
    const avgProfitCup =
      menuEnriched.length > 0 ? menuEnriched.reduce((acc, m) => acc + m.profit, 0) / menuEnriched.length : 0;
    const avgMarginPct =
      menuEnriched.length > 0 ? menuEnriched.reduce((acc, m) => acc + m.marginPct, 0) / menuEnriched.length : 0;
    const totalOpsBulanan = operasional.reduce((acc, o) => acc + Number(o.biaya_bulanan), 0);
    const totalOpsHarian = totalOpsBulanan / 30;
    const totalInventaris = inventaris.reduce((acc, i) => acc + Number(i.harga_barang), 0);
    const estimasiProfitHarian = targetCupHarian * avgProfitCup;
    const selisihBep = estimasiProfitHarian - totalOpsHarian;
    const minCupBep = avgProfitCup > 0 ? Math.ceil(totalOpsHarian / avgProfitCup) : 0;

    return {
      avgHargaJual,
      avgProfitCup,
      avgMarginPct,
      totalOpsBulanan,
      totalOpsHarian,
      totalInventaris,
      estimasiProfitHarian,
      selisihBep,
      minCupBep,
    };
  }, [menuEnriched, operasional, inventaris, targetCupHarian]);

  const draftMenuCalc = useMemo(() => {
    const subtotalHpp = menuForm.resep.reduce((acc, item) => {
      const b = bahanMap[item.bahan_baku_id];
      return acc + (b ? Number(item.jumlah_pemakaian) * b.harga_per_unit : 0);
    }, 0);
    const hargaJualNum = Number(menuForm.harga_jual) || 0;
    const profit = hargaJualNum - subtotalHpp;
    const marginFromHpp = subtotalHpp > 0 && hargaJualNum > 0 ? (profit / subtotalHpp) * 100 : 0;

    return { subtotalHpp, hargaJualNum, profit, marginFromHpp };
  }, [menuForm, bahanMap]);

  const handleSaveBahan = async (e) => {
    e.preventDefault();
    if (!newBahan.nama_bahan || !newBahan.ukuran_kemasan || !newBahan.harga_beli) return;

    if (editingBahanId) {
      const ok = await sendAction(
        'UPDATE_BAHAN',
        {
          id: editingBahanId,
          nama_bahan: newBahan.nama_bahan,
          ukuran_kemasan: Number(newBahan.ukuran_kemasan),
          satuan: newBahan.satuan,
          harga_beli: Number(newBahan.harga_beli),
        },
        'Memperbarui data bahan baku...',
        `Bahan baku "${newBahan.nama_bahan}" berhasil diperbarui.`
      );
      if (ok) {
        setEditingBahanId(null);
        setNewBahan({ id: generateRandomBahanId(), nama_bahan: '', ukuran_kemasan: '', satuan: 'gr', harga_beli: '' });
      }
    } else {
      const ok = await sendAction(
        'ADD_BAHAN',
        {
          id: newBahan.id,
          nama_bahan: newBahan.nama_bahan,
          ukuran_kemasan: Number(newBahan.ukuran_kemasan),
          satuan: newBahan.satuan,
          harga_beli: Number(newBahan.harga_beli),
        },
        'Menyimpan bahan baku baru...',
        `Bahan baku "${newBahan.nama_bahan}" berhasil ditambahkan.`
      );
      if (ok) {
        setNewBahan({ id: generateRandomBahanId(), nama_bahan: '', ukuran_kemasan: '', satuan: 'gr', harga_beli: '' });
      }
    }
  };

  const handleAddBahanToDraft = () => {
    if (!selectedBahanInput || !jumlahPemakaianInput || Number(jumlahPemakaianInput) <= 0) return;
    const b = bahanMap[selectedBahanInput];
    if (!b) return;

    const existingIdx = menuForm.resep.findIndex((r) => r.bahan_baku_id === selectedBahanInput);
    if (existingIdx >= 0) {
      const updated = [...menuForm.resep];
      updated[existingIdx].jumlah_pemakaian =
        Number(updated[existingIdx].jumlah_pemakaian) + Number(jumlahPemakaianInput);
      setMenuForm({ ...menuForm, resep: updated });
    } else {
      setMenuForm({
        ...menuForm,
        resep: [
          ...menuForm.resep,
          { bahan_baku_id: b.id, jumlah_pemakaian: Number(jumlahPemakaianInput), satuan_pemakaian: b.satuan },
        ],
      });
    }
    setJumlahPemakaianInput('');
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!menuForm.nama_produk || menuForm.resep.length === 0 || !menuForm.harga_jual) {
      showToast('error', 'Lengkapi nama produk, minimal 1 bahan baku, dan harga jual!');
      return;
    }

    const payload = {
      id: editingMenuId,
      nama_produk: menuForm.nama_produk,
      harga_jual: Number(menuForm.harga_jual),
      persentase_margin: Number(draftMenuCalc.marginFromHpp.toFixed(2)),
      resep: menuForm.resep,
    };

    const ok = await sendAction(
      editingMenuId ? 'UPDATE_MENU' : 'ADD_MENU',
      payload,
      editingMenuId ? 'Menyimpan perubahan menu...' : 'Menambahkan menu baru...',
      editingMenuId ? `Menu "${menuForm.nama_produk}" berhasil diperbarui.` : `Menu "${menuForm.nama_produk}" berhasil disimpan.`
    );
    if (ok) {
      setEditingMenuId(null);
      setMenuForm({ nama_produk: '', harga_jual: '', resep: [] });
    }
  };

  const startEditMenu = (menu) => {
    setEditingMenuId(menu.id);
    setMenuForm({
      nama_produk: menu.nama_produk,
      harga_jual: String(menu.hargaJual),
      resep: menu.resep.map((r) => ({
        bahan_baku_id: r.bahan_baku_id,
        jumlah_pemakaian: Number(r.jumlah_pemakaian),
        satuan_pemakaian: r.satuan_pemakaian,
      })),
    });
    document.getElementById('layer-crud-menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (authChecking) {
    return (
      <div className="min-h-screen smara-bg flex items-center justify-center text-sky-100 p-4">
        <div className="smara-glass px-7 py-5 rounded-2xl flex items-center gap-3 text-sm font-medium smara-animate-tab">
          <Loader2 className="w-5 h-5 animate-spin text-sky-300" />
          Memeriksa sesi keamanan SMARA KOPI...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen smara-bg flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md smara-glass rounded-3xl overflow-hidden smara-animate-tab">
          <div className="p-8 pb-6 text-center border-b border-white/15 bg-white/5 space-y-2">
            <SmaraLogo size="lg" />
            <p className="text-xs text-sky-200/80 flex items-center justify-center gap-1.5 pt-2">
              <Lock className="w-3.5 h-3.5 text-sky-300" /> Portal Internal Gudang, HPP & Operasional
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-300/40 text-rose-100 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-sky-200/90 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Masukkan username admin / viewer"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl smara-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-sky-200/90 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl smara-input text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 active:scale-[0.99] disabled:opacity-60 text-[#041226] font-bold py-3.5 rounded-xl shadow-lg shadow-sky-900/40 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loggingIn ? 'Memverifikasi...' : 'Masuk ke SMARA KOPI'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen smara-bg text-slate-100 font-sans relative pb-10">
      {/* OVERLAY LOADING CRUD */}
      {saving && (
        <div className="fixed inset-0 z-50 bg-[#041226]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="smara-glass px-8 py-6 rounded-3xl flex flex-col items-center gap-3.5 max-w-sm w-full text-center smara-animate-tab">
            <div className="w-12 h-12 rounded-2xl bg-sky-400/20 border border-sky-300/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-sky-300 animate-spin" />
            </div>
            <div>
              <p className="font-bold text-white text-base">{savingLabel}</p>
              <p className="text-xs text-sky-200/80 mt-1">Sedang menyinkronkan ke database SMARA KOPI...</p>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFIKASI GLASS TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-[calc(100%-2.5rem)] smara-animate-tab">
          <div
            className={`smara-glass rounded-2xl p-4 flex items-start gap-3 shadow-2xl border ${
              toast.type === 'error'
                ? 'border-rose-400/60 bg-rose-950/90 text-rose-50'
                : 'border-emerald-400/60 bg-emerald-950/90 text-emerald-50'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm leading-relaxed">
              <p className="font-bold mb-0.5">
                {toast.type === 'error' ? 'Tidak Dapat Diproses' : 'Berhasil'}
              </p>
              <p className="opacity-95">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <header className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div className="w-full md:w-64 flex justify-center shrink-0">
            <SmaraLogo size="md" />
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-light tracking-wide text-white leading-snug drop-shadow-sm">
              Aplikasi Penyimpanan / Gudang,
              <br className="hidden sm:block" /> Penghitungan HPP &amp; Operasional Usaha
            </h1>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* SIDEBAR NAVIGASI */}
          <aside className="w-full lg:w-64 shrink-0 smara-glass rounded-3xl p-5 flex flex-col justify-between lg:min-h-[540px]">
            <nav className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'bahan', label: 'Bahan Baku', icon: Package },
                { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
                { id: 'operasional', label: 'Operasional & Aset', icon: Receipt },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      active
                        ? 'smara-nav-active text-white'
                        : 'text-sky-100/85 hover:bg-white/10 hover:text-white border border-white/10 lg:border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${active ? 'text-sky-200 scale-110' : 'text-sky-300/75'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 lg:mt-8 pt-4 border-t border-white/15 space-y-3">
              <div className="p-3.5 rounded-2xl smara-glass-soft space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-bold text-xs truncate">{user.username}</span>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/35 text-emerald-200 text-[10px] font-bold shrink-0">
                      <ShieldCheck className="w-3 h-3" /> ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-400/20 border border-sky-300/35 text-sky-200 text-[10px] font-bold shrink-0">
                      <Eye className="w-3 h-3" /> VIEWER
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-sky-200/80 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-sky-300" /> TiDB Cloud Live
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchAllData}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/15 text-sky-100 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Sync...' : 'Sync'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 active:scale-[0.98] border border-rose-300/30 text-rose-100 text-xs font-semibold transition-all cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            </div>
          </aside>

          {/* KONTEN UTAMA KANAN */}
          <main className="flex-1 w-full min-w-0 space-y-5">
        <div className="mb-5"><SmaraPlayCodeWidget /></div>
            {!isAdmin && (
              <div className="smara-glass-soft px-4 py-3 rounded-2xl text-sky-100 flex items-center gap-2.5 text-xs">
                <Eye className="w-4 h-4 text-sky-300 shrink-0" />
                <span>
                  Anda login dengan akun <strong>View-Only ({user.username})</strong>. Anda dapat memantau kalkulasi HPP, menu, dan BEP tanpa akses ubah data.
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="smara-glass p-4 rounded-2xl border-rose-400/40 bg-rose-950/60 text-rose-100 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Koneksi Database Bermasalah</p>
                  <p className="text-xs opacity-90">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* ================= TAB 1: DASHBOARD & BEP ================= */}
            {activeTab === 'dashboard' && (
              <div key="tab-dashboard" className="space-y-5 smara-animate-tab">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="smara-glass rounded-3xl p-5 flex flex-col justify-between min-h-[132px] hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white/95">Harga rerata menu</span>
                      <Coffee className="w-4 h-4 text-sky-300" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-[26px] font-bold text-white tracking-tight">
                        {formatRupiah(stats.avgHargaJual)}
                      </p>
                      <p className="text-xs text-sky-200/85 mt-1">
                        Dari {menuEnriched.length} menu aktif di database
                      </p>
                    </div>
                  </div>

                  <div className="smara-glass rounded-3xl p-5 flex flex-col justify-between min-h-[132px] hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white/95">Biaya operasional</span>
                      <Receipt className="w-4 h-4 text-sky-300" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-[26px] font-bold text-white tracking-tight">
                        {formatRupiah(stats.totalOpsBulanan)}
                      </p>
                      <p className="text-xs text-sky-200/85 mt-1">
                        Harian: {formatRupiah(stats.totalOpsHarian)}/hari • Aset: {formatRupiah(stats.totalInventaris)}
                      </p>
                    </div>
                  </div>

                  <div className="smara-glass rounded-3xl p-5 flex flex-col justify-between min-h-[132px] hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white/95">Margin rerata</span>
                      <Percent className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-[26px] font-bold text-emerald-300 tracking-tight">
                        +{stats.avgMarginPct.toFixed(1)}%
                      </p>
                      <p className="text-xs text-sky-200/85 mt-1">
                        Profit rerata: {formatRupiah(stats.avgProfitCup)} / cup
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 smara-glass rounded-3xl p-6 flex flex-col justify-between space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          Minimal BEP 1 hari :
                          <span className="text-sky-300">{stats.minCupBep} Cup</span>
                        </h2>
                        <p className="text-xs font-semibold text-sky-100/95 mt-2">
                          Simulator Break-Even Point (BEP) Harian
                        </p>
                        <p className="text-xs text-sky-200/80 mt-0.5">
                          Geser target penjualan cup per hari untuk menguji kelayakan profit kedai.
                        </p>
                      </div>
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-colors duration-300 ${
                          stats.selisihBep >= 0
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-300/45'
                            : 'bg-rose-500/20 text-rose-200 border-rose-300/45'
                        }`}
                      >
                        {stats.selisihBep >= 0 ? 'LAYAK & PROFIT HARI INI' : 'BELUM MENUTUP BIAYA HARIAN'}
                      </span>
                    </div>

                    <div className="smara-glass-soft p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between text-xs sm:text-sm font-semibold">
                        <span className="text-white">Simulasi Terjual: {targetCupHarian} Cup / Hari</span>
                        <span className="text-sky-300">Target BEP: {stats.minCupBep} Cup</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="150"
                        value={targetCupHarian}
                        onChange={(e) => setTargetCupHarian(Number(e.target.value))}
                        className="w-full accent-sky-300 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="smara-glass-soft p-4 rounded-2xl">
                        <p className="text-[11px] text-sky-200/85">Profit Kotor / Hari</p>
                        <p className="text-lg font-bold text-white mt-1">
                          {formatRupiah(stats.estimasiProfitHarian)}
                        </p>
                      </div>
                      <div className="smara-glass-soft p-4 rounded-2xl">
                        <p className="text-[11px] text-sky-200/85">Beban Operasional / Hari</p>
                        <p className="text-lg font-bold text-rose-300 mt-1">
                          - {formatRupiah(stats.totalOpsHarian)}
                        </p>
                      </div>
                      <div className="smara-glass-soft p-4 rounded-2xl">
                        <p className="text-[11px] text-sky-200/85">Net Profit Bersih / Hari</p>
                        <p
                          className={`text-lg font-bold mt-1 transition-colors duration-200 ${
                            stats.selisihBep >= 0 ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {formatRupiah(stats.selisihBep)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="smara-glass rounded-3xl p-5 flex flex-col max-h-[410px]">
                    <div className="flex items-center justify-between pb-3 border-b border-white/15">
                      <h3 className="font-bold text-base text-white">Menu List</h3>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 font-semibold">
                        {menuEnriched.length} Item
                      </span>
                    </div>

                    <div className="mt-3 space-y-3 overflow-y-auto pr-2 smara-scroll flex-1">
                      {menuEnriched.length === 0 ? (
                        <p className="text-xs text-sky-200/75 text-center py-8">Belum ada menu tersimpan.</p>
                      ) : (
                        menuEnriched.map((m) => {
                          const hppRatio = m.hargaJual > 0 ? Math.min(100, (m.totalHpp / m.hargaJual) * 100) : 0;
                          return (
                            <div key={m.id} className="smara-glass-soft p-3.5 rounded-2xl space-y-2 hover:border-sky-300/35">
                              <div className="flex justify-between items-start gap-2 text-xs font-semibold">
                                <span className="text-white leading-snug">{m.nama_produk}</span>
                                <span className="text-emerald-300 shrink-0">+{m.marginPct.toFixed(0)}%</span>
                              </div>
                              <div className="w-full h-2 bg-emerald-400/25 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${hppRatio}%` }}
                                  className="bg-sky-300 h-full rounded-full transition-all duration-500"
                                  title="Porsi HPP"
                                />
                              </div>
                              <div className="flex justify-between text-[11px] text-sky-200/85">
                                <span>HPP: {formatRupiah(m.totalHpp)}</span>
                                <span className="text-white font-semibold">Jual: {formatRupiah(m.hargaJual)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: MASTER BAHAN BAKU (DROPDOWN LIST) ================= */}
            {activeTab === 'bahan' && (
              <div key="tab-bahan" className="space-y-5 smara-animate-tab">
                <div className="smara-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-white">Master Bahan Baku</h2>
                    <p className="text-xs text-sky-200/85 mt-0.5">
                      Klik nama bahan untuk melihat Key ID, kemasan, harga beli &amp; harga per satuan.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-sky-200">
                    Total {bahanBaku.length} Bahan
                  </span>
                </div>

                {isAdmin && (
                  <form
                    onSubmit={handleSaveBahan}
                    className="smara-glass p-5 rounded-3xl grid grid-cols-1 md:grid-cols-6 gap-3.5 items-end"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-sky-200/90 mb-1.5">Key ID</label>
                      <input
                        type="text"
                        readOnly
                        value={editingBahanId || newBahan.id}
                        className="w-full px-3 py-2.5 rounded-xl smara-input text-xs font-mono font-bold text-sky-300 opacity-85"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-sky-200/90 mb-1.5">Nama Bahan Baku</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Susu UHT Full Cream"
                        value={newBahan.nama_bahan}
                        onChange={(e) => setNewBahan({ ...newBahan, nama_bahan: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl smara-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-sky-200/90 mb-1.5">Kemasan</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="1000"
                          value={newBahan.ukuran_kemasan}
                          onChange={(e) => setNewBahan({ ...newBahan, ukuran_kemasan: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl smara-input text-sm"
                        />
                        <select
                          value={newBahan.satuan}
                          onChange={(e) => setNewBahan({ ...newBahan, satuan: e.target.value })}
                          className="px-2 py-2.5 rounded-xl smara-input text-sm"
                        >
                          <option value="gr">gr</option>
                          <option value="ml">ml</option>
                          <option value="Pcs">Pcs</option>
                          <option value="cup">cup</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-sky-200/90 mb-1.5">Harga Beli (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="25000"
                        value={newBahan.harga_beli}
                        onChange={(e) => setNewBahan({ ...newBahan, harga_beli: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl smara-input text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 active:scale-[0.98] disabled:opacity-60 text-[#041226] font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {editingBahanId ? 'Update' : 'Simpan'}
                      </button>
                      {editingBahanId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBahanId(null);
                            setNewBahan({
                              id: generateRandomBahanId(),
                              nama_bahan: '',
                              ukuran_kemasan: '',
                              satuan: 'gr',
                              harga_beli: '',
                            });
                          }}
                          className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {/* LIST DROPDOWN BAHAN BAKU (RINGKAS: NO | NAMA BAHAN | AKSI) */}
                <section className="smara-glass rounded-3xl overflow-hidden">
                  <div className="grid grid-cols-12 items-center px-5 py-3.5 bg-white/10 border-b border-white/15 text-[11px] uppercase tracking-wider text-sky-200 font-bold">
                    <div className="col-span-2 sm:col-span-1">No</div>
                    <div className={isAdmin ? 'col-span-6 sm:col-span-8' : 'col-span-10 sm:col-span-11'}>Nama Bahan</div>
                    {isAdmin && <div className="col-span-4 sm:col-span-3 text-right">Aksi</div>}
                  </div>

                  <div className="divide-y divide-white/10">
                    {bahanBaku.length === 0 ? (
                      <div className="p-8 text-center text-sm text-sky-200/75">Belum ada bahan baku tersimpan.</div>
                    ) : (
                      bahanBaku.map((b, index) => {
                        const unitPrice = Number(b.harga_beli) / Number(b.ukuran_kemasan);
                        const isOpen = expandedBahanIds.includes(b.id);
                        return (
                          <div key={b.id} className="transition">
                            <div className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/5 transition gap-2">
                              <div className="col-span-2 sm:col-span-1 text-sm font-mono text-sky-300 font-bold">
                                {index + 1}
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleBahanDropdown(b.id)}
                                className={`${
                                  isAdmin ? 'col-span-6 sm:col-span-8' : 'col-span-10 sm:col-span-11'
                                } flex items-center justify-between text-left gap-3 group cursor-pointer`}
                              >
                                <span className="font-bold text-white group-hover:text-sky-200 transition text-sm sm:text-base">
                                  {b.nama_bahan}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-sky-200 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 shrink-0">
                                  <span className="hidden sm:inline">{isOpen ? 'Tutup' : 'Detail'}</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                      isOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </span>
                              </button>

                              {isAdmin && (
                                <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-1.5">
                                  <button
                                    disabled={saving}
                                    onClick={() => {
                                      setEditingBahanId(b.id);
                                      setNewBahan({
                                        id: b.id,
                                        nama_bahan: b.nama_bahan,
                                        ukuran_kemasan: String(b.ukuran_kemasan),
                                        satuan: b.satuan,
                                        harga_beli: String(b.harga_beli),
                                      });
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-sky-400/20 hover:bg-sky-400/35 border border-sky-300/25 text-sky-100 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                    title="Edit Bahan"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                  <button
                                    disabled={saving}
                                    onClick={() => {
                                      if (confirm(`Hapus bahan "${b.nama_bahan}"?`)) {
                                        sendAction(
                                          'DELETE_BAHAN',
                                          { id: b.id },
                                          `Menghapus bahan "${b.nama_bahan}"...`,
                                          `Bahan "${b.nama_bahan}" berhasil dihapus.`
                                        );
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-300/25 text-rose-100 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                    title="Hapus Bahan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Hapus</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Dropdown Detail Bahan Baku (Smooth Accordion) */}
                            <div className="smara-accordion" data-open={isOpen ? 'true' : 'false'}>
                              <div className="smara-accordion-inner">
                                <div className="px-5 pb-5 pt-3 bg-[#041226]/40 border-t border-white/10">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="smara-glass-soft p-3.5 rounded-2xl">
                                      <p className="text-[11px] uppercase tracking-wider text-sky-200/80">Key ID</p>
                                      <p className="text-sm font-mono font-bold text-sky-300 mt-1">{b.id}</p>
                                    </div>
                                    <div className="smara-glass-soft p-3.5 rounded-2xl">
                                      <p className="text-[11px] uppercase tracking-wider text-sky-200/80">Kemasan</p>
                                      <p className="text-sm font-bold text-white mt-1">
                                        {Number(b.ukuran_kemasan)} {b.satuan}
                                      </p>
                                    </div>
                                    <div className="smara-glass-soft p-3.5 rounded-2xl">
                                      <p className="text-[11px] uppercase tracking-wider text-sky-200/80">Harga Beli</p>
                                      <p className="text-sm font-bold text-white mt-1">{formatRupiah(b.harga_beli)}</p>
                                    </div>
                                    <div className="smara-glass-soft p-3.5 rounded-2xl">
                                      <p className="text-[11px] uppercase tracking-wider text-sky-200/80">Harga / Satuan</p>
                                      <p className="text-sm font-bold text-emerald-300 mt-1">
                                        {formatRupiah(unitPrice)} / {b.satuan}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* ================= TAB 3: MENU (DROPDOWN LIST + CRUD) ================= */}
            {activeTab === 'menu' && (
              <div key="tab-menu" className="space-y-6 smara-animate-tab">
                <section className="smara-glass rounded-3xl overflow-hidden">
                  <div className="p-5 bg-white/10 border-b border-white/15 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-sky-300 font-bold">
                        Layer 1 • Klik nama menu untuk detail HPP
                      </span>
                      <h2 className="font-bold text-lg text-white">Daftar Menu Tersedia ({menuEnriched.length})</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 items-center px-5 py-3 bg-white/5 border-b border-white/15 text-[11px] uppercase tracking-wider text-sky-200 font-bold">
                    <div className="col-span-2 sm:col-span-1">No</div>
                    <div className={isAdmin ? 'col-span-6 sm:col-span-8' : 'col-span-10 sm:col-span-11'}>Nama Menu</div>
                    {isAdmin && <div className="col-span-4 sm:col-span-3 text-right">Aksi</div>}
                  </div>

                  <div className="divide-y divide-white/10">
                    {menuEnriched.length === 0 ? (
                      <div className="p-8 text-center text-sm text-sky-200/75">Belum ada menu tersimpan di database.</div>
                    ) : (
                      menuEnriched.map((m, index) => {
                        const isOpen = expandedMenuIds.includes(m.id);
                        return (
                          <div key={m.id} className="transition">
                            <div className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/5 transition gap-2">
                              <div className="col-span-2 sm:col-span-1 text-sm font-mono text-sky-300 font-bold">
                                {index + 1}
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleMenuDropdown(m.id)}
                                className={`${
                                  isAdmin ? 'col-span-6 sm:col-span-8' : 'col-span-10 sm:col-span-11'
                                } flex items-center justify-between text-left gap-3 group cursor-pointer`}
                              >
                                <span className="font-bold text-white group-hover:text-sky-200 transition text-sm sm:text-base">
                                  {m.nama_produk}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-sky-200 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 shrink-0">
                                  <span className="hidden sm:inline">{isOpen ? 'Tutup' : 'Detail'}</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                      isOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </span>
                              </button>

                              {isAdmin && (
                                <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-1.5">
                                  <button
                                    disabled={saving}
                                    onClick={() => startEditMenu(m)}
                                    className="px-2.5 py-1.5 rounded-xl bg-sky-400/20 hover:bg-sky-400/35 border border-sky-300/25 text-sky-100 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                  <button
                                    disabled={saving}
                                    onClick={() => {
                                      if (confirm(`Hapus menu "${m.nama_produk}"?`)) {
                                        sendAction(
                                          'DELETE_MENU',
                                          { id: m.id },
                                          `Menghapus menu "${m.nama_produk}"...`,
                                          `Menu "${m.nama_produk}" berhasil dihapus.`
                                        );
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-300/25 text-rose-100 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Hapus</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Dropdown Detail Menu (Smooth Accordion) */}
                            <div className="smara-accordion" data-open={isOpen ? 'true' : 'false'}>
                              <div className="smara-accordion-inner">
                                <div className="px-5 pb-5 pt-3 bg-[#041226]/40 border-t border-white/10 space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="smara-glass-soft p-3.5 rounded-2xl">
                                      <p className="text-[11px] uppercase tracking-wider text-sky-200/80">Total HPP</p>
                                      <p className="text-base font-bold text-sky-200 mt-1">{formatRupiah(m.totalHpp)}</p>
                                    </div>
                                    <div className="smara-glass-soft p-3.5 rounded-2xl">
                                      <p className="text-[11px] uppercase tracking-wider text-sky-200/80">Harga Jual</p>
                                      <p className="text-base font-bold text-white mt-1">{formatRupiah(m.hargaJual)}</p>
                                    </div>
                                    <div className="smara-glass-soft p-3.5 rounded-2xl">
                                      <p className="text-[11px] uppercase tracking-wider text-sky-200/80">Profit &amp; Margin</p>
                                      <div className="flex items-center justify-between gap-2 mt-1">
                                        <span className="text-base font-bold text-emerald-300">
                                          +{formatRupiah(m.profit)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/35 text-emerald-200 text-[11px] font-bold">
                                          {m.marginPct.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="smara-glass-soft p-4 rounded-2xl">
                                    <p className="text-[11px] uppercase tracking-wider text-sky-200/80 font-bold mb-2.5">
                                      Komposisi Bahan ({m.resep.length} item)
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {m.resep.map((r, idx) => {
                                        const b = bahanMap[r.bahan_baku_id];
                                        const cost = b ? Number(r.jumlah_pemakaian) * b.harga_per_unit : 0;
                                        return (
                                          <span
                                            key={idx}
                                            className="px-3 py-1.5 rounded-xl bg-[#092447]/80 border border-sky-300/25 text-xs text-sky-50 flex items-center gap-1.5"
                                          >
                                            <span className="font-semibold">{b ? b.nama_bahan : r.bahan_baku_id}</span>
                                            <span className="text-sky-300">
                                              ({Number(r.jumlah_pemakaian)} {r.satuan_pemakaian})
                                            </span>
                                            <span className="text-emerald-300/90 font-mono text-[11px]">
                                              • {formatRupiah(cost)}
                                            </span>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                {isAdmin && (
                  <section id="layer-crud-menu" className="smara-glass rounded-3xl p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-sky-300 font-bold">
                          Layer 2 • Form Racikan Menu
                        </span>
                        <h3 className="font-bold text-xl text-white">
                          {editingMenuId ? `Edit Menu: ${menuForm.nama_produk}` : 'Tambah Menu & Racikan Baru'}
                        </h3>
                      </div>
                      {editingMenuId && (
                        <button
                          onClick={() => {
                            setEditingMenuId(null);
                            setMenuForm({ nama_produk: '', harga_jual: '', resep: [] });
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Batal Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveMenu} className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-sky-200 mb-2">
                          1. Nama Produk / Menu
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Smara Aren Latte"
                          value={menuForm.nama_produk}
                          onChange={(e) => setMenuForm({ ...menuForm, nama_produk: e.target.value })}
                          className="w-full md:w-1/2 px-4 py-3 rounded-xl smara-input text-sm font-semibold"
                        />
                      </div>

                      <div className="smara-glass-soft p-5 rounded-2xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-sky-200">
                            2. Komposisi Bahan Baku &amp; Akumulasi HPP
                          </label>
                          <div className="px-4 py-1.5 rounded-full bg-sky-400/20 border border-sky-300/35 text-sky-100 text-xs font-bold">
                            Subtotal HPP: {formatRupiah(draftMenuCalc.subtotalHpp)}
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-300 to-blue-400 transition-all duration-300"
                            style={{
                              width: `${
                                draftMenuCalc.hargaJualNum > 0
                                  ? Math.min(100, (draftMenuCalc.subtotalHpp / draftMenuCalc.hargaJualNum) * 100)
                                  : menuForm.resep.length > 0
                                  ? Math.min(100, menuForm.resep.length * 20)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <select
                            value={selectedBahanInput}
                            onChange={(e) => setSelectedBahanInput(e.target.value)}
                            className="md:col-span-2 px-3 py-2.5 rounded-xl smara-input text-sm"
                          >
                            <option value="">-- Pilih Bahan Baku --</option>
                            {bahanBaku.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.nama_bahan} ({formatRupiah(Number(b.harga_beli) / Number(b.ukuran_kemasan))}/{b.satuan})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="any"
                            placeholder="Takaran (gr / ml / pcs)"
                            value={jumlahPemakaianInput}
                            onChange={(e) => setJumlahPemakaianInput(e.target.value)}
                            className="px-3 py-2.5 rounded-xl smara-input text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddBahanToDraft}
                            className="bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/25 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" /> Tambah Bahan
                          </button>
                        </div>

                        {menuForm.resep.length > 0 && (
                          <div className="divide-y divide-white/10 bg-[#041226]/65 rounded-xl border border-white/15 px-4">
                            {menuForm.resep.map((item, idx) => {
                              const b = bahanMap[item.bahan_baku_id];
                              const cost = b ? Number(item.jumlah_pemakaian) * b.harga_per_unit : 0;
                              return (
                                <div key={idx} className="py-3 flex items-center justify-between text-sm">
                                  <div>
                                    <span className="font-semibold text-white">
                                      {b ? b.nama_bahan : item.bahan_baku_id}
                                    </span>
                                    <span className="text-xs text-sky-200/80 ml-2">
                                      ({item.jumlah_pemakaian} {item.satuan_pemakaian})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="font-semibold text-sky-300">{formatRupiah(cost)}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMenuForm({
                                          ...menuForm,
                                          resep: menuForm.resep.filter((_, i) => i !== idx),
                                        })
                                      }
                                      className="text-rose-300 hover:text-rose-200 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="smara-glass-soft p-5 rounded-2xl border-emerald-300/25 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-sky-200 mb-2">
                            3. Tentukan Harga Jual (Rp)
                          </label>
                          <input
                            type="number"
                            required
                            placeholder="Contoh: 18000"
                            value={menuForm.harga_jual}
                            onChange={(e) => setMenuForm({ ...menuForm, harga_jual: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl smara-input text-base font-bold"
                          />
                        </div>

                        <div className="p-4 rounded-xl bg-[#041226]/65 border border-white/15">
                          <p className="text-xs text-sky-200/80">Profit Kotor per Cup</p>
                          <p
                            className={`text-xl font-bold mt-0.5 ${
                              draftMenuCalc.profit >= 0 ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                          >
                            {formatRupiah(draftMenuCalc.profit)}
                          </p>
                          <p className="text-[11px] text-sky-200/70 mt-0.5">
                            Harga Jual - HPP ({formatRupiah(draftMenuCalc.subtotalHpp)})
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-300/35">
                          <p className="text-xs text-emerald-100">Persentase Margin dari HPP</p>
                          <p className="text-2xl font-extrabold text-emerald-300 mt-0.5">
                            {draftMenuCalc.marginFromHpp >= 0 ? '+' : ''}
                            {draftMenuCalc.marginFromHpp.toFixed(2)}%
                          </p>
                          <p className="text-[11px] text-emerald-100/80 mt-0.5">Otomatis dihitung dari modal HPP</p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 active:scale-[0.98] disabled:opacity-60 text-[#041226] font-bold py-3 px-8 rounded-xl shadow-lg shadow-sky-950/50 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                          {editingMenuId ? 'Simpan Perubahan Menu' : 'Simpan Menu ke Database'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}
              </div>
            )}

            {/* ================= TAB 4: OPERASIONAL & INVENTARIS ================= */}
            {activeTab === 'operasional' && (
              <div key="tab-operasional" className="grid grid-cols-1 lg:grid-cols-2 gap-6 smara-animate-tab">
                <div className="smara-glass p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white">Biaya Operasional Bulanan</h3>
                    <span className="text-xs font-bold text-sky-300">{formatRupiah(stats.totalOpsBulanan)}</span>
                  </div>

                  {isAdmin && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await sendAction(
                          'ADD_OPERASIONAL',
                          {
                            ...newOps,
                            biaya_bulanan: Number(newOps.biaya_bulanan),
                          },
                          'Menambahkan biaya operasional...',
                          `Biaya "${newOps.nama_kebutuhan}" berhasil ditambahkan.`
                        );
                        if (ok) setNewOps({ nama_kebutuhan: '', periode: '1 Bulan', biaya_bulanan: '', catatan: '' });
                      }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Nama kebutuhan"
                        value={newOps.nama_kebutuhan}
                        onChange={(e) => setNewOps({ ...newOps, nama_kebutuhan: e.target.value })}
                        className="px-3 py-2.5 rounded-xl smara-input text-sm"
                      />
                      <input
                        type="number"
                        required
                        placeholder="Biaya/bulan (Rp)"
                        value={newOps.biaya_bulanan}
                        onChange={(e) => setNewOps({ ...newOps, biaya_bulanan: e.target.value })}
                        className="px-3 py-2.5 rounded-xl smara-input text-sm"
                      />
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 active:scale-[0.98] disabled:opacity-60 text-[#041226] rounded-xl text-sm font-bold py-2.5 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Tambah'}
                      </button>
                    </form>
                  )}

                  <div className="divide-y divide-white/10">
                    {operasional.map((o) => (
                      <div key={o.id} className="py-3.5 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-white">{o.nama_kebutuhan}</p>
                          <p className="text-xs text-sky-200/75">{o.catatan || o.periode}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sky-200">{formatRupiah(o.biaya_bulanan)}</span>
                          {isAdmin && (
                            <button
                              disabled={saving}
                              onClick={() => {
                                if (confirm(`Hapus biaya "${o.nama_kebutuhan}"?`)) {
                                  sendAction(
                                    'DELETE_OPERASIONAL',
                                    { id: o.id },
                                    'Menghapus biaya operasional...',
                                    `Biaya "${o.nama_kebutuhan}" dihapus.`
                                  );
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="smara-glass p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white">Inventaris &amp; Aset Awal</h3>
                    <span className="text-xs font-bold text-sky-300">{formatRupiah(stats.totalInventaris)}</span>
                  </div>

                  {isAdmin && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await sendAction(
                          'ADD_INVENTARIS',
                          {
                            ...newInv,
                            harga_barang: Number(newInv.harga_barang),
                          },
                          'Menambahkan aset inventaris...',
                          `Inventaris "${newInv.nama_barang}" berhasil ditambahkan.`
                        );
                        if (ok) {
                          setNewInv({ nama_barang: '', kondisi: 'Baru', harga_barang: '', status_kebutuhan: 'Terpenuhi' });
                        }
                      }}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Nama barang"
                        value={newInv.nama_barang}
                        onChange={(e) => setNewInv({ ...newInv, nama_barang: e.target.value })}
                        className="sm:col-span-2 px-3 py-2.5 rounded-xl smara-input text-sm"
                      />
                      <input
                        type="number"
                        required
                        placeholder="Harga (Rp)"
                        value={newInv.harga_barang}
                        onChange={(e) => setNewInv({ ...newInv, harga_barang: e.target.value })}
                        className="px-3 py-2.5 rounded-xl smara-input text-sm"
                      />
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 active:scale-[0.98] disabled:opacity-60 text-[#041226] rounded-xl text-sm font-bold py-2.5 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Tambah'}
                      </button>
                    </form>
                  )}

                  <div className="divide-y divide-white/10">
                    {inventaris.map((inv) => (
                      <div key={inv.id} className="py-3.5 flex items-center justify-between gap-2 text-sm">
                        <div>
                          <p className="font-semibold text-white">{inv.nama_barang}</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-sky-200">
                            {inv.kondisi}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-bold text-sky-200">{formatRupiah(inv.harga_barang)}</span>
                          {isAdmin ? (
                            <button
                              disabled={saving}
                              onClick={() =>
                                sendAction(
                                  'TOGGLE_INVENTARIS',
                                  {
                                    id: inv.id,
                                    status_kebutuhan:
                                      inv.status_kebutuhan === 'Terpenuhi' ? 'Belum Terpenuhi' : 'Terpenuhi',
                                  },
                                  'Memperbarui status inventaris...',
                                  `Status "${inv.nama_barang}" diperbarui.`
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                                inv.status_kebutuhan === 'Terpenuhi'
                                  ? 'bg-emerald-400/20 border-emerald-300/35 text-emerald-200'
                                  : 'bg-amber-400/20 border-amber-300/35 text-amber-200'
                              }`}
                            >
                              {inv.status_kebutuhan}
                            </button>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                inv.status_kebutuhan === 'Terpenuhi'
                                  ? 'bg-emerald-400/20 border-emerald-300/35 text-emerald-200'
                                  : 'bg-amber-400/20 border-amber-300/35 text-amber-200'
                              }`}
                            >
                              {inv.status_kebutuhan}
                            </span>
                          )}
                          {isAdmin && (
                            <button
                              disabled={saving}
                              onClick={() => {
                                if (confirm(`Hapus inventaris "${inv.nama_barang}"?`)) {
                                  sendAction(
                                    'DELETE_INVENTARIS',
                                    { id: inv.id },
                                    'Menghapus inventaris...',
                                    `Inventaris "${inv.nama_barang}" dihapus.`
                                  );
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}


