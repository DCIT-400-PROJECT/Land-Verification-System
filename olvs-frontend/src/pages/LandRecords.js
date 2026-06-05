import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Card, Button, Badge, Spinner, getStatusBadge, PageTitle, Alert } from '../components/UI';

export default function LandRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');

  const load = async (q = '', p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/land/records/?search=${q}&page=${p}`);
      setRecords(res.data.results || []);
      setCount(res.data.count || 0);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <PageTitle title="Land Records" subtitle={`${count} total records in the system`} />
        <Link to="/admin/records/create">
          <Button>+ Add Land Record</Button>
        </Link>
      </div>

      {error && <Alert type="danger" style={{ marginBottom: 16 }}>{error}</Alert>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title number, region, district..."
          style={{
            flex: 1, background: 'var(--dark-3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '9px 14px', fontSize: 13,
            color: 'var(--text-primary)', outline: 'none'
          }} />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {loading ? <Spinner /> : (
        <Card style={{ padding: 0 }}>
          {records.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No land records found.
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                gap: 16, padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                fontSize: 11, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em'
              }}>
                <span>Title Number</span><span>Region</span><span>Area</span><span>Status</span><span></span>
              </div>
              {records.map((r, i) => (
                <div key={r.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: 16, padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < records.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--dark-3)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, color: 'var(--gold)' }}>{r.title_number}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.location?.substring(0, 40)}{r.location?.length > 40 ? '…' : ''}</div>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.region}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.area_sqm} m²</span>
                  {getStatusBadge(r.status)}
                  <Link to={`/admin/records/${r.id}`} style={{ fontSize: 12, color: 'var(--gold)' }}>View →</Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Pagination */}
      {count > 20 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <Button variant="secondary" onClick={() => { setPage(p => p - 1); load(search, page - 1); }} style={{ padding: '7px 16px' }} disabled={page === 1}>← Prev</Button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>Page {page}</span>
          <Button variant="secondary" onClick={() => { setPage(p => p + 1); load(search, page + 1); }} style={{ padding: '7px 16px' }} disabled={page * 20 >= count}>Next →</Button>
        </div>
      )}
    </div>
  );
}
