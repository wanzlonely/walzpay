
"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client-auth";

function BrandMark() {
  return (
    <span className="brand-mark">
      <img
        src="https://i.postimg.cc/3xVZxXz9/walzpay-app-icon.png"
        alt="WALZPAY"
      />
    </span>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 20 6v5.5c0 4.8-3.4 7.9-8 9.5-4.6-1.6-8-4.7-8-9.5V6l8-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 12 2.3 2.3 4.8-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const emailTouched = useRef(false);
  const passTouched = useRef(false);

  const validateEmail = (value: string) =>
    !value
      ? "Email wajib diisi"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? "Format email tidak valid"
        : null;

  const validatePassword = (value: string) =>
    !value
      ? "Password wajib diisi"
      : value.length < 6
        ? "Password minimal 6 karakter"
        : null;

  const formReady = Boolean(email && password);
  const inputClass = "auth-input";

  const handleLogin = async () => {
    emailTouched.current = true;
    passTouched.current = true;

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setEmailErr(eErr);
    setPassErr(pErr);

    if (eErr || pErr) return;

    setServerErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      saveSession(json.data.token, json.data.user);
      router.push("/");
    } catch (err: any) {
      const msg = err.message || "Gagal login";

      if (
        msg.toLowerCase().includes("email") ||
        msg.toLowerCase().includes("terdaftar") ||
        msg.toLowerCase().includes("ditemukan")
      ) {
        setEmailErr(msg);
      } else if (
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("salah") ||
        msg.toLowerCase().includes("kata sandi")
      ) {
        setPassErr(msg);
      } else {
        setServerErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter") handleLogin();
  };

  return (
    <main className="auth-page">
      <div className="auth-grid-lines" aria-hidden="true" />
      <div className="auth-ambient auth-ambient-a" aria-hidden="true" />
      <div className="auth-ambient auth-ambient-b" aria-hidden="true" />
      <div className="auth-ambient auth-ambient-c" aria-hidden="true" />

      <div className="auth-layout">
        <section className="auth-showcase">
          <Link href="/" className="auth-brand">
            <BrandMark />
            <span className="brand-word">
              WALZ<span>PAY</span>
            </span>
          </Link>

          <div className="showcase-body">
            <div className="showcase-badge">
              <span className="showcase-badge-dot" />
              DIGITAL PAYMENT PLATFORM
            </div>

            <h2>
              Pembayaran digital,
              <br />
              <span>lebih simpel.</span>
            </h2>

            <p className="showcase-description">
              Satu tempat untuk mengelola transaksi digital dengan pengalaman
              yang lebih nyaman, cepat, dan terorganisir.
            </p>

            <div className="showcase-features">
              <div className="showcase-feature">
                <span className="feature-icon">
                  <ShieldIcon />
                </span>
                <span>
                  <strong>Keamanan terjaga</strong>
                  <small>Privasi akun lebih terlindungi</small>
                </span>
              </div>

              <div className="showcase-feature">
                <span className="feature-icon feature-icon-purple">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 17.5 9 12l3.5 3.5L20 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.5 7H20v5.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                  <strong>Lebih praktis</strong>
                  <small>Kelola akun dalam satu ruang</small>
                </span>
              </div>
            </div>
          </div>

          <div className="payment-preview" aria-hidden="true">
            <div className="preview-light" />

            <div className="preview-header">
              <div className="preview-brand-icon">
                <BrandMark />
              </div>

              <div className="preview-brand-copy">
                <strong>WALZPAY</strong>
                <span>PAYMENT OVERVIEW</span>
              </div>

              <div className="preview-live">
                <span />
                ONLINE
              </div>
            </div>

            <div className="preview-balance">
              <span className="preview-caption">OVERVIEW TRANSAKSI</span>
              <strong>Semua dalam kendali.</strong>
              <span className="preview-balance-description">
                Pengalaman pembayaran digital yang lebih sederhana.
              </span>
            </div>

            <div className="preview-chart">
              <div className="preview-chart-line" />
              {[32, 48, 39, 62, 45, 72, 54, 86, 65, 77, 57, 94].map(
                (height, index) => (
                  <span
                    className="preview-bar"
                    key={index}
                    style={{
                      height: `${height}%`,
                      animationDelay: `${index * 0.07}s`,
                    }}
                  />
                )
              )}
            </div>

            <div className="preview-bottom">
              <div className="preview-bottom-icon">
                <ShieldIcon />
              </div>
              <div>
                <strong>Ruang digitalmu</strong>
                <span>Dirancang untuk kemudahan</span>
              </div>
              <span className="preview-arrow">↗</span>
            </div>

            <div className="preview-floating">
              <span className="floating-check">✓</span>
              <span>
                <strong>Akun pribadi</strong>
                <small>Akses lebih mudah</small>
              </span>
            </div>
          </div>

          <div className="showcase-bottom">
            <span>WALZPAY</span>
            <span className="showcase-bottom-dot" />
            <span>YOUR DIGITAL SPACE</span>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-top">
              <div className="auth-card-icon">
                <ShieldIcon />
              </div>
              <span className="eyebrow">SECURE ACCESS</span>
              <span className="auth-card-top-line" />
            </div>

            <div className="auth-heading">
              <h1>
                Selamat datang
                <br />
                <span>kembali.</span>
              </h1>
              <p className="auth-subtitle">
                Masuk ke akunmu untuk melanjutkan.
              </p>
            </div>

            <div className="auth-form">
              <label className="auth-label">
                <span className="auth-label-text">Alamat email</span>

                <div className={`auth-input-wrap ${emailErr ? "has-error" : ""}`}>
                  <span className="auth-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="m4 7 8 6 8-6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailTouched.current) {
                        setEmailErr(validateEmail(e.target.value));
                      }
                    }}
                    onBlur={() => {
                      emailTouched.current = true;
                      setEmailErr(validateEmail(email));
                    }}
                    onKeyDown={handleKeyDown}
                    className={inputClass}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    aria-invalid={Boolean(emailErr)}
                  />
                </div>

                {emailErr && (
                  <small className="field-error">
                    <span>!</span>
                    {emailErr}
                  </small>
                )}
              </label>

              <label className="auth-label">
                <span className="auth-label-text">Password</span>

                <div className={`auth-input-wrap ${passErr ? "has-error" : ""}`}>
                  <span className="auth-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="11"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M8 10V7a4 4 0 0 1 8 0v3"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 14.5v2"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passTouched.current) {
                        setPassErr(validatePassword(e.target.value));
                      }
                    }}
                    onBlur={() => {
                      passTouched.current = true;
                      setPassErr(validatePassword(password));
                    }}
                    onKeyDown={handleKeyDown}
                    className={inputClass}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(passErr)}
                  />

                  <button
                    type="button"
                    className="pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={
                      showPass ? "Sembunyikan password" : "Tampilkan password"
                    }
                  >
                    {showPass ? (
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M3 3 21 21"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9.9 5.3A10.9 10.9 0 0 1 12 5c5 0 8.5 5 9 7-.2.8-1 2-2.2 3.2M6.2 6.2C3.8 7.8 2.4 10.4 2 12c.5 2 4 7 10 7 1.2 0 2.3-.3 3.3-.7"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {passErr && (
                  <small className="field-error">
                    <span>!</span>
                    {passErr}
                  </small>
                )}
              </label>

              {serverErr && (
                <div className="form-alert" role="alert">
                  <span className="form-alert-icon">!</span>
                  <span>{serverErr}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className={`primary-action ${formReady ? "ready" : ""}`}
              >
                <span>{loading ? "Memverifikasi..." : "Masuk ke dashboard"}</span>

                {loading ? (
                  <span className="loading-spinner" aria-hidden="true" />
                ) : (
                  <span className="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M7 17 17 7M7 7h10v10"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </div>

            <div className="auth-footer">
              <span>Belum punya akun?</span>
              <Link href="/register">
                Buat akun baru <span>↗</span>
              </Link>
            </div>

            <div className="auth-card-bottom">
              <ShieldIcon />
              <span>Data akunmu diproses melalui koneksi aman</span>
            </div>
          </div>

          <p className="auth-note">
            <span className="auth-note-pulse" />
            WALZPAY <span className="auth-note-separator">/</span> YOUR DIGITAL
            PAYMENT SPACE
          </p>
        </section>
      </div>
    </main>
  );
}
