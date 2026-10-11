import {
  UtensilsCrossed,
  HandHeart,
  Truck,
  CheckCircle2,
  Leaf,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import {
  calculateStats,
  getSmartMatches,
  DEMO_NGOS,
} from '../data/demoData';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  const colorMap = {
    green: 'bg-primary-50 text-primary-600',
    blue: 'bg-info-100 text-info-500',
    amber: 'bg-warning-100 text-warning-500',
    red: 'bg-danger-100 text-danger-500',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{value ?? 0}</p>
          {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.green}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 text-xs text-primary-600 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          {trend}
        </div>
      )}
    </div>
  );
}

function RecentActivity({ donations = [] }) {
  const statusStyle = {
    AVAILABLE: 'bg-primary-50 text-primary-700 border border-primary-200',
    ACCEPTED: 'bg-blue-50 text-blue-700 border border-blue-200',
    PICKUP_SCHEDULED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    ON_THE_WAY: 'bg-amber-50 text-amber-700 border border-amber-200',
    ARRIVED: 'bg-purple-50 text-purple-700 border border-purple-200',
    PICKED_UP: 'bg-teal-50 text-teal-700 border border-teal-200',
    DELIVERED: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-200',
    pending: 'bg-warning-100 text-warning-500',
    accepted: 'bg-info-100 text-info-500',
    picked_up: 'bg-primary-50 text-primary-600',
    declined: 'bg-danger-100 text-danger-500',
  };

  const safeDonations = Array.isArray(donations) ? donations : [];

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between p-5 border-b border-surface-100">
        <h3 className="font-semibold text-surface-900">Recent Activity</h3>
        <Link
          to="/donations"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="divide-y divide-surface-100">
        {safeDonations.length === 0 ? (
          <div className="p-8 text-center">
            <HandHeart className="w-10 h-10 text-surface-300 mx-auto mb-2" />
            <p className="text-sm text-surface-400">No donation activity yet</p>
          </div>
        ) : (
          safeDonations.slice(0, 4).map((d) => (
            <Link
              key={d.id}
              to={`/track/${d.id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 transition-colors"
            >
              <span className="text-2xl p-1.5 bg-surface-50 rounded-lg border border-surface-100">{d.image || '🍱'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 truncate hover:text-primary-600">
                  {d.foodName}
                </p>
                <p className="text-xs text-surface-400">
                  {d.quantity} {d.unit} — {d.ngoName || 'NGO Partner'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusStyle[d.status] || 'bg-primary-50 text-primary-700'}`}>
                  {String(d.status || 'Active').replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-primary-600 font-medium">Track 🛰️</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function TopMatches({ matches = [] }) {
  const safeMatches = Array.isArray(matches) ? matches : [];

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between p-5 border-b border-surface-100">
        <h3 className="font-semibold text-surface-900">🧠 Recommended Matches</h3>
        <Link
          to="/smart-match"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {safeMatches.length === 0 ? (
        <div className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-surface-300 mx-auto mb-2" />
          <p className="text-sm text-surface-400">No matches available right now</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-100">
          {safeMatches.slice(0, 3).map((m, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-800">
                    {m.listing?.image || '🍱'} {m.listing?.foodName}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {m.listing?.donorName} → {m.ngo?.name}
                  </p>
                </div>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
                  {m.score}% match
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.reasons?.map((r, j) => (
                  <span
                    key={j}
                    className="text-[11px] text-surface-500 bg-surface-50 border border-surface-200 px-2 py-0.5 rounded"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { listings = [], donations = [] } = useDonations();
  const safeListings = Array.isArray(listings) ? listings : [];
  const safeDonations = Array.isArray(donations) ? donations : [];
  const stats = calculateStats(safeListings, safeDonations);
  const matches = getSmartMatches(safeListings, DEMO_NGOS);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Partner';

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            {greeting()}, {displayName} 👋
          </h1>
          <p className="text-surface-500 mt-1">
            Here's what's happening on FoodLink AI today.
          </p>
        </div>
        <Link
          to="/track/1"
          className="px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition shadow-md flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          Live Tracking Portal 🛰️
        </Link>
      </div>

      {/* Demo data banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-primary-800">Demonstration Mode</p>
          <p className="text-xs text-primary-600 mt-0.5">
            Real-time GPS Tracking and PostgreSQL backend are connected and operating live.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={UtensilsCrossed}
          label="Available Listings"
          value={stats.availableListings}
          sub={`${stats.totalListings} total`}
          color="green"
          trend="+3 today"
        />
        <StatCard
          icon={Clock}
          label="Pending Pickups"
          value={stats.pendingDonations}
          sub="Awaiting confirmation"
          color="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completedDonations}
          sub={`${stats.totalMealsRedirected} meals redirected`}
          color="blue"
        />
        <StatCard
          icon={Leaf}
          label="Waste Reduced"
          value={`${stats.estimatedWasteReduced} kg`}
          sub="Estimated food saved"
          color="green"
          trend="Growing impact!"
        />
      </div>

      {/* Active listings (quick view) */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] mb-8">
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">🍽️ Active Food Listings</h3>
          <Link
            to={user?.role === 'donor' ? '/my-listings' : '/available-food'}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {safeListings
            .filter((l) => l.status === 'available')
            .slice(0, 3)
            .map((listing) => {
              const deadline = listing.pickupDeadline ? new Date(listing.pickupDeadline) : new Date();
              return (
                <div
                  key={listing.id}
                  className="rounded-xl border border-surface-200 p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl p-1.5 bg-surface-50 rounded-lg border border-surface-100">{listing.image || '🍱'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-surface-900 truncate">{listing.foodName}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{listing.donorName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-medium">
                          {listing.quantity} {listing.unit}
                        </span>
                        <span className="text-xs text-surface-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {deadline.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom section: activity + matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity donations={safeDonations} />
        <TopMatches matches={matches} />
      </div>
    </div>
  );
}
