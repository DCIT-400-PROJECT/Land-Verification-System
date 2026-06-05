import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, Badge, Spinner, PageTitle, StatCard } from '../components/UI';

const actionColor = {
  verify: 'info', login: 'default', logout: 'default', register: 'success',
  transfer: 'gold', transfer_request: 'warning', create_record: 'success',
  tamper_detect: 'danger', admin_action: 'warning',
};
const resultColor = { success: 'success', failed: 'danger', flagged: 'warning' };

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ action: '', result: '' });

  const load = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get(`/admin-panel/audit-log/?action=${filter.action}&result=${filter.result}`),
        api.get('/admin-panel/dashboard/'),
      ]);
      setLogs(logsRes.data.results || []);
      setStats(statsRes.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const sel = (key) => (e) => setFilter(f => ({ ...f, [key]: e.target.value }));

  const selectStyle = {
    background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)',
    fontFamily: 'Sora, sans-serif', cursor: 'pointer'
  };

  return (
    <div className="fade-in">
      <PageTitle title="Audit Log" subtitle="Complete record of every system action" />

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Total entries" value={stats.total_entries} />
          <StatCard label="Verifications" value={stats.verifications} color="var(--info)" />
          <StatCard label="Transfers" value={stats.transfers} color="var(--success)" />
          <StatCard label="Flagged" value={stats.flagged_events} color="var(--danger)" />
          <StatCard label="Tamper detects" value={stats.tamper_detections} color="var(--warning)" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filter.action} onChange={sel('action')} style={selectStyle}>
          <option value="">All actions</option>
          {['verify','login','logout','register','create_record','transfer','transfer_request','tamper_detect','admin_action'].map(a => (
            <option key={a} value={a}>{a.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={filter.result} onChange={sel('result')} style={selectStyle}>
          <option value="">All results</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <Card style={{ padding: 0 }}>
          {logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No log entries found.</div>
          ) : (
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                gap: 12, padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em'
              }}>
                <span>Timestamp</span><span>User</span><span>Action</span><span>Land title</span><span>Result</span>
              </div>
              {logs.map((log, i) => (
                <div key={log.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                  gap: 12, padding: '12px 20px', alignItems: 'center',
                  borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: 13, transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--dark-3)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{log.user?.full_name || 'Anonymous'}</span>
                  <Badge type={actionColor[log.action] || 'default'}>{log.action.replace('_', ' ')}</Badge>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--gold)' }}>{log.land_title || '—'}</span>
                  <Badge type={resultColor[log.result]}>{log.result}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
