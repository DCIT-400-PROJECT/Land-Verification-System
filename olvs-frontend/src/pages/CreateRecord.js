import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, Button, Input, Alert, PageTitle } from '../components/UI';

export default function CreateRecord() {
  const navigate = useNavigate();
  const [land, setLand] = useState({ title_number: '', location: '', region: '', district: '', area_sqm: '', registered_at: '' });
  const [owner, setOwner] = useState({ owner_name: '', owner_national_id: '', acquired_at: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const setL = (k, v) => setLand(f => ({ ...f, [k]: v }));
  const setO = (k, v) => setOwner(f => ({ ...f, [k]: v }));

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

  const LF = ({ k, label, ...props }) => (
    <Input label={label} error={errors.land?.[k]?.[0]} value={land[k]} onChange={e => setL(k, e.target.value)} {...props} />
  );
  const OF = ({ k, label, ...props }) => (
    <Input label={label} error={errors.initial_owner?.[k]?.[0]} value={owner[k]} onChange={e => setO(k, e.target.value)} {...props} />
  );

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <PageTitle title="Add Land Record" subtitle="Create a new land parcel with its genesis ownership block" />

      {success && <Alert type="success" style={{ marginBottom: 20 }}>{success}</Alert>}

      <form onSubmit={handle}>
        <Card style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Land Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <LF k="title_number" label="Title number" placeholder="GHA/ACC/CANT/001" required />
            <LF k="location" label="Location / Plot description" placeholder="Plot 5, Cantonments, Accra" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LF k="region" label="Region" placeholder="Greater Accra" required />
              <LF k="district" label="District" placeholder="Accra" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LF k="area_sqm" label="Area (m²)" type="number" placeholder="500" required />
              <LF k="registered_at" label="Registration date" type="date" required />
            </div>
          </div>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Initial Owner (Genesis Block)</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6, padding: '10px 12px', background: 'var(--dark-3)', borderRadius: 8 }}>
            This creates the first blockchain block (Block #0) for this land. Once set, it becomes part of the immutable chain.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <OF k="owner_name" label="Owner full name" placeholder="Kwame Asante" required />
            <OF k="owner_national_id" label="Owner national ID" placeholder="GHA-001-XXXX" required />
            <OF k="acquired_at" label="Date of ownership" type="date" required />
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
