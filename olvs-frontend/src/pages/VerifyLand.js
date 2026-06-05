import React, { useState } from 'react';
import api from '../api/axios';
import { Card, Button, Input, Alert, Badge, getStatusBadge, PageTitle } from '../components/UI';

function BlockChainResult({ blockchain }) {
  return (
    <div style={{
      background: blockchain.integrity_valid ? 'rgba(46,204,113,0.06)' : 'rgba(231,76,60,0.06)',
      border: `1px solid ${blockchain.integrity_valid ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
      borderRadius: 12, padding: '16px 20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{blockchain.integrity_valid ? '✅' : '🚨'}</span>
        <div style={{ fontSize: 15, fontWeight: 600, color: blockchain.integrity_valid ? 'var(--success)' : 'var(--danger)' }}>
          {blockchain.integrity_valid ? 'Blockchain Integrity Verified' : 'Blockchain Tamper Detected!'}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{blockchain.integrity_message}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Chain length: {blockchain.chain_length} block(s)</div>
    </div>
  );
}

function OwnerCard({ owner }) {
  if (!owner) return null;
  return (
    <div style={{
      background: 'var(--dark-3)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px'
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Current Owner</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{owner.owner_name}</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ID: <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)' }}>{owner.owner_national_id}</code></span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Since: <strong style={{ color: 'var(--text-primary)' }}>{owner.acquired_at}</strong></span>
      </div>
    </div>
  );
}

export default function VerifyLand() {
  const [titleNumber, setTitleNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    if (!titleNumber.trim()) return;
    setLoading(true); setError(''); setResult(null); setHistory(null); setShowHistory(false);
    try {
      const res = await api.get(`/land/verify/${titleNumber.trim().toUpperCase()}/`);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    try {
      const res = await api.get(`/land/history/${titleNumber.trim().toUpperCase()}/`);
      setHistory(res.data.data);
      setShowHistory(true);
    } catch {}
  };

  return (
    <div className="fade-in">
      <PageTitle title="Verify Land Ownership" subtitle="Enter a land title number to check ownership and blockchain integrity" />

      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={verify} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="e.g. GHA/ACC/CANT/001"
            value={titleNumber}
            onChange={e => setTitleNumber(e.target.value)}
            style={{ flex: 1, minWidth: 240, fontFamily: 'JetBrains Mono', fontSize: 15, letterSpacing: '0.04em' }}
          />
          <Button type="submit" loading={loading} style={{ whiteSpace: 'nowrap' }}>
            🔍 Verify Now
          </Button>
        </form>
      </Card>

      {error && <Alert type="danger">{error}</Alert>}

      {result && (
        <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!result.found ? (
            <Alert type="warning">No land record found for title number <strong>{titleNumber}</strong>. Please check the number and try again.</Alert>
          ) : (
            <>
              {/* Land details */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Land Title</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--gold)' }}>{result.land.title_number}</div>
                  </div>
                  {getStatusBadge(result.land.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  {[
                    ['Location', result.land.location],
                    ['Region', result.land.region],
                    ['District', result.land.district || '—'],
                    ['Area', `${result.land.area_sqm} m²`],
                    ['Registered', result.land.registered_at],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <OwnerCard owner={result.current_owner} />
              <BlockChainResult blockchain={result.blockchain} />

              {/* QR Code */}
              {result.qr_code_url && (
                <Card style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <img src={`http://localhost:8000${result.qr_code_url.includes('http') ? '' : result.qr_code_url}`}
                    alt="QR Code" style={{ width: 100, height: 100, background: '#fff', padding: 8, borderRadius: 8 }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>QR Verification Code</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Scan this QR code to instantly re-verify this land title without typing the title number.
                    </div>
                  </div>
                </Card>
              )}

              {/* Ownership history toggle */}
              <Button variant="secondary" onClick={loadHistory} style={{ alignSelf: 'flex-start' }}>
                {showHistory ? '▲ Hide ownership history' : '▼ View ownership history'}
              </Button>

              {showHistory && history && (
                <Card>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Ownership history — {history.chain_length} block(s)</h3>
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
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>ID: {block.owner_national_id} · Acquired: {block.acquired_at}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 8, wordBreak: 'break-all' }}>
                          {block.block_hash}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
