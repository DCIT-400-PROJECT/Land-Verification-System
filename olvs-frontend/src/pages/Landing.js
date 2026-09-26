import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import GhanaMap from '../components/GhanaMap';
import ScrollReveal from '../components/ScrollReveal';

// The hero's single orchestrated moment: a coordinate pin drops onto the
// map, pulses once (the "verification" beat), then a three-block hash
// chain draws in beside it — visualising the SHA-256 ledger concept.
function VerificationMoment() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 460, margin: '0 auto', height: 220 }}>
      <div style={{ position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)' }}>
        <div className="pin-drop" style={{ position: 'relative', animationDelay: '0.9s' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" style={{ position: 'relative', zIndex: 2 }}>
            <path d="M20 6c-5 0-9 3.9-9 8.8 0 6.6 9 16.8 9 16.8s9-10.2 9-16.8C29 9.9 25 6 20 6z" fill="#C9A84C" />
            <circle cx="20" cy="15" r="3.6" fill="#0A0C0F" />
          </svg>
          <span className="pulse-ring" style={{
            position: 'absolute', top: 4, left: 2, width: 32, height: 32,
            borderRadius: '50%', border: '1.5px solid var(--gold)',
            animationDelay: '1.3s', display: 'block'
          }} />
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 4, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
      }}>
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            <div className="link-in" style={{
              animationDelay: `${1.7 + i * 0.35}s`,
              background: 'var(--dark-3)', border: '1px solid var(--border-hover)',
              borderRadius: 8, padding: '10px 12px', minWidth: 92, textAlign: 'center'
            }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>
                BLOCK #{i}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--gold)' }}>
                {i === 0 ? '0000…f3a1' : i === 1 ? 'f3a1…9c2e' : '9c2e…7b04'}
              </div>
            </div>
            {i < 2 && (
              <svg width="18" height="10" style={{ overflow: 'visible' }}>
                <line x1="0" y1="5" x2="18" y2="5" stroke="var(--gold)" strokeWidth="1.5"
                  className="dash-draw" style={{ animationDelay: `${2.0 + i * 0.35}s` }} />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div style={{ minHeight: '80vh' }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', padding: '64px 0 40px', overflow: 'hidden' }}>
        <GhanaMap />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <div className="hero-rise" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20,
            background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border)',
            fontSize: 12, color: 'var(--gold)', marginBottom: 26, animationDelay: '0.05s'
          }}>
            <Logo size={16} />
            Securing land records across Ghana
          </div>

          <h1 className="hero-rise" style={{
            fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, lineHeight: 1.1,
            color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 22,
            animationDelay: '0.18s'
          }}>
            Every parcel, verified.<br />
            <span style={{ color: 'var(--gold)' }}>Every transfer, permanent.</span>
          </h1>

          <p className="hero-rise" style={{
            fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480,
            margin: '0 auto 36px', lineHeight: 1.7, animationDelay: '0.32s'
          }}>
            OLVS checks land title ownership against a tamper-evident SHA-256 ledger
            and returns a result in seconds, work that currently takes Ghana's land
            registry an average of 126 to 372 days.
          </p>

          <div className="hero-rise" style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56,
            animationDelay: '0.46s'
          }}>
            <Link to="/verify" style={{
              padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: 'var(--gold)', color: '#0A0C0F', display: 'inline-block'
            }}>Verify a land title</Link>
            <Link to="/register" style={{
              padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 500,
              background: 'transparent', color: 'var(--text-primary)',
              border: '1px solid var(--border)', display: 'inline-block'
            }}>Create account</Link>
          </div>

          <div className="hero-rise" style={{ animationDelay: '0.6s' }}>
            <VerificationMoment />
          </div>
        </div>
      </div>

      {/* ── How it works (a real sequence — numbering earns its place) ── */}
      <ScrollReveal style={{ marginTop: 24 }}>
        <h2 style={{
          fontSize: 26, fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)', marginBottom: 8
        }}>
          How a verification happens
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 36 }}>
          Three steps, end to end, in under two seconds
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { n: '01', title: 'Enter the title number', desc: 'A citizen types a land title number, the same identifier printed on the official Lands Commission certificate.' },
            { n: '02', title: 'The ledger is checked', desc: 'Every ownership block for that parcel is re-hashed and compared against its stored SHA-256 value and its link to the previous block.' },
            { n: '03', title: 'Owner and status returned', desc: 'Current owner, deed reference, GPS coordinates, and a pass or fail integrity result are returned in one response.' },
          ].map((step) => (
            <div key={step.n} style={{
              background: 'var(--dark-2)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '26px 22px'
            }}>
              <div style={{ fontSize: 32, color: 'var(--gold)', fontWeight: 700, marginBottom: 10, opacity: 0.85 }}>
                {step.n}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* ── What makes it trustworthy ── */}
      <ScrollReveal style={{ marginTop: 56 }} delay={0.05}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16
        }}>
          {[
            { icon: '🔗', title: 'Chained, not just stored', desc: 'Each ownership record carries the hash of the one before it. Alter a record and every block after it stops matching.' },
            { icon: '🧾', title: '15 fields, one standard', desc: 'Deed reference, survey plan, beacon numbers, stamp duty, and more, aligned to how Ghanaian land documents are actually structured.' },
            { icon: '🚫', title: 'One owner at a time', desc: 'A database constraint, not just application logic, blocks a second active owner from ever existing on the same parcel.' },
            { icon: '📍', title: 'Scan and confirm', desc: 'Every verified parcel gets a QR code that opens straight to its verification result, no typing required in the field.' },
          ].map((f, i) => (
            <div key={i} style={{
              background: 'var(--dark-2)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '22px', transition: 'border-color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* ── Real figures, not filler ── */}
      <ScrollReveal style={{ marginTop: 56 }} delay={0.1}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, background: 'var(--border)',
          borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)'
        }}>
          {[
            ['126–372 days', 'Current average Lands Commission processing time'],
            ['< 2 seconds', 'OLVS verification response time'],
            ['79.6%', 'Of sampled applications exceeding the 90-day target'],
          ].map(([val, lbl], i) => (
            <div key={i} style={{ background: 'var(--dark-2)', padding: '26px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{val}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{lbl}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
          Source: Ghana Audit Service, Performance Audit Report on Land Registration in Ghana (2024)
        </p>
      </ScrollReveal>
    </div>
  );
}
