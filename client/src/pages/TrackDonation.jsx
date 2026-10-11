import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDonations } from '../context/DonationContext';
import { useAuth } from '../context/AuthContext';
import { TRACKING_STAGES, getPermittedNextActions } from '../data/trackingConstants';
import LiveTrackingMap from '../components/LiveTrackingMap';
import TrackingTimeline from '../components/TrackingTimeline';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Shield,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Calendar,
  XCircle,
  MessageSquare,
  Navigation,
} from 'lucide-react';

export default function TrackDonation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { donations, updateDonationStatus, updateVolunteerLocation } = useDonations();

  const [modalAction, setModalAction] = useState(null); // { actionObj }
  const [scheduleTime, setScheduleTime] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const donation =
    donations.find((d) => String(d.id) === String(id)) ||
    (donations.length > 0 ? donations[0] : null);

  if (!donation) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-12 text-center max-w-lg mx-auto my-12">
        <span className="text-5xl block mb-4">🔍</span>
        <h2 className="text-xl font-bold text-surface-900">No Active Donations</h2>
        <p className="text-sm text-surface-500 mt-2 mb-6">
          There are no active food donations to track right now. Claim a listing from Available Food to start live tracking.
        </p>
        <button
          onClick={() => navigate('/available-food')}
          className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-lg text-sm hover:bg-primary-700 transition"
        >
          View Available Food
        </button>
      </div>
    );
  }

  const currentStage = TRACKING_STAGES.find((s) => s.key === donation.status) || TRACKING_STAGES[0];
  const permittedActions = getPermittedNextActions(donation.status, user?.role);
  const isAuthorizedVolunteer = user?.role === 'volunteer' || user?.role === 'ngo' || user?.role === 'admin';

  // Calculate ETA based on status
  const getEtaText = () => {
    switch (donation.status) {
      case 'AVAILABLE':
        return 'Awaiting NGO pickup confirmation';
      case 'ACCEPTED':
        return 'Pickup schedule pending';
      case 'PICKUP_SCHEDULED':
        return `Scheduled for ${new Date(donation.scheduledPickupTime || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      case 'ON_THE_WAY':
        return '🛵 ~12 mins to pickup location';
      case 'ARRIVED':
        return '📍 Volunteer is at donor premises';
      case 'PICKED_UP':
        return '🍱 In transit to distribution shelter (~18 mins)';
      case 'DELIVERED':
        return '🚚 Handed over to recipient shelter';
      case 'COMPLETED':
        return '🎉 Completed & verified';
      case 'CANCELLED':
        return '❌ Pickup cancelled';
      default:
        return 'In Progress';
    }
  };

  const handleActionClick = (action) => {
    if (action.requiresTimeInput || action.requiresReason || action.targetStatus === 'ON_THE_WAY' || action.targetStatus === 'ARRIVED') {
      setModalAction(action);
      setStatusNote('');
      setScheduleTime('');
      setCancelReason('');
    } else {
      updateDonationStatus(donation.id, action.targetStatus, '', user);
    }
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalAction) return;

    if (modalAction.targetStatus === 'CANCELLED') {
      updateDonationStatus(donation.id, 'CANCELLED', cancelReason || statusNote, user);
    } else {
      updateDonationStatus(donation.id, modalAction.targetStatus, statusNote, user, {
        scheduledTime: scheduleTime || null,
      });
    }

    setModalAction(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
        <span className="text-xs text-surface-400 font-mono">
          Tracking ID: #FL-{donation.id.toString().padStart(6, '0')}
        </span>
      </div>

      {/* Hero Status Banner */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-[var(--shadow-card)] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -z-0 opacity-60" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl p-3 bg-surface-50 rounded-2xl border border-surface-100 shadow-sm">
              {donation.image || currentStage.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-surface-900">{donation.foodName}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800 border border-primary-200">
                  {currentStage.label}
                </span>
              </div>
              <p className="text-sm text-surface-500 mt-1">
                {donation.quantity} {donation.unit} • Offered by{' '}
                <strong className="text-surface-800">{donation.donorName}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
              Current Status / ETA
            </p>
            <p className="text-lg font-bold text-primary-700 mt-0.5">{getEtaText()}</p>
            <p className="text-xs text-surface-500 mt-1 flex items-center justify-end gap-1">
              <Clock className="w-3.5 h-3.5" />
              Deadline:{' '}
              {new Date(donation.scheduledPickupTime || Date.now()).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Step Progress Timeline */}
      <TrackingTimeline currentStatus={donation.status} history={donation.history} />

      {/* Main Grid: Interactive Map + Action Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map & Telemetry (2 Spans) */}
        <div className="lg:col-span-2 space-y-6">
          <LiveTrackingMap
            donationId={donation.id}
            donorLocation={{ name: donation.donorName, address: donation.donorLocation, lat: donation.donorLat, lng: donation.donorLng }}
            ngoLocation={{ name: donation.ngoName, address: donation.ngoLocation, lat: donation.ngoLat, lng: donation.ngoLng }}
            destinationLocation={{ name: donation.destinationName, address: donation.destinationAddress, lat: donation.destinationLat, lng: donation.destinationLng }}
            volunteer={donation.volunteer}
            status={donation.status}
            onLocationUpdate={(lat, lng, isLive) => updateVolunteerLocation(donation.id, lat, lng, isLive)}
            onAutoStatusChange={(targetStatus, note) => updateDonationStatus(donation.id, targetStatus, note, user)}
            isAuthorizedVolunteer={isAuthorizedVolunteer}
          />

          {/* Contact Details & Pickup Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Volunteer & NGO Card */}
            <div className="bg-white rounded-xl border border-surface-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-surface-900 text-sm">Assigned NGO & Volunteer</h3>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-xl">
                  {donation.volunteer?.avatar || '🛵'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{donation.volunteer?.name}</p>
                  <p className="text-xs text-surface-500">{donation.ngoName}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-surface-600 border-t border-surface-100 pt-3">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-surface-400" />
                  <strong>Phone:</strong> {donation.volunteer?.phone || '+91 98765 00000'}
                </p>
                <p className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-surface-400" />
                  <strong>Vehicle:</strong> {donation.volunteer?.vehicle || 'Electric Scooter'}
                </p>
              </div>
            </div>

            {/* Pickup Instructions & Food Safety Card */}
            <div className="bg-white rounded-xl border border-surface-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-surface-900 text-sm">Instructions & Safety</h3>
              </div>
              <div className="space-y-2 text-xs text-surface-600">
                <div>
                  <strong className="text-surface-800 block">Pickup Location:</strong>
                  <p className="flex items-center gap-1 text-surface-500">
                    <MapPin className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                    {donation.donorLocation}
                  </p>
                </div>
                <div>
                  <strong className="text-surface-800 block">Donor Instructions:</strong>
                  <p className="text-surface-500 bg-surface-50 p-2 rounded border border-surface-100 mt-1">
                    {donation.pickupInstructions || 'Report to front counter.'}
                  </p>
                </div>
                <div>
                  <strong className="text-surface-800 block">Safety & Handling:</strong>
                  <p className="text-surface-500">{donation.foodSafety || 'Follow standard food handling rules.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Role Action Panel & Audit Logs (1 Span) */}
        <div className="space-y-6">
          {/* Status Update Action Controls */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-5">
            <h3 className="font-semibold text-surface-900 text-sm mb-4 flex items-center justify-between">
              <span>⚡ Status Update Actions</span>
              <span className="text-[11px] font-medium text-surface-400 uppercase">
                Role: {user?.role?.toUpperCase()}
              </span>
            </h3>

            {permittedActions.length === 0 ? (
              <div className="space-y-3">
                <div className="bg-surface-50 rounded-lg p-4 text-center text-xs text-surface-500 font-medium border border-surface-200">
                  {donation.status === 'COMPLETED'
                    ? '🎉 Donation workflow completed!'
                    : donation.status === 'CANCELLED'
                    ? '❌ Donation cancelled.'
                    : 'No updates permitted for your role at this stage.'}
                </div>
                <button
                  onClick={() => updateDonationStatus(donation.id, 'ACCEPTED', 'Restarted workflow for demo testing', user)}
                  className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  🔄 Restart Workflow (Demo Testing)
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {permittedActions.map((act) => (
                  <button
                    key={act.targetStatus}
                    onClick={() => handleActionClick(act)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                      act.variant === 'primary'
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                        : act.variant === 'warning'
                        ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                        : act.variant === 'purple'
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                        : act.variant === 'teal'
                        ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                        : act.variant === 'cyan'
                        ? 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm'
                        : act.variant === 'success'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        : act.variant === 'danger'
                        ? 'bg-white border border-danger-300 text-danger-600 hover:bg-danger-50'
                        : 'bg-surface-100 text-surface-800 hover:bg-surface-200'
                    }`}
                  >
                    <span>{act.icon}</span>
                    <span>{act.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Demo Status Selector */}
            <div className="mt-4 pt-4 border-t border-surface-100">
              <label className="block text-[11px] font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                ⚡ Demo Quick Status Jump
              </label>
              <select
                value={donation.status}
                onChange={(e) => updateDonationStatus(donation.id, e.target.value, `Jumped to ${e.target.value} for testing`, user)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-surface-200 bg-surface-50 font-medium text-surface-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {TRACKING_STAGES.map((st) => (
                  <option key={st.key} value={st.key}>
                    {st.icon} {st.stepIndex >= 0 ? `Stage ${st.stepIndex + 1}: ` : ''}{st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-5">
            <h3 className="font-semibold text-surface-900 text-sm mb-4">
              📋 Status Audit History
            </h3>
            <div className="space-y-4 max-h-80 overflow-y-auto divide-y divide-surface-100">
              {donation.history?.map((h) => (
                <div key={h.id} className="pt-3 first:pt-0">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-surface-900">
                      {h.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-surface-400">
                      {new Date(h.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{h.updatedByName}</p>
                  {h.note && (
                    <p className="text-xs bg-surface-50 p-2 rounded text-surface-600 mt-1">
                      "{h.note}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog for schedule time / status notes / cancellation */}
      {modalAction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                <span>{modalAction.icon}</span>
                <span>{modalAction.label}</span>
              </h3>
              <button
                onClick={() => setModalAction(null)}
                className="text-surface-400 hover:text-surface-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {modalAction.requiresTimeInput && (
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Scheduled Pickup Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {modalAction.requiresReason ? (
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Cancellation Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a reason for cancelling this pickup..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-danger-500 resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Status Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add an optional note (e.g. vehicle details, traffic updates)..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="px-4 py-2 rounded-lg border border-surface-300 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg font-semibold text-sm text-white transition cursor-pointer ${
                    modalAction.targetStatus === 'CANCELLED'
                      ? 'bg-danger-600 hover:bg-danger-700'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  Confirm Status Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
