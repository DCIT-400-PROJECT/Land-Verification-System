import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, fontWeight: 700, color: '#0A0C0F'
    }}>L</div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>OLVS</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: -2 }}>LAND VERIFICATION</div>
    </div>
  </Link>
);

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await api.post('/auth/logout/', { refresh });
    } catch {}
    logout();
    navigate('/login');
  };

  const navLinks = user ? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/verify', label: 'Verify Land' },
    ...(isAdmin ? [
      { to: '/admin/records', label: 'Records' },
      { to: '/admin/transfers', label: 'Transfers' },
      { to: '/admin/audit', label: 'Audit Log' },
    ] : []),
  ] : [];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        background: 'rgba(10,12,15,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Logo />

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: isActive(link.to) ? 'var(--gold)' : 'var(--text-secondary)',
              background: isActive(link.to) ? 'rgba(201,168,76,0.1)' : 'transparent',
              border: isActive(link.to) ? '1px solid var(--border)' : '1px solid transparent',
              transition: 'all 0.2s'
            }}>{link.label}</Link>
          ))}
        </div>

        {/* User section */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user.full_name}</div>
              <div style={{ fontSize: 11, color: user.role === 'admin' ? 'var(--gold)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role}</div>
            </div>
            <button onClick={handleLogout} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.target.style.borderColor = 'var(--danger)'; e.target.style.color = 'var(--danger)'; }}
            onMouseOut={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)'; }}>
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent'
            }}>Login</Link>
            <Link to="/register" style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--gold)', color: '#0A0C0F', border: 'none'
            }}>Register</Link>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '16px 24px',
        textAlign: 'center', fontSize: 12, color: 'var(--text-muted)'
      }}>
        © 2025 Online Land Verification System · Derrick Edusei · Caleb Danquah · Paa Kwesi Ahenkorah
      </footer>
    </div>
  );
}
