import { useState, useEffect, useRef } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  PackageCheck,
  Building2,
  ShieldCheck,
  ArrowRight,
  Play,
  Pause,
  Zap,
  Sparkles,
  Check,
} from 'lucide-react';
import MultiStopLeafletMap from '../components/MultiStopLeafletMap';

const INITIAL_STOPS = [
  {
    id: 1,
    name: 'ABC Bakery',
    type: 'Bakery',
    food: '10 bread packets',
    quantity: 10,
    unit: 'packets',
    readyTime: '1:00 PM',
    location: 'HSR Layout Sector 1, Bangalore',
    lat: 12.9116,
    lng: 77.6389,
    status: 'Pending', // Pending | Arrived | Picked Up
    image: '🍞',
  },
  {
    id: 2,
    name: 'Green Hostel Mess',
    type: 'Hostel Mess',
    food: '15 meal boxes',
    quantity: 15,
    unit: 'boxes',
    readyTime: '1:10 PM',
    location: 'HSR Layout Sector 3, Bangalore',
    lat: 12.9150,
    lng: 77.6420,
    status: 'Pending',
    image: '🍱',
  },
  {
    id: 3,
    name: 'Fresh Restaurant',
    type: 'Restaurant',
    food: '8 meal boxes',
    quantity: 8,
    unit: 'boxes',
    readyTime: '1:15 PM',
    location: 'HSR Layout Sector 5, Bangalore',
    lat: 12.9180,
    lng: 77.6460,
    status: 'Pending',
    image: '🍛',
  },
];

const RECEIVING_CENTRE = {
  name: 'Hope Community Receiving Centre',
  address: 'Indiranagar 100ft Road, Bangalore',
  lat: 12.9250,
  lng: 77.6500,
};

// Intermediate interpolation between points
function interpolatePoint(p1, p2, ratio) {
  return [
    p1[0] + (p2[0] - p1[0]) * ratio,
    p1[1] + (p2[1] - p1[1]) * ratio,
  ];
}

