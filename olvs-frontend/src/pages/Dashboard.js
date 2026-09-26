import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, StatCard, Badge, Spinner, getStatusBadge, PageTitle } from '../components/UI';

function StatusBreakdown({ records }) {
  const statuses = ['verified', 'transferred', 'disputed', 'flagged', 'pending'];
  const counts = statuses.map(s => records.filter(r => r.status === s).length);
  const total = records.length || 1;
  const colors = {
    verified: 'var(--success)', transferred: 'var(--info)',
    disputed: 'var(--danger)', flagged: 'var(--danger)', pending: 'var(--warning)',
  };

  return (
    <Card style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Land records by status</h2>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 16, background: 'var(--dark-3)' }}>
        {statuses.map((s, i) => (
          counts[i] > 0 && (
            <div key={s} style={{ width: `${(counts[i] / total) * 100}%`, background: colors[s] }} />
          )
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
        {statuses.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[s], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto' }}>{counts[i]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentActivity({ logs }) {
  const actionColor = {
    verify: 'info', login: 'default', logout: 'default', register: 'success',
    transfer: 'gold', transfer_request: 'warning', create_record: 'success',
    tamper_detect: 'danger', admin_action: 'warning',
  };
  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent activity</h2>
        <Link to="/admin/audit" style={{ fontSize: 12, color: 'var(--gold)' }}>Full audit log →</Link>
      </div>
      {logs.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No activity recorded yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {logs.slice(0, 6).map(log => (
            <div key={log.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
              borderBottom: '1px solid var(--border)', fontSize: 12.5
            }}>
              <Badge type={actionColor[log.action] || 'default'}>{log.action.replace('_', ' ')}</Badge>
              <span style={{ color: 'var(--text-secondary)' }}>{log.user?.full_name || 'Anonymous'}</span>
              {log.land_title && <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)', fontSize: 11.5 }}>{log.land_title}</span>}
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 11 }}>
                {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CitizenEducation() {
  return (
    <Card style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>How your search is protected</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
        {[
          { icon: '🔗', title: 'Chained records', desc: 'Every past owner of a parcel is linked by a SHA-256 hash. Editing history breaks the chain and is caught instantly.' },
          { icon: '🧾', title: '15-field standard', desc: 'Deed reference, survey plan, GPS coordinates, and more, matched to how Ghanaian land documents are actually structured.' },
          { icon: '🚫', title: 'One owner rule', desc: 'The database itself blocks a second active owner from ever existing on the same parcel, not just the application code.' },
        ].map((item, i) => (
          <div key={i}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NationalContext() {
  return (
    <Card style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Why this matters in Ghana</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {[
          ['126–372 days', 'Average current processing time at the Lands Commission'],
          ['79.6%', 'Of sampled applications missed the 90-day target'],
          ['< 2 sec', 'How long an OLVS verification takes'],
        ].map(([val, lbl], i) => (
          <div key={i} style={{ background: 'var(--dark-3)', padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{val}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{lbl}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
        Source: Ghana Audit Service, Performance Audit Report on Land Registration in Ghana (2024)
      </p>
    </Card>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin) {
          const [dashRes, recordsRes, logsRes] = await Promise.all([
            api.get('/admin-panel/dashboard/'),
            api.get('/land/records/?page_size=50'),
            api.get('/admin-panel/audit-log/?page_size=6'),
          ]);
          setStats(dashRes.data.data);
          setRecords(recordsRes.data.results || []);
          setLogs(logsRes.data.results || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  return (
    <div className="fade-in">
      <PageTitle
        title={`Welcome, ${user?.full_name?.split(' ')[0]}`}
        subtitle={isAdmin ? 'Admin dashboard — full system overview' : 'Citizen portal — verify and understand land records'}
      />

      {loading ? <Spinner /> : (
        <>
          {isAdmin && stats && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
                <StatCard label="Land records" value={records.length} />
                <StatCard label="Verifications" value={stats.verifications} color="var(--info)" />
                <StatCard label="Transfers" value={stats.transfers} color="var(--success)" />
                <StatCard label="Flagged events" value={stats.flagged_events} color="var(--danger)" />
                <StatCard label="Tamper detections" value={stats.tamper_detections} color="var(--warning)" />
              </div>

              <StatusBreakdown records={records} />
              <RecentActivity logs={logs} />
            </>
          )}

          {!isAdmin && (
            <>
              <CitizenEducation />
              <NationalContext />
            </>
          )}

          {/* Quick actions */}
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Quick actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Link to="/verify" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--dark-2)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Verify Land</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Search by title number to verify ownership and check blockchain integrity</div>
              </div>
            </Link>

            {isAdmin && (
              <>
                <Link to="/admin/records/create" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--dark-2)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>➕</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Add Land Record</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Register a new land parcel with genesis ownership block</div>
                  </div>
                </Link>
                <Link to="/admin/transfers" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--dark-2)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>🔄</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Transfers</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Review and approve pending ownership transfer requests</div>
                  </div>
                </Link>
                <Link to="/admin/audit" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--dark-2)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Audit Log</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>View all system events, verifications, and flagged activity</div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
