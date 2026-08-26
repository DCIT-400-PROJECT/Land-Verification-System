import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, Button, Alert, PageTitle } from '../components/UI';

export default function CreateRecord() {
  const navigate = useNavigate();
  const [land, setLand] = useState({
    title_number: '', location: '', region: '', district: '',
    area_sqm: '', registered_at: ''
  });
  const [owner, setOwner] = useState({
    owner_name: '', owner_national_id: '', acquired_at: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const setL = (k) => (e) => setLand(f => ({ ...f, [k]: e.target.value }));
  const setO = (k) => (e) => setOwner(f => ({ ...f, [k]: e.target.value }));

  const inputStyle = (errKey) => ({
    background: 'var(--dark-3)',
    border: `1px solid ${errKey ? 'var(--danger)' : 'var(--border)'}`,
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

  const onFocus = (e) => { e.target.style.borderColor = 'var(--gold)'; };
  const onBlurLand = (key) => (e) => {
    e.target.style.borderColor = errors.land?.[key] ? 'var(--danger)' : 'var(--border)';
  };
  const onBlurOwner = (key) => (e) => {
    e.target.style.borderColor = errors.initial_owner?.[key] ? 'var(--danger)' : 'var(--border)';
  };

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setErrors({}); setSuccess('');
    try {
      const res = await api.post('/land/records/create/', { land, initial_owner: owner });
      setSuccess(`Land record ${res.data.data.title_number} created successfully with genesis block.`);
      setTimeout(() => navigate('/admin/records'), 2000);
    } catch (err) {
      setErrors(err.response?.data?.error?.details || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <PageTitle title="Add Land Record" subtitle="Create a new land parcel with its genesis ownership block" />

      {success && <Alert type="success" style={{ marginBottom: 20 }}>{success}</Alert>}

      <form onSubmit={handle}>
        <Card style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Land Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Title number</label>
              <input style={inputStyle(errors.land?.title_number)} placeholder="GHA/ACC/CANT/001"
                value={land.title_number} onChange={setL('title_number')} required
                onFocus={onFocus} onBlur={onBlurLand('title_number')} />
              {errors.land?.title_number && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.land.title_number[0]}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Location / Plot description</label>
              <input style={inputStyle(errors.land?.location)} placeholder="Plot 5, Cantonments, Accra"
                value={land.location} onChange={setL('location')} required
                onFocus={onFocus} onBlur={onBlurLand('location')} />
              {errors.land?.location && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.land.location[0]}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Region</label>
                <input style={inputStyle(errors.land?.region)} placeholder="Greater Accra"
                  value={land.region} onChange={setL('region')} required
                  onFocus={onFocus} onBlur={onBlurLand('region')} />
                {errors.land?.region && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.land.region[0]}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>District</label>
                <input style={inputStyle(errors.land?.district)} placeholder="Accra"
                  value={land.district} onChange={setL('district')}
                  onFocus={onFocus} onBlur={onBlurLand('district')} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Area (m²)</label>
                <input style={inputStyle(errors.land?.area_sqm)} type="number" placeholder="500"
                  value={land.area_sqm} onChange={setL('area_sqm')} required
                  onFocus={onFocus} onBlur={onBlurLand('area_sqm')} />
                {errors.land?.area_sqm && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.land.area_sqm[0]}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Registration date</label>
                <input style={inputStyle(errors.land?.registered_at)} type="date"
                  value={land.registered_at} onChange={setL('registered_at')} required
                  onFocus={onFocus} onBlur={onBlurLand('registered_at')} />
                {errors.land?.registered_at && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.land.registered_at[0]}</span>}
              </div>
            </div>

          </div>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Initial Owner (Genesis Block)</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6, padding: '10px 12px', background: 'var(--dark-3)', borderRadius: 8 }}>
            This creates the first blockchain block (Block #0) for this land. Once set, it becomes part of the immutable chain.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Owner full name</label>
              <input style={inputStyle(errors.initial_owner?.owner_name)} placeholder="Kwame Asante"
                value={owner.owner_name} onChange={setO('owner_name')} required
                onFocus={onFocus} onBlur={onBlurOwner('owner_name')} />
              {errors.initial_owner?.owner_name && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.initial_owner.owner_name[0]}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Owner national ID</label>
              <input style={inputStyle(errors.initial_owner?.owner_national_id)} placeholder="GHA-001-XXXX"
                value={owner.owner_national_id} onChange={setO('owner_national_id')} required
                onFocus={onFocus} onBlur={onBlurOwner('owner_national_id')} />
              {errors.initial_owner?.owner_national_id && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.initial_owner.owner_national_id[0]}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Date of ownership</label>
              <input style={inputStyle(errors.initial_owner?.acquired_at)} type="date"
                value={owner.acquired_at} onChange={setO('acquired_at')} required
                onFocus={onFocus} onBlur={onBlurOwner('acquired_at')} />
              {errors.initial_owner?.acquired_at && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.initial_owner.acquired_at[0]}</span>}
            </div>

          </div>
        </Card>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" loading={loading}>Create Land Record + Genesis Block</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/records')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
