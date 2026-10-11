import { useState } from 'react';
import { useDonations } from '../context/DonationContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Radio, ArrowRight, Clock, MapPin } from 'lucide-react';
import { TRACKING_STAGES } from '../data/trackingConstants';

export default function Donations() {
  const { user } = useAuth();
  const { donations, updateDonationStatus } = useDonations();
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = donations.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            {user?.role === 'ngo' ? 'My Pickups & Handovers' : 'Donation Workflows'}
          </h1>
          <p className="text-surface-500 mt-1">Live Zomato-style tracking and pickup management</p>
        </div>
        <Link
          to="/track/1"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-sm"
        >
          <Radio className="w-4 h-4 animate-pulse" /> Live Tracking Portal 🛰️
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'ACCEPTED', 'ON_THE_WAY', 'PICKED_UP', 'DELIVERED', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
            }`}
          >
            {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
          <span className="text-5xl block mb-3">📦</span>
          <p className="text-surface-600 font-medium">No donation pickups found</p>
          <p className="text-sm text-surface-400 mt-1">
            {statusFilter !== 'all' ? 'Try adjusting status filters' : 'Donation requests will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((donation) => {
            const stage = TRACKING_STAGES.find((st) => st.key === donation.status) || TRACKING_STAGES[0];

            return (
              <div
                key={donation.id}
                className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-5 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl p-2 bg-surface-50 rounded-xl border border-surface-100">
                    {donation.image || '🍱'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-surface-900 text-base">{donation.foodName}</h3>
                        <p className="text-sm text-surface-500 mt-0.5">
                          {donation.donorName} → <strong className="text-surface-800">{donation.ngoName}</strong>
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
                        {stage.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-surface-500">
                      <span>
                        <strong className="text-surface-800 font-semibold">{donation.quantity}</strong> {donation.unit}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary-600" /> {donation.donorLocation}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-surface-400" />
                        Scheduled: {new Date(donation.scheduledPickupTime || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-surface-100">
                      <Link
                        to={`/track/${donation.id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Radio className="w-3.5 h-3.5" /> Track Live 🛰️
                      </Link>

                      {donation.status === 'ACCEPTED' && user?.role === 'ngo' && (
                        <button
                          onClick={() => updateDonationStatus(donation.id, 'ON_THE_WAY', 'Started journey', user)}
                          className="px-3.5 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition cursor-pointer"
                        >
                          Start Journey 🛵
                        </button>
                      )}

                      {donation.status === 'ON_THE_WAY' && user?.role === 'ngo' && (
                        <button
                          onClick={() => updateDonationStatus(donation.id, 'ARRIVED', 'Arrived at donor site', user)}
                          className="px-3.5 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition cursor-pointer"
                        >
                          Mark Arrived 📍
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
