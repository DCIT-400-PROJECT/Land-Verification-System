import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Button, Input, Alert, Badge, Spinner, PageTitle } from '../components/UI';

function TransferCard({ tr, onReview }) {
  const statusColor = { pending: 'warning', approved: 'success', rejected: 'danger' };
  return (
    <div style={{
      background: 'var(--dark-3)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '18px 20px', marginBottom: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>{tr.land_title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Submitted: {new Date(tr.requested_at).toLocaleString()}</div>
        </div>
        <Badge type={statusColor[tr.status]}>{tr.status}</Badge>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>New owner</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{tr.new_owner_name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {tr.new_owner_national_id}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Requested by</div>
          <div style={{ fontSize: 14 }}>{tr.requested_by_details?.full_name || '—'}</div>
        </div>
      </div>
      {tr.reason && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Reason: {tr.reason}</div>}
      {tr.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => onReview(tr.id, 'approve')} style={{ background: 'rgba(46,204,113,0.1)', color: 'var(--success)', border: '1px solid rgba(46,204,113,0.3)', padding: '7px 16px', fontSize: 13 }}>✓ Approve</Button>
          <Button onClick={() => onReview(tr.id, 'reject')} variant="danger" style={{ padding: '7px 16px', fontSize: 13 }}>✕ Reject</Button>
        </div>
      )}
      {tr.status === 'rejected' && tr.rejection_reason && (
        <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Rejected: {tr.rejection_reason}</div>
      )}
    </div>
  );
}

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ land: '', new_owner_name: '', new_owner_national_id: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/land/transfer/list/');
      setTransfers(res.data.results || res.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      await api.post('/land/transfer/', form);
      setMsg({ type: 'success', text: 'Transfer request submitted successfully.' });
      setShowCreate(false);
      setForm({ land: '', new_owner_name: '', new_owner_national_id: '', reason: '' });
      load();
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.error?.message || 'Failed to submit transfer.' });
    } finally {
      setSubmitting(false); }
  };

  const handleReview = async (id, action, reason = '') => {
    try {
      await api.post(`/land/transfer/${id}/review/`, { action, rejection_reason: reason });
      setMsg({ type: 'success', text: `Transfer ${action}d successfully.` });
      setRejectModal(null); setRejectReason('');
      load();
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.error?.message || `Failed to ${action} transfer.` });
    }
  };

  const onReview = (id, action) => {
    if (action === 'reject') { setRejectModal(id); return; }
    handleReview(id, 'approve');
  };

  const pending = transfers.filter(t => t.status === 'pending');
  const processed = transfers.filter(t => t.status !== 'pending');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <PageTitle title="Ownership Transfers" subtitle="Submit and review land ownership transfer requests" />
        <Button onClick={() => setShowCreate(!showCreate)}>{showCreate ? '✕ Cancel' : '+ New Transfer Request'}</Button>
      </div>

      {msg.text && <Alert type={msg.type} style={{ marginBottom: 16 }}>{msg.text}</Alert>}

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--gold)' }}>New Transfer Request</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Land record ID (UUID)" placeholder="Paste the land record UUID from Records page"
              value={form.land} onChange={e => setForm(f => ({ ...f, land: e.target.value }))} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="New owner full name" value={form.new_owner_name} onChange={e => setForm(f => ({ ...f, new_owner_name: e.target.value }))} required />
              <Input label="New owner national ID" value={form.new_owner_national_id} onChange={e => setForm(f => ({ ...f, new_owner_national_id: e.target.value }))} required />
            </div>
            <Input label="Reason (optional)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            <Button type="submit" loading={submitting} style={{ alignSelf: 'flex-start' }}>Submit Transfer Request</Button>
          </form>
        </Card>
      )}

      {loading ? <Spinner /> : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                ⏳ Pending ({pending.length})
              </h2>
              {pending.map(t => <TransferCard key={t.id} tr={t} onReview={onReview} />)}
            </div>
          )}
          {processed.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Processed ({processed.length})
              </h2>
              {processed.map(t => <TransferCard key={t.id} tr={t} onReview={onReview} />)}
            </div>
          )}
          {transfers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>No transfer requests yet.</div>
          )}
        </>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <Card style={{ width: 400 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Reject Transfer</h2>
            <Input label="Rejection reason (required)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this transfer is being rejected" />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button variant="danger" onClick={() => handleReview(rejectModal, 'reject', rejectReason)} disabled={!rejectReason.trim()}>Confirm Rejection</Button>
              <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
