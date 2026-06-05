import React from 'react';

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--dark-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
      boxShadow: 'var(--shadow)', ...style
    }}>{children}</div>
  );
}

export function Button({ children, variant = 'primary', loading = false, style = {}, ...props }) {
  const styles = {
    primary: { background: 'var(--gold)', color: '#0A0C0F', border: 'none', fontWeight: 600 },
    secondary: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    danger: { background: 'rgba(231,76,60,0.1)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,0.3)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
  };
  return (
    <button disabled={loading} style={{
      padding: '10px 20px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 500,
      fontFamily: 'Sora, sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 8,
      transition: 'all 0.2s', ...styles[variant], ...style
    }} {...props}>
      {loading && <span className="spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />}
      {children}
    </button>
  );
}

export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <input style={{
        background: 'var(--dark-3)', border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 14,
        color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s',
        ...style
      }}
      onFocus={e => { if (!error) e.target.style.borderColor = 'var(--gold)'; }}
      onBlur={e => { if (!error) e.target.style.borderColor = 'var(--border)'; }}
      {...props} />
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

export function Badge({ children, type = 'default' }) {
  const colors = {
    default: { bg: 'var(--dark-4)', color: 'var(--text-secondary)', border: 'var(--border)' },
    success: { bg: 'rgba(46,204,113,0.1)', color: 'var(--success)', border: 'rgba(46,204,113,0.2)' },
    danger:  { bg: 'rgba(231,76,60,0.1)', color: 'var(--danger)',  border: 'rgba(231,76,60,0.2)' },
    warning: { bg: 'rgba(243,156,18,0.1)', color: 'var(--warning)', border: 'rgba(243,156,18,0.2)' },
    info:    { bg: 'rgba(52,152,219,0.1)', color: 'var(--info)',    border: 'rgba(52,152,219,0.2)' },
    gold:    { bg: 'rgba(201,168,76,0.1)', color: 'var(--gold)',    border: 'rgba(201,168,76,0.25)' },
  };
  const c = colors[type] || colors.default;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`
    }}>{children}</span>
  );
}

export function Alert({ type = 'info', children }) {
  const colors = {
    success: { bg: 'rgba(46,204,113,0.08)', border: 'rgba(46,204,113,0.25)', color: 'var(--success)' },
    danger:  { bg: 'rgba(231,76,60,0.08)',  border: 'rgba(231,76,60,0.25)',  color: 'var(--danger)' },
    warning: { bg: 'rgba(243,156,18,0.08)', border: 'rgba(243,156,18,0.25)', color: 'var(--warning)' },
    info:    { bg: 'rgba(52,152,219,0.08)', border: 'rgba(52,152,219,0.25)', color: 'var(--info)' },
  };
  const c = colors[type];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, lineHeight: 1.6
    }}>{children}</div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div className="spin" style={{
        width: 32, height: 32, border: '3px solid var(--border)',
        borderTopColor: 'var(--gold)', borderRadius: '50%'
      }} />
    </div>
  );
}

export function PageTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}

export function StatCard({ label, value, color = 'var(--gold)' }) {
  return (
    <div style={{
      background: 'var(--dark-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px'
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export function getStatusBadge(status) {
  const map = { verified: 'success', disputed: 'danger', transferred: 'info', pending: 'warning', flagged: 'danger' };
  return <Badge type={map[status] || 'default'}>{status}</Badge>;
}
