import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            background: '#c9a84c',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#000',
            fontSize: 18,
          }}>L</div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: 14, lineHeight: 1 }}>OLVS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Land Verification</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/login" style={{
            padding: '8px 20px',
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            textDecoration: 'none',
          }}>
            Login
          </Link>
          <Link to="/register" style={{
            padding: '8px 20px',
            fontSize: 14,
            background: '#c9a84c',
            color: '#000',
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '96px 24px 64px',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 999,
          border: '1px solid rgba(201,168,76,0.3)',
          background: 'rgba(201,168,76,0.05)',
          color: '#c9a84c',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 32,
        }}>
          Securing Ghana's Land Records
        </div>
        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 72px)',
          fontWeight: 800,
          lineHeight: 1.08,
          maxWidth: 900,
          marginBottom: 24,
          letterSpacing: '-0.02em',
          margin: '0 auto 24px',
        }}>
          Verify Land Ownership
          <br />
          <span style={{ color: '#c9a84c' }}>With Confidence</span>
        </h1>
        <p style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.5)',
          maxWidth: 520,
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          A blockchain-backed land verification system that makes ownership disputes
          a thing of the past. Instant, secure, tamper-proof.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <Link to="/verify" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 32px',
            background: '#c9a84c',
            color: '#000',
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            Verify a Land Title
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
          <Link to="/register" style={{
            padding: '14px 32px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 12,
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            Create Account
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section style={{ padding: '0 24px 64px' }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {[
            {
              icon: '🔗',
              title: 'Blockchain Ledger',
              desc: 'Every ownership transfer is locked into a SHA-256 chain. Any tampering is instantly detected.',
            },
            {
              icon: '⚡',
              title: 'Instant Verification',
              desc: 'Search any land title number and get full ownership history and status in seconds.',
            },
            {
              icon: '🛡️',
              title: 'Fraud Prevention',
              desc: 'Database-level constraints prevent duplicate ownership. Suspicious activity is auto-flagged.',
            },
            {
              icon: '📱',
              title: 'QR Codes',
              desc: 'Every verified parcel gets a unique QR code for quick re-verification on the go.',
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 24,
                transition: 'border-color 0.3s',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(201,168,76,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                marginBottom: 16,
              }}>{f.icon}</div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 14, marginBottom: 8 }}>{f.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ padding: '0 24px 64px' }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {[
            { value: 'Secure', label: 'SHA-256 Hashing' },
            { value: 'Real-time', label: 'Verification' },
            { value: 'Zero', label: 'Fraud Tolerance' },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                background: '#141414',
                padding: 28,
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: '#c9a84c' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 12 }}>How It Works</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Transparent, tamper-proof verification in three steps</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
            {[
              {
                step: '01',
                title: 'Enter Title Number',
                desc: "Input the land title number you wish to verify. Our system searches Ghana's land registry in real-time.",
              },
              {
                step: '02',
                title: 'Blockchain Check',
                desc: 'We cross-reference the record against our SHA-256 blockchain ledger, ensuring no data has been tampered with.',
              },
              {
                step: '03',
                title: 'Instant Certificate',
                desc: 'Receive a full report with ownership details, history, blockchain integrity status, and a unique QR code.',
              },
            ].map((s) => (
              <div key={s.step} style={{ position: 'relative' }}>
                <div style={{
                  fontSize: 72,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.04)',
                  position: 'absolute',
                  top: -12,
                  left: -4,
                  userSelect: 'none',
                }}>{s.step}</div>
                <div style={{ position: 'relative', paddingTop: 24 }}>
                  <h3 style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: '#c9a84c' }}>{s.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d' }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 32,
          textAlign: 'center',
        }}>
          {[
            { value: '120K+', label: 'Land Records' },
            { value: '98.7%', label: 'Verified Accurate' },
            { value: '16', label: 'Regions Covered' },
            { value: '45K+', label: 'Active Users' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>Ready to verify your land?</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
            Join thousands of Ghanaians using OLVS to protect their land rights and prevent fraud.
          </p>
          <Link to="/register" style={{
            display: 'inline-block',
            padding: '16px 40px',
            background: '#c9a84c',
            color: '#000',
            fontWeight: 'bold',
            fontSize: 14,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        color: 'rgba(255,255,255,0.25)',
        fontSize: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24,
            height: 24,
            background: '#c9a84c',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#000',
            fontSize: 12,
          }}>L</div>
          <span>OLVS — Online Land Verification System</span>
        </div>
        <div>&copy; {new Date().getFullYear()} Republic of Ghana. All rights reserved.</div>
      </footer>

    </div>
  );
}
