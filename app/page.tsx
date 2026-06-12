import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-center">
      <section className="front-card">
        <div className="logo-wrap">
          <img src="/assets/logo-si-tamu.png" alt="Logo SI-TAMU MAKO" className="logo" />
        </div>
        <span className="kicker">Sistem Informasi Tamu Markas Komando</span>
        <h1>SI-TAMU MAKO</h1>
        <p className="subtitle">
          Aplikasi buku tamu digital untuk mencatat identitas, memantau status kunjungan,
          dan membantu pengamanan tamu di lingkungan mako secara tertib, rapi, dan terdata.
        </p>
        <div className="front-actions">
          <Link className="btn btn-primary" href="/tamu">Masuk sebagai Tamu</Link>
          <Link className="btn btn-outline" href="/admin">Login Admin / Petugas Jaga</Link>
        </div>
        <p className="front-note">Database online terpusat untuk penggunaan lintas perangkat.</p>
      </section>
    </main>
  );
}
