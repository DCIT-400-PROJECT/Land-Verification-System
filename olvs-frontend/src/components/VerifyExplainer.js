import React, { useState } from 'react';

// Educational panel shown above the search bar on the Verify page.
// Grounds the tool in the actual project: what's checked, why it matters,
// and how the blockchain integrity check works — not generic marketing copy.
export default function VerifyExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '14px 18px', cursor: 'pointer', color: 'var(--text-primary)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          What does OLVS actually check?
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{open ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {open && (
        <div className="slide-up" style={{
          background: 'var(--dark-2)', border: '1px solid var(--border)', borderTop: 'none',
          borderRadius: '0 0 12px 12px', padding: '20px 22px', marginTop: -1,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                The problem
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Ghana's Auditor-General found that 79.6% of a nationally sampled set of land
                applications took longer than the Lands Commission's own 90-day target,
                averaging 126 to 372 days depending on region.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                What gets checked
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Title number, current owner, deed reference, survey plan, GPS coordinates,
                beacon numbers, stamp duty status, and any recorded encumbrances, fifteen
                fields in total, aligned to how Ghanaian land records are documented.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                How tampering is caught
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Every ownership change is stored as a SHA-256 hashed block linked to the one
                before it. Editing any historical field changes that block's hash, which no
                longer matches what the next block expects, so the mismatch is caught instantly.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
