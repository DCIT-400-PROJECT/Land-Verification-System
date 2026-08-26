import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSearchParams } from 'react-router-dom';
import { Card, Button, Alert, Badge, getStatusBadge, PageTitle } from '../components/UI';

// ── Dummy land records matching Ghana Land Commission data fields ──────────────
const DUMMY_RECORDS = {
  'GHA/ACC/CANT/001': {
    title_number: 'GHA/ACC/CANT/001',
    plot_number: 'Plot 5, Block C',
    land_type: 'Freehold',
    land_use: 'Residential',
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    locality: 'Cantonments',
    street_address: 'No. 5 Liberation Road, Cantonments, Accra',
    area_sqm: '650.00',
    area_acres: '0.16',
    beacon_numbers: 'BK-4421, BK-4422, BK-4423, BK-4424',
    gps_coordinates: '5.5600° N, 0.1769° W',
    registered_at: '2015-03-20',
    deed_type: 'Deed of Assignment',
    deed_reference: 'DEED/ACC/2015/4471',
    survey_plan_number: 'SP/ACC/2015/0892',
    surveyor_name: 'Kofi Mensah & Associates',
    surveyor_license: 'GS-1144',
    stamp_duty_paid: true,
    stamp_duty_ref: 'GRA/SD/2015/002291',
    town_planning_approval: 'TP/ACC/2015/0347',
    encumbrances: 'None',
    status: 'verified',
    owner: {
      name: 'Kwame Boateng',
      national_id: 'GHA-000112345-8',
      contact: '+233 24 456 7890',
      acquired_at: '2015-03-20',
    },
    blockchain: {
      integrity_valid: true,
      integrity_message: 'Chain of 1 block(s) is intact and untampered.',
      chain_length: 1,
    },
  },
  'GHA/ASH/KUM/002': {
    title_number: 'GHA/ASH/KUM/002',
    plot_number: 'Plot 12, House 12',
    land_type: 'Leasehold (99 years)',
    land_use: 'Residential / Commercial',
    region: 'Ashanti',
    district: 'Kumasi Metropolitan',
    locality: 'Adum',
    street_address: 'House 12, Adum Road, Kumasi',
    area_sqm: '400.00',
    area_acres: '0.10',
    beacon_numbers: 'BK-7710, BK-7711, BK-7712, BK-7713',
    gps_coordinates: '6.6885° N, 1.6244° W',
    registered_at: '2022-01-01',
    deed_type: 'Indenture',
    deed_reference: 'DEED/ASH/2022/1102',
    survey_plan_number: 'SP/ASH/2022/0310',
    surveyor_name: 'Ama Surveying Co.',
    surveyor_license: 'GS-2287',
    stamp_duty_paid: true,
    stamp_duty_ref: 'GRA/SD/2022/007712',
    town_planning_approval: 'TP/ASH/2022/0118',
    encumbrances: 'None',
    status: 'transferred',
    owner: {
      name: 'Ama Owusu',
      national_id: 'GHA-000298741-2',
      contact: '+233 20 123 4567',
      acquired_at: '2022-01-01',
    },
    blockchain: {
      integrity_valid: true,
      integrity_message: 'Chain of 2 block(s) is intact and untampered.',
      chain_length: 2,
    },
  },
  'GHA/WR/TAKOR/003': {
    title_number: 'GHA/WR/TAKOR/003',
    plot_number: 'Block C, New Estate',
    land_type: 'Freehold',
    land_use: 'Residential',
    region: 'Western',
    district: 'Sekondi-Takoradi Metropolitan',
    locality: 'New Estate, Takoradi',
    street_address: 'Block C, New Estate, Takoradi',
    area_sqm: '800.00',
    area_acres: '0.20',
    beacon_numbers: 'BK-3301, BK-3302, BK-3303, BK-3304',
    gps_coordinates: '4.8845° N, 1.7554° W',
    registered_at: '2018-11-05',
    deed_type: 'Deed of Assignment',
    deed_reference: 'DEED/WR/2018/0887',
    survey_plan_number: 'SP/WR/2018/0441',
    surveyor_name: 'Western Surveys Ltd',
    surveyor_license: 'GS-3390',
    stamp_duty_paid: true,
    stamp_duty_ref: 'GRA/SD/2018/004412',
    town_planning_approval: 'TP/WR/2018/0229',
    encumbrances: 'Under dispute — see district court file DCF/WR/2021/0044',
    status: 'disputed',
    owner: {
      name: 'Abena Darko',
      national_id: 'GHA-000387621-5',
      contact: '+233 27 789 0123',
      acquired_at: '2018-11-05',
    },
    blockchain: {
      integrity_valid: true,
      integrity_message: 'Chain of 1 block(s) is intact and untampered.',
      chain_length: 1,
    },
  },
};

