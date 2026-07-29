import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Card, Button, Badge, Spinner, getStatusBadge, PageTitle, Alert } from '../components/UI';

export default function LandRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/land/records/${id}/`);
      const rec = res.data.data || res.data;
      setRecord(rec);
      setStatus(rec.status);

      // Fetch ownership history using the title number
      if (rec.title_number) {
        try {
          const histRes = await api.get(`/land/history/${rec.title_number}/`);
          setHistory(histRes.data.data);
        } catch {
          setHistory(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load land record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await api.patch(`/land/records/${id}/`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  if (error && !record) {
    return (
      <div className="fade-in">
        <Alert type="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/admin/records')} style={{ marginTop: 16 }}>
          ← Back to Records
        </Button>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <PageTitle title={record.title_number} subtitle="Land record detail" />
        <Link to="/admin/records">
          <Button variant="secondary">← Back to Records</Button>
        </Link>
      </div>

      {error && <Alert type="danger" style={{ marginBottom: 16 }}>{error}</Alert>}

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--gold)' }}>
            {record.title_number}
          </div>
          {getStatusBadge(record.status)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            ['Location', record.location],
            ['Region', record.region],
            ['District', record.district || '—'],
            ['Area', `${record.area_sqm} m²`],
            ['Registered', record.registered_at],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{val}</div>
            </div>
          ))}
        </div>
      </Card>

      {record.current_owner && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Current Owner</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{record.current_owner.owner_name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            ID: {record.current_owner.owner_national_id} · Acquired: {record.current_owner.acquired_at}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Update Status</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{
            background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif'
          }}>
            <option value="verified">Verified</option>
            <option value="disputed">Disputed</option>
            <option value="transferred">Transferred</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
          <Button onClick={handleStatusUpdate} loading={saving} style={{ padding: '8px 18px', fontSize: 13 }}>
            Save Status
          </Button>
        </div>
      </Card>

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
