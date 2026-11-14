'use client';

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
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Wallet,
  Calculator,
  Database,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Check,
  X
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

export default function KopiJawaApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State Data Database
  const [bahanBaku, setBahanBaku] = useState([]);
  const [produk, setProduk] = useState([]);
  const [resepDetail, setResepDetail] = useState([]);
  const [operasional, setOperasional] = useState([]);
  const [inventaris, setInventaris] = useState([]);

  // Simulator BEP State
  const [targetCupHarian, setTargetCupHarian] = useState(25);

  // Form Bahan Baku
const [newBahan, setNewBahan] = useState({
  id: '',
  nama_bahan: '',
  ukuran_kemasan: '',
  satuan: 'gr',
  harga_beli: '',
});
  const [editingBahanId, setEditingBahanId] = useState(null);

  // Form Menu (Layer 2 CRUD)
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({
    nama_produk: '',
    harga_jual: '',
    resep: [],
  });
  const [selectedBahanInput, setSelectedBahanInput] = useState('');
  const [jumlahPemakaianInput, setJumlahPemakaianInput] = useState('');

  // Form Operasional & Inventaris
  const [newOps, setNewOps] = useState({ nama_kebutuhan: '', periode: '1 Bulan', biaya_bulanan: '', catatan: '' });
  const [newInv, setNewInv] = useState({ nama_barang: '', kondisi: 'Baru', harga_barang: '', status_kebutuhan: 'Terpenuhi' });

  // Fetch Data dari API TiDB Cloud
  const fetchAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/kopi-jawa');
      const data = await res.json();
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
  setNewBahan((prev) => ({ ...prev, id: generateRandomBahanId() }));
  fetchAllData();
}, []);

  // Helper API Action
  const sendAction = async (action, payload) => {
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
      return true;
    } catch (err) {
      alert('Error Database: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Kalkulasi Bahan Baku Map
  const bahanMap = useMemo(() => {
    const map = {};
    bahanBaku.forEach((b) => {
      const unitPrice = Number(b.harga_beli) / Number(b.ukuran_kemasan);
      map[b.id] = { ...b, harga_per_unit: unitPrice };
    });
    return map;
  }, [bahanBaku]);

  // Kalkulasi Lengkap per Menu
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

      return {
        ...p,
        resep: items,
        totalHpp,
        hargaJual,
        profit,
        marginPct,
      };
    });
  }, [produk, resepDetail, bahanMap]);

  // Metrik Dashboard
  const stats = useMemo(() => {
    const avgHargaJual =
      menuEnriched.length > 0
        ? menuEnriched.reduce((acc, m) => acc + m.hargaJual, 0) / menuEnriched.length
        : 0;
    const avgProfitCup =
      menuEnriched.length > 0
        ? menuEnriched.reduce((acc, m) => acc + m.profit, 0) / menuEnriched.length
        : 0;
    const totalOpsBulanan = operasional.reduce((acc, o) => acc + Number(o.biaya_bulanan), 0);
    const totalOpsHarian = totalOpsBulanan / 30;
    const totalInventaris = inventaris.reduce((acc, i) => acc + Number(i.harga_barang), 0);
    const estimasiProfitHarian = targetCupHarian * avgProfitCup;
    const selisihBep = estimasiProfitHarian - totalOpsHarian;
    const minCupBep = avgProfitCup > 0 ? Math.ceil(totalOpsHarian / avgProfitCup) : 0;

    return {
      avgHargaJual,
      avgProfitCup,
      totalOpsBulanan,
      totalOpsHarian,
      totalInventaris,
      estimasiProfitHarian,
      selisihBep,
      minCupBep,
    };
  }, [menuEnriched, operasional, inventaris, targetCupHarian]);

  // Kalkulasi Real-Time Form Menu (Layer 2)
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

  // Handler Bahan Baku
  const handleSaveBahan = async (e) => {
    e.preventDefault();
    if (!newBahan.nama_bahan || !newBahan.ukuran_kemasan || !newBahan.harga_beli) return;

    if (editingBahanId) {
      const ok = await sendAction('UPDATE_BAHAN', {
        id: editingBahanId,
        nama_bahan: newBahan.nama_bahan,
        ukuran_kemasan: Number(newBahan.ukuran_kemasan),
        satuan: newBahan.satuan,
        harga_beli: Number(newBahan.harga_beli),
      });
      if (ok) {
        setEditingBahanId(null);
        setNewBahan({ id: generateRandomBahanId(), nama_bahan: '', ukuran_kemasan: '', satuan: 'gr', harga_beli: '' });
      }
    } else {
      const ok = await sendAction('ADD_BAHAN', {
        id: newBahan.id,
        nama_bahan: newBahan.nama_bahan,
        ukuran_kemasan: Number(newBahan.ukuran_kemasan),
        satuan: newBahan.satuan,
        harga_beli: Number(newBahan.harga_beli),
      });
      if (ok) {
        setNewBahan({ id: generateRandomBahanId(), nama_bahan: '', ukuran_kemasan: '', satuan: 'gr', harga_beli: '' });
      }
    }
  };

  // Handler Resep di Form Menu
  const handleAddBahanToDraft = () => {
    if (!selectedBahanInput || !jumlahPemakaianInput || Number(jumlahPemakaianInput) <= 0) return;
    const b = bahanMap[selectedBahanInput];
    if (!b) return;

    const existingIdx = menuForm.resep.findIndex((r) => r.bahan_baku_id === selectedBahanInput);
    if (existingIdx >= 0) {
      const updated = [...menuForm.resep];
      updated[existingIdx].jumlah_pemakaian = Number(updated[existingIdx].jumlah_pemakaian) + Number(jumlahPemakaianInput);
      setMenuForm({ ...menuForm, resep: updated });
    } else {
      setMenuForm({
        ...menuForm,
        resep: [
          ...menuForm.resep,
          {
            bahan_baku_id: b.id,
            jumlah_pemakaian: Number(jumlahPemakaianInput),
            satuan_pemakaian: b.satuan,
          },
        ],
      });
    }
    setJumlahPemakaianInput('');
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!menuForm.nama_produk || menuForm.resep.length === 0 || !menuForm.harga_jual) {
      alert('Lengkapi nama produk, minimal 1 bahan baku, dan harga jual!');
      return;
    }

    const payload = {
      id: editingMenuId,
      nama_produk: menuForm.nama_produk,
      harga_jual: Number(menuForm.harga_jual),
      persentase_margin: Number(draftMenuCalc.marginFromHpp.toFixed(2)),
      resep: menuForm.resep,
    };

    const ok = await sendAction(editingMenuId ? 'UPDATE_MENU' : 'ADD_MENU', payload);
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

  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#2C1E16] flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigasi */}
      <aside className="w-full md:w-68 bg-[#231710] text-[#F5EBE0] flex flex-col justify-between p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3 pb-6 border-b border-[#3D291E]">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">KOPI JAWA</h1>
              <p className="text-xs text-amber-300/80 flex items-center gap-1">
                <Database className="w-3 h-3" /> TiDB MySQL Live
              </p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard & BEP', icon: LayoutDashboard },
              { id: 'bahan', label: 'Master Bahan Baku', icon: Package },
              { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
              { id: 'operasional', label: 'Operasional & Aset', icon: Receipt },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                      : 'text-[#D6C7B8] hover:bg-[#332218] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 pt-4 border-t border-[#3D291E] text-xs text-[#A69281] space-y-2">
          <div className="flex items-center justify-between">
            <span>Status Database</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Terhubung
            </span>
          </div>
          <button
            onClick={fetchAllData}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#332218] hover:bg-[#422C20] text-amber-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sinkronkan Data
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Koneksi Database Bermasalah</p>
              <p className="text-xs">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ================= TAB 1: DASHBOARD & BEP ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#231710]">Ringkasan Finansial Kedai</h2>
              <p className="text-sm text-[#7A6355]">Analisis harga jual menu, beban operasional harian, dan titik impas (BEP).</p>
            </div>

            {/* Bento Grid KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#EADFD5] shadow-sm">
                <div className="flex items-center justify-between text-[#7A6355] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Rata-Rata Harga Menu</span>
                  <Coffee className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-[#231710]">{formatRupiah(stats.avgHargaJual)}</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">Dari {menuEnriched.length} menu aktif di database</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#EADFD5] shadow-sm">
                <div className="flex items-center justify-between text-[#7A6355] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Operasional Bulanan</span>
                  <Receipt className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-[#231710]">{formatRupiah(stats.totalOpsBulanan)}</p>
                <p className="text-xs text-[#7A6355] mt-1">{operasional.length} pos pengeluaran tetap</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#EADFD5] shadow-sm">
                <div className="flex items-center justify-between text-[#7A6355] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Beban Harian (÷ 30)</span>
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-2xl font-bold text-[#231710]">{formatRupiah(stats.totalOpsHarian)}</p>
                <p className="text-xs text-rose-600 mt-1 font-medium">Target minimal tutup biaya/hari</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#EADFD5] shadow-sm">
                <div className="flex items-center justify-between text-[#7A6355] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Modal Inventaris Awal</span>
                  <Wallet className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-[#231710]">{formatRupiah(stats.totalInventaris)}</p>
                <p className="text-xs text-[#7A6355] mt-1">{inventaris.length} unit peralatan kedai</p>
              </div>
            </div>

            {/* Simulator BEP & Grafik Perbandingan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#EADFD5] shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-[#231710]">Simulator Break-Even Point (BEP) Harian</h3>
                    <p className="text-xs text-[#7A6355]">Geser target penjualan cup per hari untuk menguji kelayakan profit kedai.</p>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      stats.selisihBep >= 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {stats.selisihBep >= 0 ? 'LAYAK & PROFIT HARI INI' : 'BELUM MENUTUP BIAYA HARIAN'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF6F1] border border-[#EADFD5] space-y-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Simulasi Terjual: {targetCupHarian} Cup / Hari</span>
                    <span className="text-amber-700">Minimal BEP: {stats.minCupBep} Cup / Hari</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    value={targetCupHarian}
                    onChange={(e) => setTargetCupHarian(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#FAF6F1]">
                    <p className="text-xs text-[#7A6355]">Estimasi Profit Kotor/Hari</p>
                    <p className="text-lg font-bold text-[#231710] mt-1">{formatRupiah(stats.estimasiProfitHarian)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF6F1]">
                    <p className="text-xs text-[#7A6355]">Beban Operasional/Hari</p>
                    <p className="text-lg font-bold text-rose-600 mt-1">- {formatRupiah(stats.totalOpsHarian)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF6F1]">
                    <p className="text-xs text-[#7A6355]">Net Profit Bersih/Hari</p>
                    <p className={`text-lg font-bold mt-1 ${stats.selisihBep >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatRupiah(stats.selisihBep)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Perbandingan HPP vs Harga Jual */}
              <div className="bg-white p-6 rounded-2xl border border-[#EADFD5] shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-[#231710]">HPP vs Harga Jual</h3>
                <div className="space-y-4">
                  {menuEnriched.map((m) => {
                    const hppRatio = m.hargaJual > 0 ? Math.min(100, (m.totalHpp / m.hargaJual) * 100) : 0;
                    return (
                      <div key={m.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{m.nama_produk}</span>
                          <span className="text-emerald-700">+{m.marginPct.toFixed(0)}% Margin</span>
                        </div>
                        <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden flex">
                          <div style={{ width: `${hppRatio}%` }} className="bg-amber-700 h-full" title="Porsi HPP" />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#7A6355]">
                          <span>HPP: {formatRupiah(m.totalHpp)}</span>
                          <span>Jual: {formatRupiah(m.hargaJual)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MASTER BAHAN BAKU ================= */}
        {activeTab === 'bahan' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#231710]">Master Bahan Baku</h2>
              <p className="text-sm text-[#7A6355]">Setiap bahan baku memiliki Random Key ID unik dan menghitung harga per satuan secara otomatis.</p>
            </div>

            <form onSubmit={handleSaveBahan} className="bg-white p-6 rounded-2xl border border-[#EADFD5] shadow-sm grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-[#7A6355] mb-1">Random Key ID</label>
                <input
                  type="text"
                  readOnly
                  value={editingBahanId || newBahan.id}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F1] border border-[#EADFD5] text-xs font-mono font-bold text-amber-800"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#7A6355] mb-1">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Susu UHT Full Cream"
                  value={newBahan.nama_bahan}
                  onChange={(e) => setNewBahan({ ...newBahan, nama_bahan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFD5] text-sm focus:outline-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7A6355] mb-1">Ukuran Kemasan</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="1000"
                    value={newBahan.ukuran_kemasan}
                    onChange={(e) => setNewBahan({ ...newBahan, ukuran_kemasan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EADFD5] text-sm"
                  />
                  <select
                    value={newBahan.satuan}
                    onChange={(e) => setNewBahan({ ...newBahan, satuan: e.target.value })}
                    className="px-2 py-2 rounded-xl border border-[#EADFD5] text-sm bg-white"
                  >
                    <option value="gr">gr</option>
                    <option value="ml">ml</option>
                    <option value="Pcs">Pcs</option>
                    <option value="cup">cup</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7A6355] mb-1">Harga Beli (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="25000"
                  value={newBahan.harga_beli}
                  onChange={(e) => setNewBahan({ ...newBahan, harga_beli: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFD5] text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> {editingBahanId ? 'Update' : 'Simpan'}
                </button>
                {editingBahanId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBahanId(null);
                      setNewBahan({ id: generateRandomBahanId(), nama_bahan: '', ukuran_kemasan: '', satuan: 'gr', harga_beli: '' });
                    }}
                    className="px-3 py-2.5 rounded-xl bg-gray-200 text-gray-700 text-sm"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>

            <div className="bg-white rounded-2xl border border-[#EADFD5] shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF6F1] border-b border-[#EADFD5] text-xs uppercase text-[#7A6355]">
                    <th className="p-4">Key ID</th>
                    <th className="p-4">Nama Bahan</th>
                    <th className="p-4">Kemasan</th>
                    <th className="p-4">Harga Beli</th>
                    <th className="p-4">Harga / Satuan</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADFD5] text-sm">
                  {bahanBaku.map((b) => {
                    const unitPrice = Number(b.harga_beli) / Number(b.ukuran_kemasan);
                    return (
                      <tr key={b.id} className="hover:bg-[#FAF6F1]/60">
                        <td className="p-4 font-mono text-xs font-bold text-amber-800">{b.id}</td>
                        <td className="p-4 font-semibold">{b.nama_bahan}</td>
                        <td className="p-4">{Number(b.ukuran_kemasan)} {b.satuan}</td>
                        <td className="p-4">{formatRupiah(b.harga_beli)}</td>
                        <td className="p-4 font-semibold text-emerald-700">
                          {formatRupiah(unitPrice)} / {b.satuan}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingBahanId(b.id);
                              setNewBahan({
                                id: b.id,
                                nama_bahan: b.nama_bahan,
                                ukuran_kemasan: String(b.ukuran_kemasan),
                                satuan: b.satuan,
                                harga_beli: String(b.harga_beli),
                              });
                            }}
                            className="p-2 rounded-lg text-amber-700 hover:bg-amber-50"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus bahan ${b.nama_bahan}?`)) sendAction('DELETE_BAHAN', { id: b.id });
                            }}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MENU (2 LAYER) ================= */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#231710]">Manajemen Menu & Racikan HPP</h2>
              <p className="text-sm text-[#7A6355]">Layer 1 menampilkan daftar menu tersimpan di database; Layer 2 untuk meracik dan mengelola menu.</p>
            </div>

            {/* LAYER 1: LIST MENU TERSIMPAN DI DATABASE */}
            <section className="bg-white rounded-2xl border border-[#EADFD5] shadow-sm overflow-hidden">
              <div className="p-5 bg-[#231710] text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Layer 1</span>
                  <h3 className="font-bold text-lg">Daftar Menu Tersedia ({menuEnriched.length})</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF6F1] border-b border-[#EADFD5] text-xs uppercase text-[#7A6355]">
                      <th className="p-4">Nama Menu</th>
                      <th className="p-4">Komposisi Bahan</th>
                      <th className="p-4">Total HPP</th>
                      <th className="p-4">Harga Jual</th>
                      <th className="p-4">Profit & Margin</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADFD5] text-sm">
                    {menuEnriched.map((m) => (
                      <tr key={m.id} className="hover:bg-[#FAF6F1]/50 align-top">
                        <td className="p-4 font-bold text-[#231710]">{m.nama_produk}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {m.resep.map((r, idx) => {
                              const b = bahanMap[r.bahan_baku_id];
                              return (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-[#FAF6F1] border border-[#EADFD5] text-xs text-[#4A372B]"
                                >
                                  {b ? b.nama_bahan : r.bahan_baku_id} ({Number(r.jumlah_pemakaian)} {r.satuan_pemakaian})
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-amber-800">{formatRupiah(m.totalHpp)}</td>
                        <td className="p-4 font-bold text-[#231710]">{formatRupiah(m.hargaJual)}</td>
                        <td className="p-4">
                          <div className="font-bold text-emerald-700">+{formatRupiah(m.profit)}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                            Margin {m.marginPct.toFixed(2)}% dari HPP
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => startEditMenu(m)}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus menu ${m.nama_produk}?`)) sendAction('DELETE_MENU', { id: m.id });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* LAYER 2: CRUD MENU (NAMA -> BAHAN & PROGRESS HPP -> HARGA JUAL -> OTOMATIS MARGIN %) */}
            <section id="layer-crud-menu" className="bg-white rounded-2xl border border-[#EADFD5] shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#EADFD5] pb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-600 font-bold">Layer 2 • Form CRUD Menu</span>
                  <h3 className="font-bold text-xl text-[#231710]">
                    {editingMenuId ? `Edit Menu: ${menuForm.nama_produk}` : 'Tambah Menu & Racikan Baru'}
                  </h3>
                </div>
                {editingMenuId && (
                  <button
                    onClick={() => {
                      setEditingMenuId(null);
                      setMenuForm({ nama_produk: '', harga_jual: '', resep: [] });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveMenu} className="space-y-6">
                {/* Step 1: Nama Produk */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6355] mb-2">
                    1. Nama Produk / Menu
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Susu Gula Aren"
                    value={menuForm.nama_produk}
                    onChange={(e) => setMenuForm({ ...menuForm, nama_produk: e.target.value })}
                    className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-[#EADFD5] text-sm font-semibold focus:outline-amber-600"
                  />
                </div>

                {/* Step 2: Pilih Komposisi Bahan & Progress Subtotal HPP */}
                <div className="p-5 rounded-2xl bg-[#FAF6F1] border border-[#EADFD5] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#7A6355]">
                      2. Komposisi Bahan Baku & Akumulasi HPP
                    </label>
                    <div className="px-4 py-1.5 rounded-xl bg-amber-900 text-amber-100 text-xs font-bold">
                      Subtotal HPP Terkini: {formatRupiah(draftMenuCalc.subtotalHpp)}
                    </div>
                  </div>

                  {/* Progress Bar Visual Subtotal HPP */}
                  <div className="w-full h-2.5 bg-[#EADFD5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-700 transition-all duration-300"
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

                  {/* Input Tambah Bahan ke Resep */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                      value={selectedBahanInput}
                      onChange={(e) => setSelectedBahanInput(e.target.value)}
                      className="md:col-span-2 px-3 py-2.5 rounded-xl border border-[#EADFD5] bg-white text-sm"
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
                      className="px-3 py-2.5 rounded-xl border border-[#EADFD5] bg-white text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddBahanToDraft}
                      className="bg-[#231710] hover:bg-[#3A271C] text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Tambah Bahan
                    </button>
                  </div>

                  {/* Daftar Bahan Terpilih */}
                  {menuForm.resep.length > 0 && (
                    <div className="divide-y divide-[#EADFD5] bg-white rounded-xl border border-[#EADFD5] px-4">
                      {menuForm.resep.map((item, idx) => {
                        const b = bahanMap[item.bahan_baku_id];
                        const cost = b ? Number(item.jumlah_pemakaian) * b.harga_per_unit : 0;
                        return (
                          <div key={idx} className="py-3 flex items-center justify-between text-sm">
                            <div>
                              <span className="font-semibold">{b ? b.nama_bahan : item.bahan_baku_id}</span>
                              <span className="text-xs text-[#7A6355] ml-2">
                                ({item.jumlah_pemakaian} {item.satuan_pemakaian})
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-amber-800">{formatRupiah(cost)}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setMenuForm({
                                    ...menuForm,
                                    resep: menuForm.resep.filter((_, i) => i !== idx),
                                  })
                                }
                                className="text-rose-600 hover:text-rose-800"
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

                {/* Step 3: Input Harga Jual & Otomatis Kalkulasi Persentase Margin dari HPP */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50/40 border border-emerald-200 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
                      3. Tentukan Harga Jual (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 15000"
                      value={menuForm.harga_jual}
                      onChange={(e) => setMenuForm({ ...menuForm, harga_jual: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-300 bg-white text-base font-bold text-[#231710] focus:outline-emerald-600"
                    />
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-emerald-200">
                    <p className="text-xs text-[#7A6355]">Profit Kotor per Cup</p>
                    <p className={`text-xl font-bold mt-0.5 ${draftMenuCalc.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatRupiah(draftMenuCalc.profit)}
                    </p>
                    <p className="text-[11px] text-[#7A6355] mt-0.5">
                      Harga Jual - Total HPP ({formatRupiah(draftMenuCalc.subtotalHpp)})
                    </p>
                  </div>

                  <div className="bg-emerald-700 text-white p-4 rounded-xl shadow-sm">
                    <p className="text-xs text-emerald-100">Persentase Margin dari HPP</p>
                    <p className="text-2xl font-extrabold mt-0.5">
                      {draftMenuCalc.marginFromHpp >= 0 ? '+' : ''}
                      {draftMenuCalc.marginFromHpp.toFixed(2)}%
                    </p>
                    <p className="text-[11px] text-emerald-200 mt-0.5">Otomatis dihitung dari modal HPP</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-xl shadow-md flex items-center gap-2 transition"
                  >
                    <Check className="w-5 h-5" />
                    {editingMenuId ? 'Simpan Perubahan Menu' : 'Simpan Menu ke Database'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ================= TAB 4: OPERASIONAL & INVENTARIS ================= */}
        {activeTab === 'operasional' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Biaya Operasional */}
            <div className="bg-white p-6 rounded-2xl border border-[#EADFD5] shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-[#231710]">Biaya Operasional Bulanan</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await sendAction('ADD_OPERASIONAL', {
                    ...newOps,
                    biaya_bulanan: Number(newOps.biaya_bulanan),
                  });
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
                  className="px-3 py-2 rounded-xl border border-[#EADFD5] text-sm"
                />
                <input
                  type="number"
                  required
                  placeholder="Biaya/bulan (Rp)"
                  value={newOps.biaya_bulanan}
                  onChange={(e) => setNewOps({ ...newOps, biaya_bulanan: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#EADFD5] text-sm"
                />
                <button type="submit" className="bg-amber-600 text-white rounded-xl text-sm font-semibold py-2">
                  + Tambah
                </button>
              </form>

              <div className="divide-y divide-[#EADFD5]">
                {operasional.map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold">{o.nama_kebutuhan}</p>
                      <p className="text-xs text-[#7A6355]">{o.catatan || o.periode}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{formatRupiah(o.biaya_bulanan)}</span>
                      <button
                        onClick={() => sendAction('DELETE_OPERASIONAL', { id: o.id })}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventaris Awal */}
            <div className="bg-white p-6 rounded-2xl border border-[#EADFD5] shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-[#231710]">Inventaris & Aset Awal</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await sendAction('ADD_INVENTARIS', {
                    ...newInv,
                    harga_barang: Number(newInv.harga_barang),
                  });
                  if (ok) setNewInv({ nama_barang: '', kondisi: 'Baru', harga_barang: '', status_kebutuhan: 'Terpenuhi' });
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2"
              >
                <input
                  type="text"
                  required
                  placeholder="Nama barang"
                  value={newInv.nama_barang}
                  onChange={(e) => setNewInv({ ...newInv, nama_barang: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#EADFD5] text-sm"
                />
                <input
                  type="number"
                  required
                  placeholder="Harga (Rp)"
                  value={newInv.harga_barang}
                  onChange={(e) => setNewInv({ ...newInv, harga_barang: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#EADFD5] text-sm"
                />
                <button type="submit" className="bg-amber-600 text-white rounded-xl text-sm font-semibold py-2">
                  + Tambah
                </button>
              </form>

              <div className="divide-y divide-[#EADFD5]">
                {inventaris.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold">{inv.nama_barang}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#FAF6F1] text-[#7A6355]">{inv.kondisi}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{formatRupiah(inv.harga_barang)}</span>
                      <button
                        onClick={() =>
                          sendAction('TOGGLE_INVENTARIS', {
                            id: inv.id,
                            status_kebutuhan: inv.status_kebutuhan === 'Terpenuhi' ? 'Belum Terpenuhi' : 'Terpenuhi',
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          inv.status_kebutuhan === 'Terpenuhi'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status_kebutuhan}
                      </button>
                      <button
                        onClick={() => sendAction('DELETE_INVENTARIS', { id: inv.id })}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}