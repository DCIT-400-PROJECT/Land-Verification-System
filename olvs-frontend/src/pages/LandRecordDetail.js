import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Card, Button, Badge, Spinner, getStatusBadge, PageTitle, Alert } from '../components/UI';

const FIELD_GROUPS = [
  {
    title: 'Basic Details',
    fields: [
      ['title_number', 'Title number', 'text'],
      ['location', 'Location / Plot description', 'text'],
      ['region', 'Region', 'text'],
      ['district', 'District', 'text'],
      ['area_sqm', 'Area (m²)', 'number'],
      ['registered_at', 'Registration date', 'date'],
    ],
  },
  {
    title: 'Land Details',
    fields: [
      ['plot_number', 'Plot number', 'text'],
      ['locality', 'Locality', 'text'],
      ['land_type', 'Land type', 'select', [
        ['freehold', 'Freehold'], ['leasehold_50', 'Leasehold (50 years)'],
        ['leasehold_99', 'Leasehold (99 years)'], ['stool_land', 'Stool Land'], ['state_land', 'State Land'],
      ]],
      ['land_use', 'Land use', 'select', [
        ['residential', 'Residential'], ['commercial', 'Commercial'],
        ['agricultural', 'Agricultural'], ['mixed', 'Mixed Use'],
      ]],
      ['area_acres', 'Area (acres)', 'number'],
      ['gps_coordinates', 'GPS coordinates', 'text'],
      ['beacon_numbers', 'Beacon numbers', 'text'],
    ],
  },
  {
    title: 'Legal Documents',
    fields: [
      ['deed_type', 'Deed type', 'text'],
      ['deed_reference', 'Deed reference', 'text'],
      ['survey_plan_number', 'Survey plan number', 'text'],
      ['surveyor_name', 'Licensed surveyor', 'text'],
      ['surveyor_license', 'Surveyor license no.', 'text'],
      ['town_planning_approval', 'Town planning approval', 'text'],
    ],
  },
  {
    title: 'Compliance & Encumbrances',
    fields: [
      ['stamp_duty_paid', 'Stamp duty paid', 'checkbox'],
      ['stamp_duty_ref', 'Stamp duty reference', 'text'],
      ['encumbrances', 'Encumbrances / disputes', 'text'],
    ],
  },
];

export default function LandRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/land/records/${id}/`);
      const rec = res.data.data || res.data;
      setRecord(rec);
      setForm(rec);
      setStatus(rec.status);
      if (rec.title_number) {
        try {
          const histRes = await api.get(`/land/history/${rec.title_number}/`);
          setHistory(histRes.data.data);
        } catch { setHistory(null); }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load land record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const setF = (k, type) => (e) => {
    const val = type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const inputStyle = {
    background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none',
    width: '100%', fontFamily: 'Sora, sans-serif',
  };
  const labelStyle = { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...form, status };
      delete payload.id; delete payload.current_owner; delete payload.created_by;
      delete payload.created_at; delete payload.updated_at; delete payload.qr_code_url;
      if (payload.area_acres === '') payload.area_acres = null;
      await api.patch(`/land/records/${id}/`, payload);
      setSuccess('Land record updated successfully.');
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (error && !record) {
    return (
      <div className="fade-in">
        <Alert type="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/admin/records')} style={{ marginTop: 16 }}>← Back to Records</Button>
      </div>
    );
  }
  if (!record) return null;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <PageTitle title={record.title_number} subtitle="Edit land record — all fields, saved directly to the database" />
        <Link to="/admin/records"><Button variant="secondary">← Back to Records</Button></Link>
      </div>

      {error && <Alert type="danger" style={{ marginBottom: 16 }}>{error}</Alert>}
      {success && <Alert type="success" style={{ marginBottom: 16 }}>{success}</Alert>}

      {record.current_owner && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Current Owner</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{record.current_owner.owner_name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            ID: {record.current_owner.owner_national_id} · Acquired: {record.current_owner.acquired_at}
          </div>
        </Card>
      )}

      {FIELD_GROUPS.map(group => (
        <Card key={group.title} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--gold)' }}>{group.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {group.fields.map(([key, label, type, options]) => (
              <div key={key} style={type === 'checkbox' ? { display: 'flex', alignItems: 'center', gap: 8 } : {}}>
                {type === 'checkbox' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={!!form[key]} onChange={setF(key, type)} />
                    {label}
                  </label>
                ) : type === 'select' ? (
                  <>
                    <label style={labelStyle}>{label}</label>
                    <select style={inputStyle} value={form[key] || ''} onChange={setF(key, type)}>
                      <option value="">Select…</option>
                      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label style={labelStyle}>{label}</label>
                    <input style={inputStyle} type={type} value={form[key] || ''} onChange={setF(key, type)} />
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--gold)' }}>Status</h2>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }}>
          <option value="verified">Verified</option>
          <option value="disputed">Disputed</option>
          <option value="transferred">Transferred</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>
      </Card>

      <div style={{ marginBottom: 24 }}>
        <Button onClick={handleSave} loading={saving}>Save All Changes</Button>
      </div>

      {history && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Ownership History</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{history.chain_length} block(s)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.history.map((block) => (
              <div key={block.id} style={{
                background: 'var(--dark-3)', borderRadius: 10, padding: '14px 16px',
                border: `1px solid ${block.is_current ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Block #{block.block_index}</span>
                  {block.is_current && <Badge type="gold">Current</Badge>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{block.owner_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  ID: {block.owner_national_id} · Acquired: {block.acquired_at}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 8, wordBreak: 'break-all' }}>
                  {block.block_hash}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

