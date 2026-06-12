"use client";

import { FormEvent, useRef, useState } from "react";

export default function TamuForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [foto, setFoto] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Kamera tidak dapat diakses. Form tetap bisa dikirim tanpa foto.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFoto(canvas.toDataURL("image/jpeg", 0.78));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      nama: form.get("nama"),
      nik: form.get("nik"),
      instansi: form.get("instansi"),
      hp: form.get("hp"),
      tujuan: form.get("tujuan"),
      keperluan: form.get("keperluan"),
      foto_base64: foto
    };

    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Gagal mengirim data.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main className="page-center">
        <section className="auth-card">
          <div className="auth-title">
            <img src="/assets/logo-si-tamu.png" alt="Logo" />
            <h1>Registrasi Berhasil</h1>
            <p className="muted">Data Anda sudah masuk ke sistem. Silakan menunggu arahan petugas jaga.</p>
          </div>
          <button className="btn btn-primary full" onClick={() => location.reload()}>Isi Tamu Baru</button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-center">
      <section className="auth-card" style={{ width: "min(820px, 100%)" }}>
        <div className="auth-title">
          <img src="/assets/logo-si-tamu.png" alt="Logo" />
          <h1>SI-TAMU MAKO</h1>
          <p className="muted">Form Registrasi Tamu</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={submit}>
          <div className="grid-2">
            <label>Nama Lengkap<input name="nama" required placeholder="Masukkan nama lengkap" /></label>
            <label>NIK / Nomor Identitas<input name="nik" placeholder="Masukkan NIK atau identitas" /></label>
            <label>Instansi / Alamat<input name="instansi" placeholder="Instansi atau alamat" /></label>
            <label>Nomor HP<input name="hp" placeholder="08xxxxxxxxxx" /></label>
            <label>Tujuan / Ruangan<input name="tujuan" required placeholder="Contoh: Subbagrenmin" /></label>
            <label>Keperluan<textarea name="keperluan" required rows={4} placeholder="Tuliskan keperluan kunjungan" /></label>
          </div>

          <div className="camera">
            <p className="muted"><b>Foto Wajah Tamu</b></p>
            <video ref={videoRef} autoPlay playsInline />
            {foto && <img className="preview" src={foto} alt="Preview foto" />}
            <div className="actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-outline" onClick={startCamera}>Aktifkan Kamera</button>
              <button type="button" className="btn btn-primary" onClick={capturePhoto}>Ambil Foto</button>
            </div>
          </div>

          <button className="btn btn-primary full" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? "Mengirim..." : "Kirim Registrasi"}
          </button>
        </form>
      </section>
    </main>
  );
}
