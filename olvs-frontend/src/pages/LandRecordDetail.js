import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Card, Button, Badge, Spinner, getStatusBadge, PageTitle, Alert } from '../components/UI';
import MapPicker from '../components/MapPicker';

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
    expandable: true,
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
      ['gps_coordinates', 'GPS coordinates', 'map'],
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

const STATUS_CHANGE_REASONS = [
  'Pending/ongoing court case',
  'Boundary or beacon discrepancy found',
  'Duplicate or conflicting title claim',
  'Missing or invalid supporting documents',
  'Fraud or tampering suspected',
  'Dispute resolved / cleared for verification',
  'Routine administrative correction',
  'Custom',
];

function OwnerContactEditor({ recordId, initialContact, onSaved }) {
  const [contact, setContact] = useState(initialContact || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = (contact || '') !== (initialContact || '');

  const inputStyle = {
    background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none',
    width: '100%', maxWidth: 260, fontFamily: 'Sora, sans-serif',
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await api.patch(`/land/records/${recordId}/owner-contact/`, { owner_contact: contact.trim() });
      onSaved(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // keep it simple — a failed save just leaves the field editable to retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Owner Contact</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={inputStyle}
          placeholder="+233 24 456 7890"
          value={contact}
          onChange={e => setContact(e.target.value)}
        />
        {dirty && (
          <Button onClick={handleSave} loading={saving} style={{ padding: '8px 16px', fontSize: 13 }}>
            Save Contact
          </Button>
        )}
        {saved && <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ Saved</span>}
      </div>
    </div>
  );
}

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
  const [expandedGroups, setExpandedGroups] = useState({});
  const [statusReason, setStatusReason] = useState('');
  const [statusReasonCustom, setStatusReasonCustom] = useState('');

  const baseline = useRef(null); // snapshot of { form, status } as last loaded/saved

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/land/records/${id}/`);
      const rec = res.data.data || res.data;
      setRecord(rec);
      setForm(rec);
      setStatus(rec.status);
      setStatusReason('');
      setStatusReasonCustom('');
      baseline.current = { form: rec, status: rec.status };
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

  const statusChanged = baseline.current && status !== baseline.current.status;

  const isDirty = baseline.current && (
    JSON.stringify(form) !== JSON.stringify(baseline.current.form) ||
    status !== baseline.current.status
  );

  const reasonSatisfied = !statusChanged || (
    statusReason && (statusReason !== 'Custom' || statusReasonCustom.trim())
  );

  const canSave = isDirty && reasonSatisfied;

  const toggleGroup = (title) => setExpandedGroups(g => ({ ...g, [title]: !g[title] }));

 const handleCancel = () => {
  if (baseline.current) {
    setForm(baseline.current.form);
    setStatus(baseline.current.status);
  }
  setStatusReason('');
  setStatusReasonCustom('');
  setError('');
  setSuccess('');
  // Stay on this page — just discard the unsaved changes.
};
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...form, status };
      delete payload.id; delete payload.current_owner; delete payload.created_by;
      delete payload.created_at; delete payload.updated_at; delete payload.qr_code_url;
      if (payload.area_acres === '') payload.area_acres = null;
      if (statusChanged) {
        payload.status_change_reason = statusReason === 'Custom' ? statusReasonCustom.trim() : statusReason;
      }
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
    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
      ID: {record.current_owner.owner_national_id} · Acquired: {record.current_owner.acquired_at}
    </div>

    <OwnerContactEditor
      recordId={record.id}
      initialContact={record.current_owner.owner_contact}
      onSaved={(updated) => setRecord(r => ({ ...r, current_owner: { ...r.current_owner, owner_contact: updated.owner_contact } }))}
    />
  </Card>
)}

      {FIELD_GROUPS.map(group => {
        const isOpen = group.expandable ? !!expandedGroups[group.title] : true;
        return (
          <Card key={group.title} style={{ marginBottom: 20 }}>
            <div
              onClick={group.expandable ? () => toggleGroup(group.title) : undefined}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: isOpen ? 16 : 0, cursor: group.expandable ? 'pointer' : 'default',
              }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)', margin: 0 }}>{group.title}</h2>
              {group.expandable && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isOpen ? 'Collapse ▲' : 'Expand ▼'}</span>
              )}
            </div>

            {isOpen && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {group.fields.filter(([, , type]) => type !== 'map').map(([key, label, type, options]) => (
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

                {/* Interactive map for GPS coordinates, with the pinned location */}
                {group.fields.some(([, , type]) => type === 'map') && (
                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>GPS coordinates (pinned location)</label>
                    <MapPicker
                      value={form.gps_coordinates}
                      onChange={(coords) => setForm(f => ({ ...f, gps_coordinates: coords }))}
                      height={280}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        );
      })}

      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--gold)' }}>Status</h2>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }}>
          <option value="verified">Verified</option>
          <option value="disputed">Disputed</option>
          <option value="transferred">Transferred</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>

        {statusChanged && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <label style={labelStyle}>
              Reason for changing status to "{status}" <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              style={{ ...inputStyle, maxWidth: 360 }}
              value={statusReason}
              onChange={e => setStatusReason(e.target.value)}
            >
              <option value="">Select a reason…</option>
              {STATUS_CHANGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {statusReason === 'Custom' && (
              <input
                style={{ ...inputStyle, maxWidth: 360, marginTop: 10 }}
                placeholder="Describe the reason for this status change"
                value={statusReasonCustom}
                onChange={e => setStatusReasonCustom(e.target.value)}
              />
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              Status changes (e.g. marking a record as Disputed because of a pending court case) are recorded
              independently of ownership transfers — no transfer request is needed here.
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {canSave && (
          <Button onClick={handleSave} loading={saving}>Save All Changes</Button>
        )}
        <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
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