import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import api from '../api/axios';

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, fontWeight: 700, color: '#0A0C0F', flexShrink: 0,
    }}>L</div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>OLVS</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: -2 }}>LAND VERIFICATION</div>
    </div>
  </Link>
);

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await api.post('/auth/logout/', { refresh });
    } catch {}
    logout();
    navigate('/login');
  };

  const navLinks = user ? [
    { to: '/dashboard',       label: 'Dashboard' },
    { to: '/verify',          label: 'Verify Land' },
    ...(isAdmin ? [
      { to: '/admin/records',   label: 'Records' },
      { to: '/admin/transfers', label: 'Transfers' },
      { to: '/admin/audit',     label: 'Audit Log' },
    ] : []),
  ] : [];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body)' }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <Logo />

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: isActive(link.to) ? 'var(--gold)' : 'var(--text-secondary)',
              background: isActive(link.to) ? 'var(--dark-4)' : 'transparent',
              border: isActive(link.to) ? '1px solid var(--border)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}>{link.label}</Link>
          ))}
        </div>

        {/* Right side: theme switcher + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <ThemeSwitcher />

          {user ? (
            <>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user.full_name}</span>
                <span style={{ fontSize: 10, color: user.role === 'admin' ? 'var(--gold)' : 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role}</span>
              </div>
              <button onClick={handleLogout} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent',
              }}>Login</Link>
              <Link to="/register" style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--gold)', color: '#0A0C0F', border: 'none',
              }}>Register</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 24px', textAlign: 'center',
        fontSize: 12, color: 'var(--text-muted)',
        background: 'var(--dark-2)',
      }}>
        © 2025 Online Land Verification System · Derrick Edusei · Caleb Danquah · Paa Kwesi Ahenkorah
      </footer>
    </div>
  );
}
