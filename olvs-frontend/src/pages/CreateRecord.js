import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, Button, Alert, PageTitle } from '../components/UI';
import MapPicker from '../components/MapPicker';

const emptyLand = {
  title_number: '', location: '', region: '', district: '',
  area_sqm: '', registered_at: '',
  plot_number: '', land_type: '', land_use: '', locality: '',
  area_acres: '', gps_coordinates: '', beacon_numbers: '',
  deed_type: '', deed_reference: '', survey_plan_number: '',
  surveyor_name: '', surveyor_license: '', town_planning_approval: '',
  stamp_duty_paid: false, stamp_duty_ref: '', encumbrances: 'None',
};

const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' };

const inputStyle = (hasError) => ({
  background: 'var(--dark-3)',
  border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
  borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 14,
  color: 'var(--text-primary)', outline: 'none', width: '100%',
  fontFamily: 'Sora, sans-serif', transition: 'border-color 0.2s',
});

// IMPORTANT: Field is defined at MODULE level, not inside CreateRecord.
// Defining it inside the component would create a new component type on
// every keystroke and remount the input, dropping focus after each character.
function Field({ label, value, onChange, error, type = 'text', placeholder, required, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={labelStyle}>{label}</label>
      {options ? (
        <select style={inputStyle(error)} value={value} onChange={onChange}>
          <option value="">Select…</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          style={inputStyle(error)} type={type} placeholder={placeholder}
          value={value} onChange={onChange} required={required}
          onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
          onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; }}
        />
      )}
      {error && <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{error}</span>}
    </div>
  );
}

const LAND_TYPES = [
  { value: 'freehold', label: 'Freehold' },
  { value: 'leasehold_50', label: 'Leasehold (50 years)' },
  { value: 'leasehold_99', label: 'Leasehold (99 years)' },
  { value: 'stool_land', label: 'Stool Land' },
  { value: 'state_land', label: 'State Land' },
];
const LAND_USES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'agricultural', label: 'Agricultural' },
  { value: 'mixed', label: 'Mixed Use' },
];

export default function CreateRecord() {
  const navigate = useNavigate();
  const [land, setLand] = useState(emptyLand);
  const [owner, setOwner] = useState({ owner_name: '', owner_national_id: '', owner_contact: '', acquired_at: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const setL = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setLand(f => ({ ...f, [k]: val }));
  };
  const setO = (k) => (e) => setOwner(f => ({ ...f, [k]: e.target.value }));

  // Helper: props shared by every land field
  const lf = (k) => ({ value: land[k], onChange: setL(k), error: errors.land?.[k]?.[0] });
  const of = (k) => ({ value: owner[k], onChange: setO(k), error: errors.initial_owner?.[k]?.[0] });

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setErrors({}); setSuccess('');
    try {
      const payload = { ...land };
      // An empty number field must be sent as null, not an empty string
      if (payload.area_acres === '') payload.area_acres = null;
      const res = await api.post('/land/records/create/', { land: payload, initial_owner: owner });
      setSuccess(`Land record ${res.data.data.title_number} created successfully with genesis block.`);
      setTimeout(() => navigate('/admin/records'), 2000);
    } catch (err) {
      setErrors(err.response?.data?.error?.details || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 760 }}>
      <PageTitle title="Add Land Record" subtitle="Create a new land parcel with its genesis ownership block" />
      {success && <Alert type="success" style={{ marginBottom: 20 }}>{success}</Alert>}

      <form onSubmit={handle}>
        <Card style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Basic Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Title number" placeholder="GHA/ACC/CANT/001" required {...lf('title_number')} />
            <Field label="Location / Plot description" placeholder="Plot 5, Cantonments, Accra" required {...lf('location')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Region" placeholder="Greater Accra" required {...lf('region')} />
              <Field label="District" placeholder="Accra" {...lf('district')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Area (m²)" type="number" placeholder="500" required {...lf('area_sqm')} />
              <Field label="Registration date" type="date" required {...lf('registered_at')} />
            </div>
          </div>
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Land Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Plot number" placeholder="Plot 5, Block C" {...lf('plot_number')} />
              <Field label="Locality" placeholder="Cantonments" {...lf('locality')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Land type" options={LAND_TYPES} {...lf('land_type')} />
              <Field label="Land use" options={LAND_USES} {...lf('land_use')} />
            </div>
            <Field label="Area (acres)" type="number" placeholder="0.178" {...lf('area_acres')} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>GPS coordinates</label>
              <MapPicker
                value={land.gps_coordinates}
                onChange={(coords) => setLand(f => ({ ...f, gps_coordinates: coords }))}
              />
              {errors.land?.gps_coordinates?.[0] && (
                <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.land.gps_coordinates[0]}</span>
              )}
            </div>

            <Field label="Beacon numbers" placeholder="BK-5501, BK-5502, BK-5503" {...lf('beacon_numbers')} />
          </div>
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Legal Documents</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Deed type" placeholder="Deed of Assignment" {...lf('deed_type')} />
              <Field label="Deed reference" placeholder="DEED/GA/2019/2201" {...lf('deed_reference')} />
            </div>
            <Field label="Survey plan number" placeholder="SP/GA/2019/0512" {...lf('survey_plan_number')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Licensed surveyor" placeholder="Ampofo & Associates" {...lf('surveyor_name')} />
              <Field label="Surveyor license no." placeholder="GS-1801" {...lf('surveyor_license')} />
            </div>
            <Field label="Town planning approval" placeholder="TP/GA/2019/0207" {...lf('town_planning_approval')} />
          </div>
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Compliance and Encumbrances</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={land.stamp_duty_paid} onChange={setL('stamp_duty_paid')} />
              Stamp duty paid
            </label>
            <Field label="Stamp duty reference" placeholder="GRA/SD/2019/003321" {...lf('stamp_duty_ref')} />
            <Field label="Encumbrances / disputes" placeholder="None" {...lf('encumbrances')} />
          </div>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>Initial Owner (Genesis Block)</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6, padding: '10px 12px', background: 'var(--dark-3)', borderRadius: 8 }}>
            This creates the first blockchain block (Block #0) for this land. Once set, it becomes part of the immutable chain.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Owner full name" placeholder="Kwame Asante" required {...of('owner_name')} />
            <Field label="Owner national ID" placeholder="GHA-XXXXXXXXX-X" required {...of('owner_national_id')} />
            <Field label="Owner contact" placeholder="+233 24 456 7890" {...of('owner_contact')} />
            <Field label="Date of ownership" type="date" required {...of('acquired_at')} />
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" loading={loading}>Create Land Record + Genesis Block</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/records')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}