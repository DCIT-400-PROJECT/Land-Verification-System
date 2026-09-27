import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import Logo from './Logo';
import api from '../api/axios';

const BrandMark = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
    <Logo size={36} />
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        <BrandMark />

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <ThemeSwitcher />

          {user ? (
            <>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user.full_name}</span>
                <span style={{ fontSize: 10, color: user.role === 'admin' ? 'var(--gold)' : 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role}</span>
              </div>
              <button onClick={() => setShowLogoutConfirm(true)} style={{
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
        © 2026 Online Land Verification System · Derrick Edusei · Caleb Danquah · Paa Kwesi Ahenkorah
      </footer>

      {/* ── Logout confirmation modal ── */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '28px', maxWidth: 360, width: '90%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Log out of OLVS?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22, lineHeight: 1.6 }}>
              You'll need to sign in again to access your dashboard and verify land titles.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
                style={{
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'var(--danger)', border: 'none',
                  color: '#fff', cursor: 'pointer',
                }}
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
