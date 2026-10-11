import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Radio,
  Play,
  Pause,
  AlertTriangle,
  Clock,
  Compass,
  Zap,
  Gauge,
  RotateCcw,
  FastForward,
  Sparkles,
} from 'lucide-react';
import { getSocket, joinTrackingRoom, leaveTrackingRoom, emitGpsUpdate, emitGpsStop } from '../services/socket';
import { trackingApi } from '../services/api';

// Generate realistic road waypoints between two coordinates with smooth curvature
function generateWaypoints(start, end, numPoints = 25) {
  const points = [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  const midLat = (lat1 + lat2) / 2 + (lng2 - lng1) * 0.15;
  const midLng = (lng1 + lng2) / 2 - (lat2 - lat1) * 0.15;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * midLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

// Calculate bearing/heading angle in degrees
function calculateHeading(lat1, lng1, lat2, lng2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Custom Leaflet DivIcons
function createCustomMarker(emoji, label, colorClass, isVolunteer = false, isLive = false, heading = 0) {
  if (isVolunteer) {
    return L.divIcon({
      className: 'custom-leaflet-volunteer-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-3 rounded-full bg-emerald-500/30 animate-ping"></div>
          <div class="relative w-11 h-11 rounded-full bg-emerald-600 border-2 border-white shadow-2xl flex items-center justify-center text-xl ring-4 ring-emerald-300">
            <span>🛵</span>
          </div>
          <div class="absolute -top-2 -right-1 w-5 h-5 rounded-full bg-surface-900 border border-white flex items-center justify-center shadow">
            <span style="display:inline-block; transform: rotate(${heading}deg); font-size: 10px; color: #34d399;">▲</span>
          </div>
          ${label ? `<div class="absolute -bottom-6 whitespace-nowrap bg-surface-900/90 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow pointer-events-none">${label}</div>` : ''}
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="relative w-10 h-10 rounded-full ${colorClass} border-2 border-white shadow-lg flex items-center justify-center text-lg transform hover:scale-110 transition-transform">
          <span>${emoji}</span>
        </div>
        ${label ? `<div class="absolute -bottom-6 whitespace-nowrap bg-surface-900/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow pointer-events-none">${label}</div>` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

export default function LiveTrackingMap({
  donationId,
  donorLocation,
  ngoLocation,
  destinationLocation,
  volunteer,
  status = 'ON_THE_WAY',
  onLocationUpdate,
  onAutoStatusChange,
  isAuthorizedVolunteer = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);
  const activeTrailRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastTriggeredStatusRef = useRef(status);

  // Auto-drive simulation and auto-progressing timeline enabled by default
  const [isAutoDriving, setIsAutoDriving] = useState(true);
  const [autoAdvanceTimeline, setAutoAdvanceTimeline] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 4x
  const [realGpsActive, setRealGpsActive] = useState(false);
  const [autoPan, setAutoPan] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Lat / Lng anchor points
  const donorLat = Number(donorLocation?.lat) || 12.9352;
  const donorLng = Number(donorLocation?.lng) || 77.6245;
  const ngoLat = Number(ngoLocation?.lat) || 12.9784;
  const ngoLng = Number(ngoLocation?.lng) || 77.6408;
  const destLat = Number(destinationLocation?.lat) || 12.9620;
  const destLng = Number(destinationLocation?.lng) || 77.6550;

  // Precompute street waypoints for Leg 1 (NGO -> Donor) and Leg 2 (Donor -> Destination)
  const leg1Waypoints = useRef(generateWaypoints([ngoLat, ngoLng], [donorLat, donorLng], 30));
  const leg2Waypoints = useRef(generateWaypoints([donorLat, donorLng], [destLat, destLng], 30));
  const allRouteWaypoints = useRef([...leg1Waypoints.current, ...leg2Waypoints.current]);

  const getInitialProgressForStatus = (st) => {
    switch (st) {
      case 'AVAILABLE':
      case 'ACCEPTED':
      case 'PICKUP_SCHEDULED':
        return 0.02;
      case 'ON_THE_WAY':
        return 0.25;
      case 'ARRIVED':
        return 0.50;
      case 'PICKED_UP':
        return 0.75;
      case 'DELIVERED':
        return 0.95;
      case 'COMPLETED':
        return 0.99;
      default:
        return 0.25;
    }
  };

  const [progressIndex, setProgressIndex] = useState(() => {
    const total = allRouteWaypoints.current.length - 1;
    return Math.floor(getInitialProgressForStatus(status) * total);
  });

  const [telemetry, setTelemetry] = useState({
    lat: ngoLat,
    lng: ngoLng,
    heading: 45,
    speedKmh: 28.5,
    accuracyMeters: 4.5,
    lastUpdated: new Date().toISOString(),
  });

  // Track status changes from outside (e.g. manual status change)
  useEffect(() => {
    lastTriggeredStatusRef.current = status;
  }, [status]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [donorLat, donorLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m?.remove());
    markersRef.current = {};

    if (polylineRef.current) polylineRef.current.remove();
    if (activeTrailRef.current) activeTrailRef.current.remove();

    // 1. Donor Pickup Marker
    const donorMarker = L.marker([donorLat, donorLng], {
      icon: createCustomMarker('🍱', 'Pickup Point', 'bg-amber-500 text-white'),
    }).addTo(map);
    donorMarker.bindPopup(`
      <div class="p-1">
        <p class="font-bold text-sm text-surface-900">${donorLocation?.name || 'Green Kitchen Restaurant'}</p>
        <p class="text-xs text-surface-500">${donorLocation?.address || 'Koramangala 4th Block, Bangalore'}</p>
        <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Donor Pickup</span>
      </div>
    `);
    markersRef.current.donor = donorMarker;

    // 2. NGO Base Dispatch Marker
    const ngoMarker = L.marker([ngoLat, ngoLng], {
      icon: createCustomMarker('🏢', 'NGO Dispatch Hub', 'bg-blue-600 text-white'),
    }).addTo(map);
    ngoMarker.bindPopup(`
      <div class="p-1">
        <p class="font-bold text-sm text-surface-900">${ngoLocation?.name || 'FeedIndia Foundation'}</p>
        <p class="text-xs text-surface-500">${ngoLocation?.address || 'Indiranagar 100ft Road, Bangalore'}</p>
        <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Dispatch Base</span>
      </div>
    `);
    markersRef.current.ngo = ngoMarker;

    // 3. Destination Receiving Center Marker
    const destMarker = L.marker([destLat, destLng], {
      icon: createCustomMarker('🎯', 'Receiving Centre', 'bg-emerald-600 text-white'),
    }).addTo(map);
    destMarker.bindPopup(`
      <div class="p-1">
        <p class="font-bold text-sm text-surface-900">${destinationLocation?.name || 'Hope Community Shelter'}</p>
        <p class="text-xs text-surface-500">${destinationLocation?.address || 'Domlur 2nd Stage, Bangalore'}</p>
        <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Final Destination</span>
      </div>
    `);
    markersRef.current.destination = destMarker;

    // 4. Route Polyline
    polylineRef.current = L.polyline(allRouteWaypoints.current, {
      color: '#059669',
      weight: 4,
      opacity: 0.5,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(map);

    // 5. Active dynamic driven trail
    activeTrailRef.current = L.polyline([], {
      color: '#10b981',
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    // Fit bounds
    const bounds = L.latLngBounds([
      [donorLat, donorLng],
      [ngoLat, ngoLng],
      [destLat, destLng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [donorLat, donorLng, ngoLat, ngoLng, destLat, destLng, donorLocation, ngoLocation, destinationLocation]);

  // Update vehicle marker on map
  useEffect(() => {
    if (!mapInstanceRef.current || !telemetry.lat || !telemetry.lng) return;

    const map = mapInstanceRef.current;
    const volName = volunteer?.name || 'Ramesh Kumar (Volunteer)';
    const volVehicle = volunteer?.vehicle || 'Electric Cargo Scooter';

    if (markersRef.current.volunteer) {
      markersRef.current.volunteer.setLatLng([telemetry.lat, telemetry.lng]);
      markersRef.current.volunteer.setIcon(
        createCustomMarker(
          '🛵',
          `${volName} • ${telemetry.speedKmh.toFixed(0)} km/h`,
          'bg-emerald-600 text-white ring-4 ring-emerald-300',
          true,
          true,
          telemetry.heading
        )
      );
    } else {
      const volMarker = L.marker([telemetry.lat, telemetry.lng], {
        icon: createCustomMarker(
          '🛵',
          `${volName} • ${telemetry.speedKmh.toFixed(0)} km/h`,
          'bg-emerald-600 text-white ring-4 ring-emerald-300',
          true,
          true,
          telemetry.heading
        ),
        zIndexOffset: 1000,
      }).addTo(map);

      volMarker.bindPopup(`
        <div class="p-1">
          <p class="font-bold text-sm text-surface-900">${volName}</p>
          <p class="text-xs text-surface-500">${volVehicle}</p>
          <div class="mt-1.5 flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
            <span>⚡ Speed: ${telemetry.speedKmh.toFixed(1)} km/h</span>
            <span>🧭 Heading: ${telemetry.heading.toFixed(0)}°</span>
          </div>
        </div>
      `);

      markersRef.current.volunteer = volMarker;
    }

    if (autoPan) {
      map.panTo([telemetry.lat, telemetry.lng], { animate: true, duration: 0.5 });
    }
  }, [telemetry, volunteer, autoPan]);

  // Broadcast & Sync Helper
  const handleLocationEmit = useCallback(
    async (lat, lng, heading, speed) => {
      if (donationId) {
        emitGpsUpdate({ donationId, lat, lng, accuracy: 4.5, heading, speed });
        try {
          await trackingApi.sendLocation({
            donationId,
            lat,
            lng,
            accuracy: 4.5,
            heading,
            speed,
          });
        } catch (e) {}
      }
      if (onLocationUpdate) {
        onLocationUpdate(lat, lng, true);
      }
    },
    [donationId, onLocationUpdate]
  );

  // Auto-Driving & Auto Timeline Advancement Loop
  useEffect(() => {
    let timer;
    if (isAutoDriving && !realGpsActive) {
      const intervalMs = Math.max(150, Math.floor(700 / simSpeed));

      timer = setInterval(() => {
        setProgressIndex((prevIdx) => {
          const waypoints = allRouteWaypoints.current;
          const totalWp = waypoints.length;
          const nextIdx = (prevIdx + 1) % totalWp;
          const currentPoint = waypoints[nextIdx];
          const nextPoint = waypoints[(nextIdx + 1) % totalWp];

          const heading = calculateHeading(
            currentPoint[0],
            currentPoint[1],
            nextPoint[0],
            nextPoint[1]
          );

          const baseSpeed = 28 + Math.sin(nextIdx * 0.4) * 6;
          const speedKmh = Number((baseSpeed * simSpeed).toFixed(1));

          setTelemetry({
            lat: currentPoint[0],
            lng: currentPoint[1],
            heading,
            speedKmh,
            accuracyMeters: 4.2,
            lastUpdated: new Date().toISOString(),
          });

          if (activeTrailRef.current) {
            const drivenPoints = waypoints.slice(0, nextIdx + 1);
            activeTrailRef.current.setLatLngs(drivenPoints);
          }

          handleLocationEmit(currentPoint[0], currentPoint[1], heading, speedKmh);

          // ─── Automatic Progress Timeline Trigger Milestones ───────────
          if (autoAdvanceTimeline && onAutoStatusChange) {
            const donorThreshold = Math.floor(totalWp * 0.48);
            const pickedUpThreshold = Math.floor(totalWp * 0.55);
            const deliveredThreshold = Math.floor(totalWp * 0.94);
            const completedThreshold = totalWp - 1;

            if (nextIdx === 0 && lastTriggeredStatusRef.current !== 'ON_THE_WAY') {
              lastTriggeredStatusRef.current = 'ON_THE_WAY';
              onAutoStatusChange('ON_THE_WAY', 'Volunteer departed base and is en route to pickup');
            } else if (nextIdx === donorThreshold && lastTriggeredStatusRef.current !== 'ARRIVED') {
              lastTriggeredStatusRef.current = 'ARRIVED';
              onAutoStatusChange('ARRIVED', 'Volunteer reached donor premises 📍');
            } else if (nextIdx === pickedUpThreshold && lastTriggeredStatusRef.current !== 'PICKED_UP') {
              lastTriggeredStatusRef.current = 'PICKED_UP';
              onAutoStatusChange('PICKED_UP', 'Food loaded & in transit to receiving shelter 🍱');
            } else if (nextIdx === deliveredThreshold && lastTriggeredStatusRef.current !== 'DELIVERED') {
              lastTriggeredStatusRef.current = 'DELIVERED';
              onAutoStatusChange('DELIVERED', 'Surplus food delivered to receiving centre 🚚');
            } else if (nextIdx === completedThreshold && lastTriggeredStatusRef.current !== 'COMPLETED') {
              lastTriggeredStatusRef.current = 'COMPLETED';
              onAutoStatusChange('COMPLETED', 'Donation delivery confirmed and complete 🎉');
            }
          }

          return nextIdx;
        });
      }, intervalMs);
    }

    return () => clearInterval(timer);
  }, [isAutoDriving, realGpsActive, simSpeed, autoAdvanceTimeline, onAutoStatusChange, handleLocationEmit]);

  // Real Device GPS Toggle
  const toggleRealGps = () => {
    if (realGpsActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setRealGpsActive(false);
      setIsAutoDriving(true);
      if (donationId) {
        emitGpsStop(donationId);
        trackingApi.stopTracking(donationId).catch(console.error);
      }
    } else {
      if (!navigator.geolocation) {
        setGpsError('Geolocation is not supported by your browser.');
        return;
      }
      setGpsError(null);
      setIsAutoDriving(false);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading, speed } = pos.coords;
          setRealGpsActive(true);
          const currentHeading = heading || 0;
          const currentSpeed = speed ? speed * 3.6 : 25;

          setTelemetry({
            lat: latitude,
            lng: longitude,
            heading: currentHeading,
            speedKmh: currentSpeed,
            accuracyMeters: accuracy || 5,
            lastUpdated: new Date().toISOString(),
          });

          handleLocationEmit(latitude, longitude, currentHeading, currentSpeed);
        },
        (err) => {
          setGpsError(`GPS Access Error: ${err.message}`);
          setRealGpsActive(false);
          setIsAutoDriving(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleResetRoute = () => {
    setProgressIndex(0);
    lastTriggeredStatusRef.current = 'ON_THE_WAY';
    if (onAutoStatusChange) {
      onAutoStatusChange('ON_THE_WAY', 'Route restarted: Volunteer on the way');
    }
    const firstPoint = allRouteWaypoints.current[0];
    setTelemetry((prev) => ({
      ...prev,
      lat: firstPoint[0],
      lng: firstPoint[1],
      heading: 45,
    }));
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && telemetry.lat && telemetry.lng) {
      mapInstanceRef.current.flyTo([telemetry.lat, telemetry.lng], 15, { animate: true });
    }
  };

  const totalWp = allRouteWaypoints.current.length;
  const isLeg1 = progressIndex < totalWp / 2;
  const currentLegTitle = isLeg1
    ? `Leg 1: En route to ${donorLocation?.name || 'Donor Pickup'}`
    : `Leg 2: In transit to ${destinationLocation?.name || 'Receiving Centre'}`;

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
      {/* Map Header Controls */}
      <div className="px-4 py-3 bg-surface-50 border-b border-surface-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 relative"></span>
          </div>
          <span className="text-sm font-bold text-surface-900">
            {realGpsActive
              ? 'Real-Time Device GPS Active'
              : isAutoDriving
              ? 'Live Vehicle Active Drive 🛵'
              : 'GPS Paused'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {currentLegTitle}
          </span>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          {/* Auto-Advance Stages Toggle */}
          <button
            onClick={() => setAutoAdvanceTimeline(!autoAdvanceTimeline)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              autoAdvanceTimeline
                ? 'bg-primary-100 text-primary-800 border-primary-300 shadow-2xs'
                : 'bg-surface-100 text-surface-600 border-surface-200 hover:bg-surface-200'
            }`}
            title="Auto-advance the progress timeline as the vehicle drives"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>Auto-Timeline: {autoAdvanceTimeline ? 'ON' : 'OFF'}</span>
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center bg-surface-200/80 p-0.5 rounded-lg text-xs font-semibold">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  simSpeed === spd ? 'bg-white text-surface-900 shadow-xs font-bold' : 'text-surface-600 hover:text-surface-900'
                }`}
                title={`Simulation Speed ${spd}x`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Follow Vehicle Toggle */}
          <button
            onClick={() => setAutoPan(!autoPan)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              autoPan ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-100'
            }`}
            title="Auto-follow vehicle on map"
          >
            <Navigation className={`w-3.5 h-3.5 ${autoPan ? 'text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Follow</span>
          </button>

          {/* Play/Pause Auto-Drive */}
          <button
            onClick={() => setIsAutoDriving(!isAutoDriving)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
              isAutoDriving
                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isAutoDriving ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoDriving ? 'Pause Live' : 'Resume Live'}
          </button>

          {/* Reset Route */}
          <button
            onClick={handleResetRoute}
            className="p-1.5 bg-surface-100 text-surface-600 hover:bg-surface-200 rounded-lg transition cursor-pointer"
            title="Restart route from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Real Device GPS */}
          <button
            onClick={toggleRealGps}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              realGpsActive
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-300'
            }`}
            title="Toggle device hardware GPS"
          >
            <Radio className={`w-3.5 h-3.5 ${realGpsActive ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{realGpsActive ? 'Device GPS' : 'My GPS'}</span>
          </button>
        </div>
      </div>

      {/* GPS Error Banner */}
      {gpsError && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[400px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Live Telemetry HUD Overlay */}
        <div className="absolute top-3 right-3 z-20 bg-surface-900/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl text-xs shadow-xl space-y-1.5 border border-white/10">
          <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold border-b border-white/10 pb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Live Vehicle Telemetry</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5 text-[11px]">
            <div>
              <span className="text-surface-400 text-[10px] block">Coordinates</span>
              <span className="font-mono text-emerald-200 font-semibold">
                {telemetry.lat.toFixed(4)}°, {telemetry.lng.toFixed(4)}°
              </span>
            </div>
            <div>
              <span className="text-surface-400 text-[10px] block">Live Speed</span>
              <span className="font-mono text-white font-bold">{telemetry.speedKmh.toFixed(1)} km/h</span>
            </div>
            <div>
              <span className="text-surface-400 text-[10px] block">Heading</span>
              <span className="font-mono text-white font-semibold">{telemetry.heading.toFixed(0)}°</span>
            </div>
            <div>
              <span className="text-surface-400 text-[10px] block">GPS Accuracy</span>
              <span className="font-mono text-surface-200">±{telemetry.accuracyMeters}m</span>
            </div>
          </div>
        </div>

        {/* Recenter Quick Button on Map */}
        <button
          onClick={handleRecenter}
          className="absolute bottom-4 right-4 z-20 bg-white text-surface-800 p-2.5 rounded-xl shadow-lg border border-surface-200 hover:bg-surface-50 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title="Center map on vehicle"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          <span>Locate Volunteer</span>
        </button>
      </div>

      {/* Map Legend */}
      <div className="p-4 bg-surface-50 border-t border-surface-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-surface-200">
          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-base shrink-0">🏢</span>
          <div>
            <div className="font-bold text-surface-900">NGO Dispatch Hub</div>
            <div className="text-[11px] text-surface-500">{ngoLocation?.name || 'FeedIndia Foundation'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-surface-200">
          <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-base shrink-0">🍱</span>
          <div>
            <div className="font-bold text-surface-900">Donor Pickup Point</div>
            <div className="text-[11px] text-surface-500">{donorLocation?.name || 'Green Kitchen Restaurant'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-surface-200">
          <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-base shrink-0">🎯</span>
          <div>
            <div className="font-bold text-surface-900">Receiving Shelter</div>
            <div className="text-[11px] text-surface-500">{destinationLocation?.name || 'Hope Community Shelter'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
