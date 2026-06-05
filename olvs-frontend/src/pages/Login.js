import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Alert } from '../components/UI';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const inputStyle = {
    background: 'var(--dark-3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    fontFamily: 'Sora, sans-serif',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6, display: 'block',
  };

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login/', form);
      const { tokens, user } = res.data.data;
      login(tokens, user);
      navigate(user.role === 'admin' ? '/admin/records' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const onFocus = (e) => { e.target.style.borderColor = 'var(--gold)'; };
  const onBlur  = (e) => { e.target.style.borderColor = 'var(--border)'; };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }} className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#0A0C0F', margin: '0 auto 16px'
        }}>L</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Welcome back</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
          Sign in to your OLVS account
        </p>
      </div>

      <Card>
        {error && <Alert type="danger" style={{ marginBottom: 16 }}>{error}</Alert>}

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Email address</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              onFocus={onFocus}
              onBlur={onBlur}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              onFocus={onFocus}
              onBlur={onBlur}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" loading={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Sign in
          </Button>
        </form>
      </Card>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--gold)' }}>Register</Link>
      </p>

      <div style={{
        marginTop: 24, padding: 16,
        background: 'var(--dark-3)', borderRadius: 10,
        border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Demo credentials
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Admin: <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)' }}>admin@olvs.gh</code> / <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)' }}>Admin1234!</code></span>
          <span>Citizen: <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>citizen@olvs.gh</code> / <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>Citizen1234!</code></span>
        </div>
      </div>
    </div>
  );
}
