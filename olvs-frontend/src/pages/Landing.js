import React from 'react';
import { Link } from 'react-router-dom';

// IMPORTANT: This page renders ONLY hero/marketing content.
// It must NEVER render its own <nav>, logo row, or Login/Register buttons,
// since <Layout> (rendered once in App.js) already provides the navbar
// for every page, including this one.
export default function Landing() {
  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Hero */}
      <div className="fade-in" style={{ textAlign: 'center', padding: '80px 0 60px' }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: 20,
          background: 'rgba(201,168,76,0.1)', border: '1px solid var(--border)',
          fontSize: 12, color: 'var(--gold)', letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 28
        }}>Securing Ghana's Land Records</div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 700, lineHeight: 1.1,
          color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 20
        }}>
          Verify Land Ownership<br />
          <span style={{ color: 'var(--gold)' }}>With Confidence</span>
        </h1>

        <p style={{
          fontSize: 17, color: 'var(--text-secondary)', maxWidth: 520,
          margin: '0 auto 40px', lineHeight: 1.7
        }}>
          A blockchain-backed land verification system that makes ownership disputes a thing of the past. Instant, secure, tamper-proof.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/verify" style={{
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: 'var(--gold)', color: '#0A0C0F', display: 'inline-block'
          }}>Verify a Land Title</Link>
          <Link to="/register" style={{
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 500,
            background: 'transparent', color: 'var(--text-primary)',
            border: '1px solid var(--border)', display: 'inline-block'
          }}>Create Account</Link>
        </div>
      </div>

      {/* Features */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16, marginTop: 24
      }}>
        {[
          { icon: '🔗', title: 'Blockchain Ledger', desc: 'Every ownership transfer is locked into a SHA-256 chain. Any tampering is instantly detected.' },
          { icon: '⚡', title: 'Instant Verification', desc: 'Search any land title number and get full ownership history and status in seconds.' },
          { icon: '🔒', title: 'Fraud Prevention', desc: 'Database-level constraints prevent duplicate ownership. Suspicious activity is auto-flagged.' },
          { icon: '📱', title: 'QR Codes', desc: 'Every verified parcel gets a unique QR code for quick re-verification on the go.' },
        ].map((f, i) => (
          <div key={i} className="slide-up" style={{
            animationDelay: `${i * 0.1}s`,
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '24px', transition: 'border-color 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1, marginTop: 48, background: 'var(--border)',
        borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)'
      }}>
        {[['Secure', 'SHA-256 Hashing'], ['Real-time', 'Verification'], ['Zero', 'Fraud Tolerance']].map(([val, lbl], i) => (
          <div key={i} style={{
            background: 'var(--dark-2)', padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
