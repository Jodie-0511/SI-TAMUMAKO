"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type User = { id: string; nama: string; username: string; role: "admin" | "petugas"; created_at?: string };
type Visit = {
  id: string;
  status: "Menunggu Konfirmasi" | "Sedang di Dalam Kantor" | "Telah Meninggalkan Kantor" | "Ditolak";
  tujuan: string;
  keperluan: string;
  waktu_masuk: string | null;
  waktu_keluar: string | null;
  petugas_masuk: string | null;
  petugas_keluar: string | null;
  petugas_tolak: string | null;
  sumber: string | null;
  created_at: string;
  guests: {
    id: string;
    nama: string;
    nik: string | null;
    instansi: string | null;
    hp: string | null;
    foto_base64: string | null;
    created_at: string;
  };
};

const tabs = [
  ["dashboard", "Dashboard"],
  ["monitoring", "Monitoring Penjagaan"],
  ["riwayat", "Riwayat Kunjungan"],
  ["laporan", "Laporan PDF"],
  ["pengguna", "Kelola Petugas Jaga"]
] as const;

function fmt(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function badge(status: Visit["status"]) {
  const cls = status === "Menunggu Konfirmasi" ? "wait" : status === "Sedang di Dalam Kantor" ? "in" : status === "Telah Meninggalkan Kantor" ? "left" : "reject";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function escapeHtml(value: unknown) {
  return String(value ?? "-").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char] || char));
}

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState("dashboard");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadSession() {
    const res = await fetch("/api/session");
    const json = await res.json();
    setUser(json.user);
    setHasAdmin(json.hasAdmin);
  }

  async function loadVisits() {
    const res = await fetch("/api/visits");
    const json = await res.json();
    if (res.ok) setVisits(json.visits || []);
  }

  async function loadUsers() {
    const res = await fetch("/api/users");
    const json = await res.json();
    if (res.ok) setUsers(json.users || []);
  }

  async function refreshAll() {
    await loadSession();
    await loadVisits();
    await loadUsers();
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const activeVisits = visits.filter(v => v.status !== "Telah Meninggalkan Kantor");
  const filteredActive = activeVisits.filter(v => `${v.guests.nama} ${v.guests.instansi} ${v.tujuan} ${v.keperluan} ${v.status}`.toLowerCase().includes(search.toLowerCase()));
  const filteredHistory = visits.filter(v => `${v.guests.nama} ${v.guests.nik} ${v.guests.instansi} ${v.tujuan} ${v.status}`.toLowerCase().includes(search.toLowerCase()));

  const stats = useMemo(() => ({
    today: visits.filter(v => v.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    inside: visits.filter(v => v.status === "Sedang di Dalam Kantor").length,
    waiting: visits.filter(v => v.status === "Menunggu Konfirmasi").length,
    left: visits.filter(v => v.status === "Telah Meninggalkan Kantor").length
  }), [visits]);

  async function setupAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/setup-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: form.get("nama"),
        username: form.get("username"),
        password: form.get("password")
      })
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal membuat administrator.");
      return;
    }
    showToast("Administrator utama berhasil dibuat.");
    await refreshAll();
  }

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Username atau password salah.");
      (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value = "";
      return;
    }
    await refreshAll();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setTab("dashboard");
  }

  async function addPetugas(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: form.get("nama"), username: form.get("username"), password: form.get("password") })
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(json.error || "Gagal menambah petugas.");
      return;
    }
    e.currentTarget.reset();
    showToast("Petugas jaga berhasil ditambahkan.");
    await loadUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm("Hapus akun petugas ini?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      showToast(json.error || "Gagal menghapus akun.");
      return;
    }
    showToast("Akun petugas dihapus.");
    await loadUsers();
  }

  async function setStatus(id: string, status: Visit["status"]) {
    const res = await fetch(`/api/visits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(json.error || "Gagal mengubah status.");
      return;
    }
    showToast("Status berhasil diperbarui.");
    await loadVisits();
  }

  async function deleteVisit(id: string) {
    if (!confirm("Hapus data kunjungan ini?")) return;
    const res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      showToast(json.error || "Gagal menghapus data.");
      return;
    }
    showToast("Data kunjungan dihapus.");
    await loadVisits();
  }

  function printHtml(title: string, body: string, paraf = user?.nama || "Petugas Jaga") {
    const w = window.open("", "_blank");
    if (!w) return showToast("Popup diblokir browser.");
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>
      @page{size:A4;margin:15mm}body{font-family:Arial;color:#111;line-height:1.45}.kop{display:flex;gap:14px;align-items:center;border-bottom:4px solid #b8860b;padding-bottom:12px;margin-bottom:16px}.kop img{width:72px;height:72px;object-fit:contain}.kop h1{margin:0;font-size:22px}.kop p{margin:4px 0 0;color:#555;font-size:12px}.title{text-align:center;border:1px solid #d1a72c;background:#fff8db;padding:10px;font-weight:bold;margin:16px 0;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}th,td{border:1px solid #d1d5db;padding:7px;vertical-align:top;text-align:left}th{background:#111827;color:#facc15}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.summary div{border:1px solid #d1a72c;background:#fff8db;padding:10px;text-align:center}.summary strong{display:block;font-size:22px}.photo{width:120px;height:120px;object-fit:cover;border:1px solid #ccc}.paraf{margin-top:20px;border:1px solid #d1a72c;background:#fffdf2;padding:12px}.ttd{margin-top:22px;display:flex;justify-content:flex-end}.box{text-align:center;width:260px}.nama{border:1px solid #111;padding:10px;font-weight:bold;margin:12px 0}
    </style></head><body>
      <div class="kop"><img src="/assets/logo-si-tamu.png"/><div><h1>SI-TAMU MAKO</h1><p>Sistem Informasi Tamu Markas Komando</p><p>Database Online Terpusat</p></div></div>
      <div class="title">${escapeHtml(title)}</div><p>Dicetak: ${new Date().toLocaleString("id-ID")}</p>${body}
      <div class="paraf"><b>Paraf Digital:</b> ${escapeHtml(paraf)}<br/><b>Role:</b> ${escapeHtml(user?.role || "-")}</div>
      <div class="ttd"><div class="box"><p>Diparaf / Diverifikasi oleh</p><div class="nama">${escapeHtml(paraf)}</div><p>${escapeHtml(user?.role || "-")}</p></div></div>
      <script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script>
    </body></html>`);
    w.document.close();
  }

  function guestPdf(v: Visit) {
    const body = `<table>
      <tr><th>Nama</th><td>${escapeHtml(v.guests.nama)}</td></tr>
      <tr><th>NIK</th><td>${escapeHtml(v.guests.nik)}</td></tr>
      <tr><th>Instansi</th><td>${escapeHtml(v.guests.instansi)}</td></tr>
      <tr><th>HP</th><td>${escapeHtml(v.guests.hp)}</td></tr>
      <tr><th>Tujuan</th><td>${escapeHtml(v.tujuan)}</td></tr>
      <tr><th>Keperluan</th><td>${escapeHtml(v.keperluan)}</td></tr>
      <tr><th>Status</th><td>${escapeHtml(v.status)}</td></tr>
      <tr><th>Daftar</th><td>${escapeHtml(fmt(v.created_at))}</td></tr>
      <tr><th>Masuk</th><td>${escapeHtml(fmt(v.waktu_masuk))}</td></tr>
      <tr><th>Paraf Masuk</th><td>${escapeHtml(v.petugas_masuk)}</td></tr>
      <tr><th>Keluar</th><td>${escapeHtml(fmt(v.waktu_keluar))}</td></tr>
      <tr><th>Paraf Keluar</th><td>${escapeHtml(v.petugas_keluar)}</td></tr>
      <tr><th>Foto</th><td>${v.guests.foto_base64 ? `<img class="photo" src="${v.guests.foto_base64}"/>` : "-"}</td></tr>
    </table>`;
    printHtml(`Detail Data Tamu - ${v.guests.nama}`, body, v.petugas_keluar || v.petugas_masuk || v.petugas_tolak || user?.nama);
  }

  function rangeVisits() {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    return visits.filter(v => {
      const d = new Date(v.created_at);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }

  function rangePdf() {
    const data = rangeVisits();
    const body = `<p><b>Periode:</b> ${escapeHtml(startDate || "-")} s.d. ${escapeHtml(endDate || "-")}</p>
      <div class="summary"><div>Total<strong>${data.length}</strong></div><div>Menunggu<strong>${data.filter(v=>v.status==="Menunggu Konfirmasi").length}</strong></div><div>Di Dalam<strong>${data.filter(v=>v.status==="Sedang di Dalam Kantor").length}</strong></div><div>Meninggalkan<strong>${data.filter(v=>v.status==="Telah Meninggalkan Kantor").length}</strong></div></div>
      <table><thead><tr><th>No</th><th>Nama</th><th>NIK</th><th>Instansi</th><th>Tujuan</th><th>Keperluan</th><th>Status</th><th>Daftar</th><th>Masuk</th><th>Keluar</th><th>Paraf</th></tr></thead><tbody>
      ${data.map((v,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(v.guests.nama)}</td><td>${escapeHtml(v.guests.nik)}</td><td>${escapeHtml(v.guests.instansi)}</td><td>${escapeHtml(v.tujuan)}</td><td>${escapeHtml(v.keperluan)}</td><td>${escapeHtml(v.status)}</td><td>${escapeHtml(fmt(v.created_at))}</td><td>${escapeHtml(fmt(v.waktu_masuk))}</td><td>${escapeHtml(fmt(v.waktu_keluar))}</td><td>${escapeHtml(v.petugas_masuk || v.petugas_keluar || v.petugas_tolak)}</td></tr>`).join("") || `<tr><td colspan="11">Tidak ada data.</td></tr>`}
      </tbody></table>`;
    printHtml("Rekap Kunjungan Tamu", body);
  }

  function exportCsv() {
    const rows = visits.map(v => [v.id, v.guests.nama, v.guests.nik || "", v.guests.instansi || "", v.guests.hp || "", v.tujuan, v.keperluan, v.status, fmt(v.created_at), fmt(v.waktu_masuk), fmt(v.waktu_keluar), v.petugas_masuk || "", v.petugas_keluar || ""]);
    const header = ["id","nama","nik","instansi","hp","tujuan","keperluan","status","daftar","masuk","keluar","petugas_masuk","petugas_keluar"];
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replaceAll('"','""')}"`).join(",")).join("\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "data-tamu-si-tamu-mako.csv"; a.click(); URL.revokeObjectURL(url);
  }

  if (hasAdmin === null) {
    return <main className="page-center"><section className="auth-card"><p className="muted">Memuat aplikasi...</p></section></main>;
  }

  if (!hasAdmin) {
    return (
      <main className="page-center">
        <section className="auth-card">
          <div className="auth-title">
            <img src="/assets/logo-si-tamu.png" alt="Logo" />
            <h1>Setup Administrator Utama</h1>
            <p className="muted">Buat satu akun administrator utama. Setelah dibuat, administrator tidak dapat dibuat ulang.</p>
          </div>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={setupAdmin}>
            <label>Nama Administrator<input name="nama" required placeholder="Nama lengkap administrator" /></label>
            <label>Username<input name="username" required placeholder="Username administrator" /></label>
            <label>Password<input name="password" type="password" required minLength={4} placeholder="Minimal 4 karakter" /></label>
            <button className="btn btn-primary full">Buat Administrator Utama</button>
          </form>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-center">
        <section className="auth-card">
          <div className="auth-title">
            <img src="/assets/logo-si-tamu.png" alt="Logo" />
            <h1>Login SI-TAMU MAKO</h1>
            <p className="muted">Masuk menggunakan akun administrator atau petugas jaga.</p>
          </div>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={login}>
            <label>Username<input name="username" required placeholder="Masukkan username" /></label>
            <label>Password<input name="password" type="password" required placeholder="Masukkan password" /></label>
            <button className="btn btn-primary full">Login</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="side-brand">
          <img src="/assets/logo-si-tamu.png" alt="Logo" />
          <div><h2>SI-TAMU</h2><p>MAKO</p></div>
        </div>
        <nav>
          {tabs.filter(t => t[0] !== "pengguna" || user.role === "admin").map(([id, label]) => (
            <button key={id} className={`nav-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-badge">{user.role === "admin" ? "Administrator Utama" : "Petugas Jaga"}<br/><b>{user.nama}</b></div>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div><span className="kicker">Panel Kendali</span><h1>{tabs.find(t => t[0] === tab)?.[1]}</h1></div>
          <button className="btn btn-outline" onClick={exportCsv}>Export CSV</button>
        </header>

        {tab === "dashboard" && (
          <>
            <div className="cards">
              <div className="card"><span>Total Hari Ini</span><strong>{stats.today}</strong></div>
              <div className="card"><span>Sedang di Dalam Kantor</span><strong>{stats.inside}</strong></div>
              <div className="card"><span>Menunggu Konfirmasi</span><strong>{stats.waiting}</strong></div>
              <div className="card"><span>Telah Meninggalkan</span><strong>{stats.left}</strong></div>
            </div>
            <div className="panel"><div className="panel-head"><h2>Tamu Terbaru</h2><a className="btn btn-primary" href="/tamu" target="_blank">Buka Form Tamu</a></div><VisitTable visits={visits.slice(0,6)} simple onPdf={guestPdf} /></div>
          </>
        )}

        {tab === "monitoring" && (
          <div className="panel">
            <div className="panel-head"><h2>Monitoring Tamu Aktif</h2><input style={{ maxWidth: 360 }} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari tamu..." /></div>
            <VisitTable visits={filteredActive} onPdf={guestPdf} onStatus={setStatus} canDelete={user.role==="admin"} onDelete={deleteVisit} />
          </div>
        )}

        {tab === "riwayat" && (
          <div className="panel">
            <div className="panel-head"><h2>Riwayat Kunjungan</h2><input style={{ maxWidth: 360 }} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari riwayat..." /></div>
            <VisitTable visits={filteredHistory} history onPdf={guestPdf} canDelete={user.role==="admin"} onDelete={deleteVisit} />
          </div>
        )}

        {tab === "laporan" && (
          <div className="panel">
            <div className="panel-head"><h2>Laporan PDF</h2></div>
            <div className="grid-2">
              <div className="card">
                <h3>Rekap Rentang Tanggal</h3>
                <p className="muted">Pilih tanggal mulai dan akhir untuk membuat laporan evaluasi.</p>
                <div className="date-grid">
                  <label>Tanggal Mulai<input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></label>
                  <label>Tanggal Akhir<input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></label>
                </div>
                <button className="btn btn-primary full" onClick={rangePdf}>Unduh Rekap PDF</button>
              </div>
              <div className="card">
                <h3>Database Semua Tamu</h3>
                <p className="muted">Cetak seluruh data tamu yang tersedia pada database online.</p>
                <button className="btn btn-outline full" onClick={() => { setStartDate(""); setEndDate(""); setTimeout(rangePdf, 0); }}>Unduh Semua Data PDF</button>
              </div>
            </div>
          </div>
        )}

        {tab === "pengguna" && user.role === "admin" && (
          <div className="panel">
            <div className="panel-head"><h2>Kelola Akun Petugas Jaga</h2></div>
            <div className="user-grid">
              <form className="card" onSubmit={addPetugas}>
                <h3>Tambah Petugas Jaga</h3>
                <label>Nama Lengkap<input name="nama" required placeholder="Nama petugas" /></label>
                <label>Username<input name="username" required placeholder="Username petugas" /></label>
                <label>Password<input name="password" type="password" required minLength={4} placeholder="Minimal 4 karakter" /></label>
                <button className="btn btn-primary full">Simpan Petugas</button>
              </form>
              <div className="card">
                <h3>Daftar Akun</h3>
                <div className="table-wrap"><table><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Aksi</th></tr></thead><tbody>
                  {users.map(u => <tr key={u.id}><td>{u.nama}</td><td>{u.username}</td><td>{u.role === "admin" ? "Administrator Utama" : "Petugas Jaga"}</td><td>{u.role === "admin" ? <span className="muted">Admin utama</span> : <button className="btn btn-danger btn-small" onClick={()=>deleteUser(u.id)}>Hapus</button>}</td></tr>)}
                </tbody></table></div>
              </div>
            </div>
          </div>
        )}
      </section>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function VisitTable({ visits, simple, history, onPdf, onStatus, canDelete, onDelete }: {
  visits: Visit[];
  simple?: boolean;
  history?: boolean;
  onPdf: (v: Visit) => void;
  onStatus?: (id: string, status: Visit["status"]) => void;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Foto</th><th>Nama</th><th>Instansi</th><th>Tujuan</th><th>Keperluan</th><th>Status</th><th>Waktu</th>{!simple && <th>Aksi</th>}<th>PDF</th>{(history || canDelete) && <th>Hapus</th>}
          </tr>
        </thead>
        <tbody>
          {visits.length === 0 ? <tr><td colSpan={10}>Belum ada data.</td></tr> : visits.map(v => (
            <tr key={v.id}>
              <td>{v.guests.foto_base64 ? <img className="guest-photo" src={v.guests.foto_base64} alt="Foto" /> : <div className="guest-photo" />}</td>
              <td><b>{v.guests.nama}</b><br/><small>{v.guests.hp || "-"}</small></td>
              <td>{v.guests.instansi || "-"}</td>
              <td>{v.tujuan}</td>
              <td>{v.keperluan}</td>
              <td>{badge(v.status)}</td>
              <td><b>Daftar:</b> {fmt(v.created_at)}<br/><b>Masuk:</b> {fmt(v.waktu_masuk)}<br/><b>Keluar:</b> {fmt(v.waktu_keluar)}<br/><small>{v.petugas_masuk || v.petugas_keluar || v.petugas_tolak || ""}</small></td>
              {!simple && <td><div className="actions">
                {onStatus && v.status === "Menunggu Konfirmasi" && <><button className="btn btn-success btn-small" onClick={()=>onStatus(v.id,"Sedang di Dalam Kantor")}>Masuk</button><button className="btn btn-danger btn-small" onClick={()=>onStatus(v.id,"Ditolak")}>Tolak</button></>}
                {onStatus && v.status === "Sedang di Dalam Kantor" && <button className="btn btn-primary btn-small" onClick={()=>onStatus(v.id,"Telah Meninggalkan Kantor")}>Keluar</button>}
                {onStatus && v.status === "Ditolak" && <button className="btn btn-success btn-small" onClick={()=>onStatus(v.id,"Sedang di Dalam Kantor")}>Izinkan</button>}
                {onStatus && v.status === "Telah Meninggalkan Kantor" && <span className="muted">Selesai</span>}
              </div></td>}
              <td><button className="btn btn-outline btn-small" onClick={()=>onPdf(v)}>PDF</button></td>
              {(history || canDelete) && <td>{canDelete && onDelete ? <button className="btn btn-danger btn-small" onClick={()=>onDelete(v.id)}>Hapus</button> : <span className="muted">Admin saja</span>}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
