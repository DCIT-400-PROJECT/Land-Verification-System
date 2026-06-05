import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Alert } from '../components/UI';

export default function Register() {
  const [form, setForm] = useState({
    email: '', national_id: '', full_name: '',
    phone_number: '', password: '', password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const inputStyle = (key) => ({
    background: 'var(--dark-3)',
    border: `1px solid ${errors[key] ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    fontFamily: 'Sora, sans-serif',
    transition: 'border-color 0.2s',
  });

  const labelStyle = {
    fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6, display: 'block',
  };

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setErrors({});
    try {
      const res = await api.post('/auth/register/', form);
      const { tokens, user } = res.data.data;
      login(tokens, user);
      navigate('/dashboard');
    } catch (err) {
      setErrors(err.response?.data?.error?.details || {});
    } finally {
      setLoading(false);
    }
  };

  const onFocus = (e) => { e.target.style.borderColor = 'var(--gold)'; };
  const onBlur  = (key) => (e) => {
    e.target.style.borderColor = errors[key] ? 'var(--danger)' : 'var(--border)';
  };

  return (
    <div style={{ maxWidth: 480, margin: '32px auto' }} className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Create account</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
          Register to verify land ownership
        </p>
      </div>

      <Card>
        {errors.non_field_errors && (
          <Alert type="danger" style={{ marginBottom: 16 }}>{errors.non_field_errors}</Alert>
        )}

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Full name</label>
            <input style={inputStyle('full_name')} placeholder="Kwame Asante"
              value={form.full_name} onChange={set('full_name')} required
              onFocus={onFocus} onBlur={onBlur('full_name')} />
            {errors.full_name && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.full_name[0]}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Email address</label>
            <input style={inputStyle('email')} type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required
              onFocus={onFocus} onBlur={onBlur('email')} />
            {errors.email && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.email[0]}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>National ID / Ghana Card</label>
            <input style={inputStyle('national_id')} placeholder="GHA-XXXXXX-X"
              value={form.national_id} onChange={set('national_id')} required
              onFocus={onFocus} onBlur={onBlur('national_id')} />
            {errors.national_id && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.national_id[0]}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Phone number (optional)</label>
            <input style={inputStyle('phone_number')} placeholder="+233 XX XXX XXXX"
              value={form.phone_number} onChange={set('phone_number')}
              onFocus={onFocus} onBlur={onBlur('phone_number')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle('password')} type="password" placeholder="Min. 8 chars"
                value={form.password} onChange={set('password')} required
                onFocus={onFocus} onBlur={onBlur('password')} />
              {errors.password && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.password[0]}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Confirm password</label>
              <input style={inputStyle('password_confirm')} type="password" placeholder="Repeat password"
                value={form.password_confirm} onChange={set('password_confirm')} required
                onFocus={onFocus} onBlur={onBlur('password_confirm')} />
              {errors.password_confirm && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.password_confirm[0]}</span>}
            </div>
          </div>

          <Button type="submit" loading={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Create account
          </Button>
        </form>
      </Card>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link>
      </p>
    </div>
  );
}
