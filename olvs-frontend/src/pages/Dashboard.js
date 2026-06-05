import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, StatCard, Badge, Spinner, getStatusBadge, PageTitle } from '../components/UI';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin) {
          const [dashRes, recordsRes] = await Promise.all([
            api.get('/admin-panel/dashboard/'),
            api.get('/land/records/?page_size=5'),
          ]);
          setStats(dashRes.data.data);
          setRecent(recordsRes.data.results || []);
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
        subtitle={isAdmin ? 'Admin dashboard — full system overview' : 'Citizen portal — verify and track land records'}
      />

      {loading ? <Spinner /> : (
        <>
          {isAdmin && stats && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
                <StatCard label="Total verifications" value={stats.verifications} />
                <StatCard label="Transfers" value={stats.transfers} color="var(--info)" />
                <StatCard label="Flagged events" value={stats.flagged_events} color="var(--danger)" />
                <StatCard label="Tamper detections" value={stats.tamper_detections} color="var(--warning)" />
              </div>

              <Card style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent land records</h2>
                  <Link to="/admin/records" style={{ fontSize: 13, color: 'var(--gold)' }}>View all →</Link>
                </div>
                {recent.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No records yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {recent.map(r => (
                      <div key={r.id} style={{
                        display: 'grid', gridTemplateColumns: '1fr auto auto',
                        gap: 16, alignItems: 'center', padding: '12px 0',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>{r.title_number}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.region} · {r.district}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.area_sqm} m²</div>
                        {getStatusBadge(r.status)}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* Quick actions */}
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