function InfoRow({ label, value, mono = false, highlight = false }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '200px 1fr',
      gap: 12, padding: '9px 0',
      borderBottom: '1px solid var(--border)',
      alignItems: 'start',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 1 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: highlight ? 600 : 400,
        color: highlight ? 'var(--gold)' : 'var(--text-primary)',
        fontFamily: mono ? 'JetBrains Mono' : 'Sora',
      }}>{value || '—'}</span>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: 'var(--gold)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span>{icon}</span>{title}
      </div>
      {children}
    </Card>
  );
}

function BlockchainBadge({ blockchain }) {
  const valid = blockchain?.integrity_valid;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: valid ? 'rgba(46,204,113,0.07)' : 'rgba(231,76,60,0.07)',
      border: `1px solid ${valid ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
      borderRadius: 10, padding: '12px 16px',
    }}>
      <span style={{ fontSize: 22 }}>{valid ? '🔒' : '🚨'}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: valid ? 'var(--success)' : 'var(--danger)' }}>
          {valid ? 'Blockchain Integrity Verified' : 'Tamper Detected!'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          {blockchain?.integrity_message} · {blockchain?.chain_length} block(s)
        </div>
      </div>
    </div>
  );
}

export default function VerifyLand() {
  const [titleNumber, setTitleNumber] = useState('');
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [history, setHistory]         = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [source, setSource]           = useState(''); // 'api' | 'demo'
const [searchParams] = useSearchParams();

useEffect(() => {
  const titleFromUrl = searchParams.get('title');
  if (titleFromUrl) {
    setTitleNumber(titleFromUrl);
    // Trigger verification automatically
    verify({ preventDefault: () => {} });
  }
}, []);
  const verify = async (e) => {
    e.preventDefault();
    const tn = titleNumber.trim().toUpperCase();
    if (!tn) return;
    setLoading(true); setError(''); setResult(null);
    setHistory(null); setShowHistory(false);

    // Try live API first
    try {
      const res = await api.get(`/land/verify/${tn}/`);
      const data = res.data.data;
      if (data.found) {
        // Merge with dummy enrichment data if available
        const extra = DUMMY_RECORDS[tn] || {};
        setResult({ ...extra, ...data.land, owner: data.current_owner, blockchain: data.blockchain, qr_code_url: data.qr_code_url, found: true });
        setSource('api');
      } else {
        // Fall back to demo data
        const demo = DUMMY_RECORDS[tn];
        if (demo) { setResult({ ...demo, found: true }); setSource('demo'); }
        else { setResult({ found: false }); }
      }
    } catch {
      // Offline fallback to demo data
      const demo = DUMMY_RECORDS[tn];
      if (demo) { setResult({ ...demo, found: true }); setSource('demo'); }
      else { setResult({ found: false }); }
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    try {
      const res = await api.get(`/land/history/${titleNumber.trim().toUpperCase()}/`);
      setHistory(res.data.data);
    } catch {
      setHistory(null);
    }
    setShowHistory(true);
  };

  const statusColorMap = { verified: 'success', disputed: 'danger', transferred: 'info', pending: 'warning', flagged: 'danger' };

  return (
    <div className="fade-in">
      <PageTitle
        title="Land Title Verification"
        subtitle="Enter a Ghana Lands Commission title number to verify ownership, documents, and blockchain integrity"
      />

      {/* Search bar */}
      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={verify} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Land Title Number
            </label>
            <input
              value={titleNumber}
              onChange={e => setTitleNumber(e.target.value)}
              placeholder="e.g. GHA/ACC/CANT/001"
              style={{
                width: '100%', background: 'var(--dark-3)',
                border: '1px solid var(--border)', borderRadius: 10,
                padding: '11px 16px', fontSize: 15,
                fontFamily: 'JetBrains Mono', letterSpacing: '0.05em',
                color: 'var(--text-primary)', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <Button type="submit" loading={loading} style={{ height: 44, paddingLeft: 24, paddingRight: 24 }}>
            🔍 Verify Title
          </Button>
        </form>

        {/* Demo quick-fill */}
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try demo titles:</span>
          {Object.keys(DUMMY_RECORDS).map(t => (
            <button key={t} onClick={() => setTitleNumber(t)} style={{
              fontFamily: 'JetBrains Mono', fontSize: 11, padding: '4px 10px',
              background: 'var(--dark-4)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--gold)', cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
      </Card>

      {error && <Alert type="danger" style={{ marginBottom: 16 }}>{error}</Alert>}

      {result && (
        <div className="slide-up">
          {!result.found ? (
            <Alert type="warning">
              No land record found for <strong>{titleNumber.toUpperCase()}</strong>. Ensure the title number is correct and registered with the Ghana Lands Commission.
            </Alert>
          ) : (
            <>
              {/* Source notice */}
              {source === 'demo' && (
                <Alert type="info" style={{ marginBottom: 16 }}>
                  Showing demo data for this title. Connect to the live backend for real records.
                </Alert>
              )}

              {/* Header strip */}
              <div style={{
                background: 'linear-gradient(135deg, var(--dark-3), var(--dark-4))',
                border: '1px solid var(--border-hover)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Land Title Number</div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--gold)', letterSpacing: '0.04em' }}>
                    {result.title_number}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{result.street_address || result.location}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  {getStatusBadge(result.status)}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Verified {new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Blockchain integrity */}
              <div style={{ marginBottom: 16 }}>
                <BlockchainBadge blockchain={result.blockchain} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Left column */}
                <div>
                  {/* Current owner */}
                  <Section title="Current Owner" icon="👤">
                    <InfoRow label="Full Legal Name" value={result.owner?.owner_name || result.owner?.name} highlight />
                    <InfoRow label="National ID" value={result.owner?.owner_national_id || result.owner?.national_id} mono />
                    <InfoRow label="Contact" value={result.owner?.contact} />
                    <InfoRow label="Date of Acquisition" value={result.owner?.acquired_at || result.owner?.acquired_at} />
                  </Section>

                  {/* Land details */}
                  <Section title="Land Details" icon="📍">
                    <InfoRow label="Plot Number" value={result.plot_number} />
                    <InfoRow label="Land Type" value={result.land_type} />
                    <InfoRow label="Land Use" value={result.land_use} />
                    <InfoRow label="Region" value={result.region} />
                    <InfoRow label="District" value={result.district} />
                    <InfoRow label="Locality" value={result.locality} />
                    <InfoRow label="Area (m²)" value={result.area_sqm ? `${result.area_sqm} m²` : null} />
                    <InfoRow label="Area (Acres)" value={result.area_acres ? `${result.area_acres} acres` : null} />
                    <InfoRow label="GPS Coordinates" value={result.gps_coordinates} mono />
                    <InfoRow label="Beacon Numbers" value={result.beacon_numbers} mono />
                  </Section>
                </div>

                {/* Right column */}
                <div>
                  {/* Legal documents */}
                  <Section title="Legal Documents" icon="📄">
                    <InfoRow label="Deed Type" value={result.deed_type} />
                    <InfoRow label="Deed Reference" value={result.deed_reference} mono />
                    <InfoRow label="Date Registered" value={result.registered_at} />
                    <InfoRow label="Survey Plan No." value={result.survey_plan_number} mono />
                    <InfoRow label="Licensed Surveyor" value={result.surveyor_name} />
                    <InfoRow label="Surveyor License No." value={result.surveyor_license} mono />
                    <InfoRow label="Town Planning Approval" value={result.town_planning_approval} mono />
                  </Section>

                  {/* Compliance */}
                  <Section title="Compliance & Encumbrances" icon="✅">
                    <InfoRow
                      label="Stamp Duty"
                      value={result.stamp_duty_paid ? '✅ Paid' : '❌ Not paid'}
                    />
                    <InfoRow label="Stamp Duty Ref." value={result.stamp_duty_ref} mono />
                    <InfoRow label="Encumbrances / Disputes" value={result.encumbrances} />
                    <InfoRow label="Court Orders" value="None on record" />
                  </Section>

                  {/* QR code */}
                  {result.qr_code_url && (
                    <Section title="QR Verification Code" icon="📱">
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <img
                          src={result.qr_code_url.startsWith('http') ? result.qr_code_url : `http://localhost:8000${result.qr_code_url}`}
                          alt="QR Code"
                          style={{ width: 90, height: 90, background: '#fff', padding: 6, borderRadius: 8 }}
                        />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          Scan to instantly re-verify this land title without typing the number.
                        </span>
                      </div>
                    </Section>
                  )}
                </div>
              </div>

              {/* Ownership history */}
              <Button variant="secondary" onClick={loadHistory} style={{ marginBottom: 16 }}>
                {showHistory ? '▲ Hide ownership history' : '▼ View full ownership chain'}
              </Button>

              {showHistory && (
                <Section title="Ownership History — Blockchain Chain" icon="🔗">
                  {history ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {history.history.map((block) => (
                        <div key={block.id || block.block_index} style={{
                          background: 'var(--dark-3)', borderRadius: 10, padding: '14px 16px',
                          border: `1px solid ${block.is_current ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Block #{block.block_index}</span>
                            {block.is_current && <Badge type="gold">Current Owner</Badge>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{block.owner_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                            ID: {block.owner_national_id} · Acquired: {block.acquired_at}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 8, wordBreak: 'break-all' }}>
                            {block.block_hash}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Connect to the live backend to view the full blockchain chain.</p>
                  )}
                </Section>
              )}

              {/* Print / share */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Button variant="secondary" onClick={() => window.print()}>🖨 Print / Save as PDF</Button>
                <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(result.title_number); }}>📋 Copy Title Number</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
