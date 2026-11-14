import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [bahanBaku] = await pool.query('SELECT * FROM bahan_baku ORDER BY created_at DESC');
    const [produk] = await pool.query('SELECT * FROM produk ORDER BY created_at DESC');
    const [resepDetail] = await pool.query('SELECT * FROM resep_detail');
    const [operasional] = await pool.query('SELECT * FROM biaya_operasional');
    const [inventaris] = await pool.query('SELECT * FROM inventaris_awal');

    return NextResponse.json({
      bahanBaku,
      produk,
      resepDetail,
      operasional,
      inventaris,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const connection = await pool.getConnection();
  try {
    const { action, payload } = await request.json();

    if (action === 'ADD_BAHAN') {
      const { id, nama_bahan, ukuran_kemasan, satuan, harga_beli } = payload;
      await connection.query(
        'INSERT INTO bahan_baku (id, nama_bahan, ukuran_kemasan, satuan, harga_beli) VALUES (?, ?, ?, ?, ?)',
        [id, nama_bahan, ukuran_kemasan, satuan, harga_beli]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE_BAHAN') {
      const { id, nama_bahan, ukuran_kemasan, satuan, harga_beli } = payload;
      await connection.query(
        'UPDATE bahan_baku SET nama_bahan = ?, ukuran_kemasan = ?, satuan = ?, harga_beli = ? WHERE id = ?',
        [nama_bahan, ukuran_kemasan, satuan, harga_beli, id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'DELETE_BAHAN') {
      await connection.query('DELETE FROM bahan_baku WHERE id = ?', [payload.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'ADD_MENU') {
      await connection.beginTransaction();
      const { nama_produk, harga_jual, persentase_margin, resep } = payload;
      const [resProduk] = await connection.query(
        'INSERT INTO produk (nama_produk, harga_jual, persentase_margin) VALUES (?, ?, ?)',
        [nama_produk, harga_jual, persentase_margin]
      );
      const produkId = resProduk.insertId;

      for (const item of resep) {
        await connection.query(
          'INSERT INTO resep_detail (produk_id, bahan_baku_id, jumlah_pemakaian, satuan_pemakaian) VALUES (?, ?, ?, ?)',
          [produkId, item.bahan_baku_id, item.jumlah_pemakaian, item.satuan_pemakaian]
        );
      }
      await connection.commit();
      return NextResponse.json({ success: true, id: produkId });
    }

    if (action === 'UPDATE_MENU') {
      await connection.beginTransaction();
      const { id, nama_produk, harga_jual, persentase_margin, resep } = payload;
      await connection.query(
        'UPDATE produk SET nama_produk = ?, harga_jual = ?, persentase_margin = ? WHERE id = ?',
        [nama_produk, harga_jual, persentase_margin, id]
      );
      await connection.query('DELETE FROM resep_detail WHERE produk_id = ?', [id]);
      for (const item of resep) {
        await connection.query(
          'INSERT INTO resep_detail (produk_id, bahan_baku_id, jumlah_pemakaian, satuan_pemakaian) VALUES (?, ?, ?, ?)',
          [id, item.bahan_baku_id, item.jumlah_pemakaian, item.satuan_pemakaian]
        );
      }
      await connection.commit();
      return NextResponse.json({ success: true });
    }

    if (action === 'DELETE_MENU') {
      await connection.query('DELETE FROM produk WHERE id = ?', [payload.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'ADD_OPERASIONAL') {
      const { nama_kebutuhan, periode, biaya_bulanan, catatan } = payload;
      const [res] = await connection.query(
        'INSERT INTO biaya_operasional (nama_kebutuhan, periode, biaya_bulanan, catatan) VALUES (?, ?, ?, ?)',
        [nama_kebutuhan, periode || '1 Bulan', biaya_bulanan, catatan || '']
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (action === 'DELETE_OPERASIONAL') {
      await connection.query('DELETE FROM biaya_operasional WHERE id = ?', [payload.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'ADD_INVENTARIS') {
      const { nama_barang, kondisi, harga_barang, status_kebutuhan } = payload;
      const [res] = await connection.query(
        'INSERT INTO inventaris_awal (nama_barang, kondisi, harga_barang, status_kebutuhan) VALUES (?, ?, ?, ?)',
        [nama_barang, kondisi, harga_barang, status_kebutuhan]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (action === 'TOGGLE_INVENTARIS') {
      await connection.query(
        'UPDATE inventaris_awal SET status_kebutuhan = ? WHERE id = ?',
        [payload.status_kebutuhan, payload.id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'DELETE_INVENTARIS') {
      await connection.query('DELETE FROM inventaris_awal WHERE id = ?', [payload.id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
