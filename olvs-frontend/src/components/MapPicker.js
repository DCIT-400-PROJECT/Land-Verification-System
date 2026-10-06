import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibXItZGVycmljazEiLCJhIjoiY211dW4zN2R6MWZxNTJ6czF1ZGowZTRvcCJ9.6tPFqOn2ndBlpkgVaD5COQ';

// Parses "5.6500° N, 0.1500° W" style strings (and plain "lat, lng") back into [lng, lat]
function parseCoordinates(str) {
  if (!str) return null;
  const m = str.match(/(-?\d+(\.\d+)?)\s*°?\s*([NSns]?)[,\s]+(-?\d+(\.\d+)?)\s*°?\s*([EWew]?)/);
  if (!m) return null;
  let lat = parseFloat(m[1]);
  let lng = parseFloat(m[4]);
  if (/[Ss]/.test(m[3])) lat = -Math.abs(lat);
  if (/[Ww]/.test(m[6])) lng = -Math.abs(lng);
  return [lng, lat];
}

function formatCoordinates(lng, lat) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

export default function MapPicker({ value, onChange, height = 320 }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const initial = parseCoordinates(value) || [-0.1870, 5.6037]; // defaults to Accra, Ghana
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initial,
      zoom: parseCoordinates(value) ? 15 : 7,
    });
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ color: '#D4AF37', draggable: true })
      .setLngLat(initial)
      .addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      onChange(formatCoordinates(lng, lat));
    });

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      onChange(formatCoordinates(e.lngLat.lng, e.lngLat.lat));
    });

    return () => map.remove();
    
  }, []);

  const runSearch = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (!text.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${mapboxgl.accessToken}&country=GH&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const pickSuggestion = (feature) => {
    const [lng, lat] = feature.center;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 16, essential: true });
    markerRef.current.setLngLat([lng, lat]);
    onChange(formatCoordinates(lng, lat));
    setQuery(feature.place_name);
    setSuggestions([]);
  };

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          value={query}
          onChange={e => runSearch(e.target.value)}
          placeholder="Search for a place in Ghana…"
          style={{
            width: '100%', background: 'var(--dark-3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 14,
            color: 'var(--text-primary)', outline: 'none', fontFamily: 'Sora, sans-serif',
          }}
        />
        {searching && (
          <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 11, color: 'var(--text-muted)' }}>…</span>
        )}
        {suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: 'var(--dark-3)', border: '1px solid var(--border)',
            borderRadius: 8, marginTop: 4, overflow: 'hidden',
          }}>
            {suggestions.map(f => (
              <div key={f.id} onClick={() => pickSuggestion(f)}
                style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--dark-2, #222)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                {f.place_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div ref={mapContainer} style={{ width: '100%', height, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }} />

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Search a place, click the map, or drag the pin to set the exact GPS coordinates.
        {value && <span style={{ color: 'var(--gold)', marginLeft: 6, fontFamily: 'JetBrains Mono' }}>{value}</span>}
      </div>
    </div>
  );
}