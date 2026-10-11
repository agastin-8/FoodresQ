import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function createStopIcon(emoji, number, isCompleted, isCurrent) {
  let bg = 'bg-surface-600';
  let ring = '';
  if (isCompleted) bg = 'bg-emerald-600';
  else if (isCurrent) {
    bg = 'bg-amber-500';
    ring = 'ring-4 ring-amber-300 animate-pulse';
  }

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 rounded-full ${bg} ${ring} border-2 border-white shadow-lg flex items-center justify-center text-base">
          <span>${emoji}</span>
        </div>
        <div class="absolute -top-2 -right-1 bg-surface-900 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white">
          ${number}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function createVehicleIcon(heading = 0) {
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-2 rounded-full bg-primary-500/30 animate-ping"></div>
        <div class="w-10 h-10 rounded-full bg-primary-600 border-2 border-white shadow-xl flex items-center justify-center text-lg ring-4 ring-primary-300">
          <span>🚚</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

// Generate intermediate road curvature points between coordinates
function generateWaypoints(start, end, numPoints = 15) {
  const points = [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const midLat = (lat1 + lat2) / 2 + (lng2 - lng1) * 0.1;
  const midLng = (lng1 + lng2) / 2 - (lat2 - lat1) * 0.1;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * midLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

export default function MultiStopLeafletMap({
  stops,
  receivingCentre,
  deliveryConfirmed,
  vehiclePosition,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const vehicleMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const activeTrailRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.915, 77.642],
        zoom: 14,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const allPoints = [];

    // Add Stops
    stops.forEach((stop, idx) => {
      const isCompleted = stop.status === 'Picked Up';
      const isCurrent = stop.status === 'Arrived';
      const marker = L.marker([stop.lat, stop.lng], {
        icon: createStopIcon(stop.image || '🍱', idx + 1, isCompleted, isCurrent),
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-1">
          <p class="font-bold text-sm text-surface-900">Stop ${idx + 1}: ${stop.name}</p>
          <p class="text-xs text-surface-500">${stop.location}</p>
          <div class="mt-1 flex items-center justify-between gap-2 text-xs">
            <span class="font-semibold text-primary-700">${stop.food}</span>
            <span class="px-1.5 py-0.5 rounded font-bold text-[10px] ${
              isCompleted ? 'bg-emerald-100 text-emerald-800' : isCurrent ? 'bg-amber-100 text-amber-800' : 'bg-surface-100 text-surface-600'
            }">${stop.status}</span>
          </div>
        </div>
      `);

      markersRef.current.push(marker);
      allPoints.push([stop.lat, stop.lng]);
    });

    // Add Receiving Centre
    const rcLat = receivingCentre?.lat || 12.925;
    const rcLng = receivingCentre?.lng || 77.65;
    const rcMarker = L.marker([rcLat, rcLng], {
      icon: L.divIcon({
        className: 'custom-rc-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-11 h-11 rounded-full ${deliveryConfirmed ? 'bg-emerald-600' : 'bg-purple-600'} border-2 border-white shadow-xl flex items-center justify-center text-xl">
              <span>🏠</span>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-purple-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
              Receiving Centre
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      }),
    }).addTo(map);

    rcMarker.bindPopup(`
      <div class="p-1">
        <p class="font-bold text-sm text-surface-900">${receivingCentre?.name || 'Hope Receiving Centre'}</p>
        <p class="text-xs text-surface-500">${receivingCentre?.address || 'Indiranagar Hub'}</p>
        <div class="mt-1 text-xs font-semibold ${deliveryConfirmed ? 'text-emerald-600' : 'text-purple-700'}">
          ${deliveryConfirmed ? '✅ All Donations Received' : '⏳ Handover Target: 1:30 PM'}
        </div>
      </div>
    `);

    markersRef.current.push(rcMarker);
    allPoints.push([rcLat, rcLng]);

    // Draw route polyline
    polylineRef.current = L.polyline(allPoints, {
      color: '#7c3aed',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.8,
    }).addTo(map);

    // Fit bounds
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });
    }
  }, [stops, receivingCentre, deliveryConfirmed]);

  // Handle vehicle marker position
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const currentPos = vehiclePosition || [stops[0]?.lat || 12.9116, stops[0]?.lng || 77.6389];

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng(currentPos);
    } else {
      vehicleMarkerRef.current = L.marker(currentPos, {
        icon: createVehicleIcon(),
        zIndexOffset: 1000,
      }).addTo(map);
    }
  }, [vehiclePosition, stops]);

  return (
    <div className="relative w-full h-[320px]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-2 right-2 z-20 bg-surface-900/85 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/10 flex items-center gap-1.5 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>🚚 Live Multi-Stop Dispatch</span>
      </div>
    </div>
  );
}