export default function SampleCollectionTrip() {
  const [stops, setStops] = useState(INITIAL_STOPS);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'map'
  
  // Auto-drive simulation states
  const [isAutoSimulating, setIsAutoSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 4x
  const [simStep, setSimStep] = useState(0); // 0 to 100 sub-steps
  const [activeStageLabel, setActiveStageLabel] = useState('Starting Trip from Dispatch Hub 🚚');
  const [vehiclePos, setVehiclePos] = useState([12.9090, 77.6350]);

  // Coordinates array: [StartHub, Stop1, Stop2, Stop3, ReceivingCentre]
  const routePoints = [
    [12.9090, 77.6350], // Start Hub
    [12.9116, 77.6389], // Stop 1: ABC Bakery
    [12.9150, 77.6420], // Stop 2: Green Hostel
    [12.9180, 77.6460], // Stop 3: Fresh Restaurant
    [12.9250, 77.6500], // Receiving Centre
  ];

  // Dynamic summary statistics
  const totalSurplusFood = stops.reduce((sum, stop) => sum + stop.quantity, 0);
  const totalTrips = 1;
  const pickedUpCount = stops.filter((s) => s.status === 'Picked Up').length;
  const allPickedUp = pickedUpCount === stops.length;
  const progressPercent = deliveryConfirmed ? 100 : Math.round((pickedUpCount / stops.length) * 85);

  // ─── Automatic Simulation Loop ───────────────────────────────────────
  useEffect(() => {
    let timer;
    if (isAutoSimulating) {
      const stepDuration = Math.max(100, Math.floor(600 / simSpeed));

      timer = setInterval(() => {
        setSimStep((prev) => {
          const next = prev + 1;
          const totalSteps = 80; // Total simulation cycle steps

          // ── Segment 1: Hub -> Stop 1 (0 to 15) ──
          if (next >= 0 && next < 8) {
            const ratio = next / 8;
            setVehiclePos(interpolatePoint(routePoints[0], routePoints[1], ratio));
            setActiveStageLabel('🛵 On the way to Stop 1: ABC Bakery');
          } else if (next >= 8 && next < 14) {
            setVehiclePos(routePoints[1]);
            setStops((curr) =>
              curr.map((s, idx) => (idx === 0 ? { ...s, status: 'Arrived' } : s))
            );
            setActiveStageLabel('📍 Arrived at Stop 1: ABC Bakery');
          } else if (next >= 14 && next < 25) {
            setStops((curr) =>
              curr.map((s, idx) => (idx === 0 ? { ...s, status: 'Picked Up' } : s))
            );
            // ── Segment 2: Stop 1 -> Stop 2 (15 to 35) ──
            const ratio = (next - 14) / 11;
            setVehiclePos(interpolatePoint(routePoints[1], routePoints[2], Math.min(ratio, 1)));
            setActiveStageLabel('🍞 Picked up 10 pkts • En route to Stop 2: Green Hostel');
          } else if (next >= 25 && next < 32) {
            setVehiclePos(routePoints[2]);
            setStops((curr) =>
              curr.map((s, idx) => (idx === 1 ? { ...s, status: 'Arrived' } : s))
            );
            setActiveStageLabel('📍 Arrived at Stop 2: Green Hostel Mess');
          } else if (next >= 32 && next < 45) {
            setStops((curr) =>
              curr.map((s, idx) => (idx === 1 ? { ...s, status: 'Picked Up' } : s))
            );
            // ── Segment 3: Stop 2 -> Stop 3 (35 to 55) ──
            const ratio = (next - 32) / 13;
            setVehiclePos(interpolatePoint(routePoints[2], routePoints[3], Math.min(ratio, 1)));
            setActiveStageLabel('🍱 Picked up 15 boxes • En route to Stop 3: Fresh Restaurant');
          } else if (next >= 45 && next < 52) {
            setVehiclePos(routePoints[3]);
            setStops((curr) =>
              curr.map((s, idx) => (idx === 2 ? { ...s, status: 'Arrived' } : s))
            );
            setActiveStageLabel('📍 Arrived at Stop 3: Fresh Restaurant');
          } else if (next >= 52 && next < 68) {
            setStops((curr) =>
              curr.map((s, idx) => (idx === 2 ? { ...s, status: 'Picked Up' } : s))
            );
            // ── Segment 4: Stop 3 -> Receiving Centre (55 to 75) ──
            const ratio = (next - 52) / 16;
            setVehiclePos(interpolatePoint(routePoints[3], routePoints[4], Math.min(ratio, 1)));
            setActiveStageLabel('🚚 All food collected (33 units) • En route to Receiving Centre');
          } else if (next >= 68 && next <= 78) {
            setVehiclePos(routePoints[4]);
            setDeliveryConfirmed(true);
            setActiveStageLabel('🎉 Handover Confirmed at Hope Receiving Centre!');
          } else if (next > 78) {
            // Loop restart smoothly after a pause
            return 0;
          }

          return next;
        });
      }, stepDuration);
    }

    return () => clearInterval(timer);
  }, [isAutoSimulating, simSpeed]);

  const handleUpdateStopStatus = (id, newStatus) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const handleReset = () => {
    setStops(INITIAL_STOPS);
    setDeliveryConfirmed(false);
    setSimStep(0);
    setVehiclePos(routePoints[0]);
    setActiveStageLabel('Starting Trip from Dispatch Hub 🚚');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-surface-900">Sample Collection Trip</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700 border border-primary-200">
              ⚡ Automatic Multi-Stop Route
            </span>
          </div>
          <p className="text-surface-500 mt-1">
            Group nearby food contributors into one efficient collection trip with real-time automatic progression
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <div className="flex items-center bg-surface-200 p-0.5 rounded-xl text-xs font-semibold">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  simSpeed === spd
                    ? 'bg-white text-surface-900 shadow-xs font-bold'
                    : 'text-surface-600 hover:text-surface-900'
                }`}
                title={`Simulation Speed ${spd}x`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Auto-Simulate Toggle */}
          <button
            onClick={() => setIsAutoSimulating(!isAutoSimulating)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isAutoSimulating
                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isAutoSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoSimulating ? 'Pause Auto-Run' : 'Resume Auto-Run'}</span>
          </button>

          {/* Reset Trip Button */}
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="Reset trip route to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Dynamic summary statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Total Surplus Food</p>
            <p className="text-3xl font-extrabold text-primary-600 mt-1">{totalSurplusFood} Units</p>
            <p className="text-xs text-surface-500 mt-1">10 + 15 + 8 food items automatically collected</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 text-2xl font-bold">
            🍱
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Live Trip Status</p>
            <p className="text-sm font-bold text-surface-900 mt-1 truncate max-w-[200px]">{activeStageLabel}</p>
            <p className="text-xs text-surface-500 mt-1">3 contributors bundled into 1 route</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-bold">
            🚚
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-[var(--shadow-card)] sm:col-span-2 lg:col-span-1 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Trip Completion</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{progressPercent}%</p>
            <p className="text-xs text-surface-500 mt-1">
              {pickedUpCount} of 3 pickups collected • {deliveryConfirmed ? 'Delivered 🎉' : 'In Progress'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Auto Progress Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-emerald-600 rounded-xl p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-xl animate-bounce">
            🚚
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Automatic Route Telemetry
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">{activeStageLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-primary-200 block">Progress</span>
            <span className="text-sm font-extrabold text-white">{progressPercent}%</span>
          </div>
          <div className="w-28 bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Map Visualizer / Multi-Stop Route Canvas */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 bg-surface-50 border-b border-surface-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-semibold text-surface-900">Multi-Stop Route Visualizer</span>
            <span className="text-xs text-surface-500 font-medium">Single Trip • 3 Pickups ➔ 1 Receiving Centre</span>
          </div>

          <div className="flex items-center gap-1 bg-surface-200/70 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('diagram')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'diagram' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              ⚡ Flow Diagram
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'map' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              🗺️ Leaflet Map
            </button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <MultiStopLeafletMap
            stops={stops}
            receivingCentre={RECEIVING_CENTRE}
            deliveryConfirmed={deliveryConfirmed}
            vehiclePosition={vehiclePos}
          />
        ) : (
          /* Enhanced Flow Diagram Visualizer */
          <div className="relative w-full h-[240px] bg-[#f8fafc] overflow-hidden select-none flex items-center justify-center p-4">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            />

            {/* Connecting Route Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="tripLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="40%" stopColor="#10b981" />
                  <stop offset="80%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              <path
                d="M 120 120 L 300 120 L 480 120 L 680 120"
                fill="none"
                stroke="url(#tripLineGrad)"
                strokeWidth="5"
                strokeDasharray="8 6"
              />
            </svg>

            {/* Stop 1: ABC Bakery */}
            <div className="absolute left-[15%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold mb-1.5 shadow transition-all ${
                  stops[0].status === 'Picked Up'
                    ? 'bg-emerald-700 text-white'
                    : stops[0].status === 'Arrived'
                    ? 'bg-amber-600 text-white animate-pulse'
                    : 'bg-surface-900 text-white'
                }`}
              >
                Stop 1: ABC Bakery
              </span>

              <div
                className={`w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xl transition-all duration-300 ${
                  stops[0].status === 'Picked Up'
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 scale-105'
                    : stops[0].status === 'Arrived'
                    ? 'bg-amber-500 text-white ring-4 ring-amber-300 animate-pulse scale-110'
                    : 'bg-surface-200 text-surface-600'
                }`}
              >
                {stops[0].status === 'Picked Up' ? <Check className="w-6 h-6 text-white stroke-[3]" /> : '🍞'}
              </div>

              <span className="text-[10px] font-bold text-surface-700 mt-1.5 whitespace-nowrap">
                {stops[0].status === 'Picked Up' ? '✅ 10 pkts collected' : '10 pkts • 1:00 PM'}
              </span>
            </div>

            {/* Stop 2: Green Hostel Mess */}
            <div className="absolute left-[38%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold mb-1.5 shadow transition-all ${
                  stops[1].status === 'Picked Up'
                    ? 'bg-emerald-700 text-white'
                    : stops[1].status === 'Arrived'
                    ? 'bg-amber-600 text-white animate-pulse'
                    : 'bg-surface-900 text-white'
                }`}
              >
                Stop 2: Green Hostel
              </span>

              <div
                className={`w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xl transition-all duration-300 ${
                  stops[1].status === 'Picked Up'
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 scale-105'
                    : stops[1].status === 'Arrived'
                    ? 'bg-amber-500 text-white ring-4 ring-amber-300 animate-pulse scale-110'
                    : 'bg-surface-200 text-surface-600'
                }`}
              >
                {stops[1].status === 'Picked Up' ? <Check className="w-6 h-6 text-white stroke-[3]" /> : '🍱'}
              </div>

              <span className="text-[10px] font-bold text-surface-700 mt-1.5 whitespace-nowrap">
                {stops[1].status === 'Picked Up' ? '✅ 15 boxes collected' : '15 boxes • 1:10 PM'}
              </span>
            </div>

            {/* Stop 3: Fresh Restaurant */}
            <div className="absolute left-[62%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold mb-1.5 shadow transition-all ${
                  stops[2].status === 'Picked Up'
                    ? 'bg-emerald-700 text-white'
                    : stops[2].status === 'Arrived'
                    ? 'bg-amber-600 text-white animate-pulse'
                    : 'bg-surface-900 text-white'
                }`}
              >
                Stop 3: Fresh Rest.
              </span>

              <div
                className={`w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xl transition-all duration-300 ${
                  stops[2].status === 'Picked Up'
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 scale-105'
                    : stops[2].status === 'Arrived'
                    ? 'bg-amber-500 text-white ring-4 ring-amber-300 animate-pulse scale-110'
                    : 'bg-surface-200 text-surface-600'
                }`}
              >
                {stops[2].status === 'Picked Up' ? <Check className="w-6 h-6 text-white stroke-[3]" /> : '🍛'}
              </div>

              <span className="text-[10px] font-bold text-surface-700 mt-1.5 whitespace-nowrap">
                {stops[2].status === 'Picked Up' ? '✅ 8 boxes collected' : '8 boxes • 1:15 PM'}
              </span>
            </div>

            {/* Final Stop: Receiving Centre */}
            <div className="absolute left-[86%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold mb-1.5 shadow transition-all ${
                  deliveryConfirmed ? 'bg-emerald-700 text-white' : 'bg-purple-800 text-white'
                }`}
              >
                Final: Receiving Centre
              </span>

              <div
                className={`w-14 h-14 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                  deliveryConfirmed
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 scale-110'
                    : allPickedUp
                    ? 'bg-amber-500 text-white ring-4 ring-amber-300 animate-bounce'
                    : 'bg-purple-700 text-white ring-2 ring-purple-300'
                }`}
              >
                {deliveryConfirmed ? '🎉' : '🏠'}
              </div>

              <span className="text-[10px] font-bold text-surface-700 mt-1.5 whitespace-nowrap">
                {deliveryConfirmed ? '✅ Delivered (33 units)' : 'Hope Centre • 1:30 PM'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Food Contributors (3 Cards Required) */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-surface-900">
          📦 Sample Contributors (3 Locations)
        </h2>
        <span className="text-xs text-surface-500 font-semibold">
          ⚡ Status updates automatically in real-time
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stops.map((stop, idx) => {
          const isCurrentTarget =
            (idx === 0 && stop.status !== 'Picked Up') ||
            (idx === 1 && stops[0].status === 'Picked Up' && stop.status !== 'Picked Up') ||
            (idx === 2 && stops[1].status === 'Picked Up' && stop.status !== 'Picked Up');

          return (
            <div
              key={stop.id}
              className={`bg-white rounded-xl border p-5 shadow-[var(--shadow-card)] flex flex-col justify-between transition-all ${
                stop.status === 'Picked Up'
                  ? 'border-emerald-300 bg-emerald-50/25 ring-2 ring-emerald-100'
                  : stop.status === 'Arrived'
                  ? 'border-amber-300 bg-amber-50/30 ring-2 ring-amber-100'
                  : isCurrentTarget
                  ? 'border-primary-300 bg-primary-50/15'
                  : 'border-surface-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-surface-50 rounded-xl border border-surface-100">
                      {stop.image}
                    </span>
                    <div>
                      <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">
                        Stop {idx + 1} • {stop.type}
                      </span>
                      <h3 className="font-bold text-surface-900 text-base">{stop.name}</h3>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
                      stop.status === 'Picked Up'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : stop.status === 'Arrived'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        : 'bg-surface-100 text-surface-600 border border-surface-200'
                    }`}
                  >
                    {stop.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-surface-600">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-50 border border-surface-100">
                    <span className="font-semibold text-surface-700">Surplus Food:</span>
                    <span className="font-bold text-primary-700 bg-white px-2 py-0.5 rounded border border-surface-200">
                      {stop.food}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-surface-500">
                    <Clock className="w-3.5 h-3.5 text-primary-600" />
                    <span>
                      Pickup-ready time:{' '}
                      <strong className="text-surface-900 font-semibold">{stop.readyTime}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-surface-500">
                    <MapPin className="w-3.5 h-3.5 text-surface-400" />
                    <span>{stop.location}</span>
                  </div>
                </div>
              </div>

              {/* Status Action / Auto Indicator */}
              <div className="mt-5 pt-3 border-t border-surface-100">
                {stop.status === 'Pending' && (
                  <button
                    onClick={() => handleUpdateStopStatus(stop.id, 'Arrived')}
                    className="w-full py-2.5 rounded-lg bg-surface-100 hover:bg-amber-500 hover:text-white text-surface-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" /> <span>Mark Vehicle Arrived 📍</span>
                  </button>
                )}

                {stop.status === 'Arrived' && (
                  <button
                    onClick={() => handleUpdateStopStatus(stop.id, 'Picked Up')}
                    className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-emerald-600 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs animate-pulse"
                  >
                    <PackageCheck className="w-3.5 h-3.5" /> <span>Confirm Food Picked Up 🍱</span>
                  </button>
                )}

                {stop.status === 'Picked Up' && (
                  <div className="w-full py-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Food Picked Up ({stop.quantity} {stop.unit})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Receiving Centre Final Destination Card */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl font-bold">
              🏠
            </div>
            <div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                Final Destination
              </span>
              <h3 className="text-xl font-bold text-surface-900">Hope Community Receiving Centre</h3>
              <p className="text-xs text-surface-500 mt-0.5">
                Indiranagar, Bangalore • Expected Handover: 1:30 PM
              </p>
            </div>
          </div>

          <div>
            {!allPickedUp ? (
              <div className="px-4 py-2 bg-surface-100 text-surface-500 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>Auto-collecting pickups along route ({pickedUpCount}/3 complete)...</span>
              </div>
            ) : deliveryConfirmed ? (
              <div className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Handover Confirmed & Delivered! 🎉
              </div>
            ) : (
              <button
                onClick={() => setDeliveryConfirmed(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg transition cursor-pointer flex items-center gap-2 animate-bounce"
              >
                <PackageCheck className="w-4 h-4" /> Confirm Delivery to Receiving Centre 🎉
              </button>
            )}
          </div>
        </div>

        {deliveryConfirmed && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-sm font-bold block">Collection Trip Automatically Completed!</strong>
              <p className="mt-0.5">
                All 33 surplus food units (10 bread packets from ABC Bakery, 15 meal boxes from Green Hostel Mess, and 8 meal boxes from Fresh Restaurant) have been automatically collected in 1 single trip and handed over to Hope Community Receiving Centre.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
