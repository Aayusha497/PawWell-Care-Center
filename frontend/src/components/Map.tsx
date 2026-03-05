import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom marker for PawWell - using URL-encoded SVG to avoid btoa() Latin1 issues
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="48" height="48">
      <path fill="#ff6b6b" stroke="#fff" stroke-width="2" d="M12 0C7.029 0 3 4.029 3 9c0 7.5 9 18 9 18s9-10.5 9-18c0-4.971-4.029-9-9-9z"/>
      <circle fill="#fff" cx="12" cy="9" r="5"/>
      <circle fill="#ff6b6b" cx="12" cy="9" r="3"/>
    </svg>
  `),
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
  shadowUrl: markerShadow,
  shadowSize: [48, 48],
  shadowAnchor: [12, 48]
});

interface MapProps {
  height?: string;
  zoom?: number;
}

export default function Map({ height = '400px', zoom = 15 }: MapProps) {
  // Exact coordinates for Kamalpokhari, City Center, Kathmandu
  const position: [number, number] = [27.7120, 85.3260];

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* Normal Street Map View */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Marker position={position} icon={customIcon}>
          <Popup>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <strong style={{ fontSize: '17px', color: '#ff6b6b', display: 'block', marginBottom: '8px' }}>🐾 PawWell Care Center</strong>
              <p style={{ margin: '6px 0', fontSize: '14px', fontWeight: '500' }}>Kamalpokhari, City Center</p>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>Kathmandu, Nepal</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666', fontWeight: '500' }}>📞 +977-9703712593</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>⏱️ Open 24/7</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
