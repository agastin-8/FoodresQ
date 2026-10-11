import { DEMO_FOOD_LISTINGS, DEMO_NGOS, getSmartMatches, suggestCombinedPickups } from '../data/demoData';
import { BrainCircuit, MapPin, Zap, Truck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SmartMatch() {
  const matches = getSmartMatches(DEMO_FOOD_LISTINGS, DEMO_NGOS);
  const combinedPickups = suggestCombinedPickups(DEMO_FOOD_LISTINGS);

  const urgencyStyle = {
    high: 'bg-danger-100 text-danger-500 border-danger-500',
    medium: 'bg-warning-100 text-warning-500 border-warning-500',
    low: 'bg-primary-50 text-primary-600 border-primary-500',
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Smart Matching</h1>
            <p className="text-surface-500">Rule-based food-to-NGO matching with transparent reasoning</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-5 mb-8">
        <h3 className="font-semibold text-surface-900 mb-3">How Smart Matching Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-800">Location</p>
              <p className="text-xs text-surface-500">Matches NGOs within their coverage area using distance calculation</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-800">Capacity & Urgency</p>
              <p className="text-xs text-surface-500">Prioritizes NGOs with available capacity and urgent deadlines</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-800">Combined Pickups</p>
              <p className="text-xs text-surface-500">Groups nearby donations for efficient single-trip collection</p>
            </div>
          </div>
        </div>
        <div className="mt-3 px-3 py-2 bg-surface-50 rounded-lg">
          <p className="text-xs text-surface-500">
            <strong>Note:</strong> This uses rule-based scoring (distance + capacity + urgency), not machine learning. Each recommendation explains why it was suggested.
          </p>
        </div>
      </div>

      {/* Combined pickup suggestions */}
      {combinedPickups.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-600" />
              Combined Pickup Suggestions
            </h2>
            <Link
              to="/collection-trip"
              className="text-xs font-semibold px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition border border-primary-200"
            >
              View Multi-Stop Collection Trip 🚚 ➔
            </Link>
          </div>
          <div className="space-y-3">
            {combinedPickups.map((group, i) => (
              <div key={i} className="bg-white rounded-xl border border-primary-200 shadow-[var(--shadow-card)] p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                    {group.items.length}x
                  </div>
                  <div>
                    <p className="font-medium text-surface-800">{group.reason}</p>
                    <p className="text-sm text-surface-500 mt-1">Area: {group.area}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {group.items.map((item) => (
                        <span key={item.id} className="text-xs bg-surface-100 text-surface-600 px-2.5 py-1 rounded-md">
                          {item.image} {item.foodName} ({item.quantity} {item.unit})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match results */}
      <h2 className="text-lg font-semibold text-surface-900 mb-4">
        🧠 Recommended Matches ({matches.length})
      </h2>

      {matches.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
          <AlertCircle className="w-10 h-10 text-surface-300 mx-auto mb-2" />
          <p className="text-surface-600 font-medium">No matches available</p>
          <p className="text-sm text-surface-400 mt-1">Matches will appear when there are available listings and NGOs in range</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl border shadow-[var(--shadow-card)] p-5 ${
                match.urgency === 'high' ? 'border-danger-500/30' : 'border-surface-200'
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                {/* Food info */}
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{match.listing.image}</span>
                  <div>
                    <h3 className="font-semibold text-surface-900">{match.listing.foodName}</h3>
                    <p className="text-sm text-surface-500">{match.listing.donorName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-medium">
                        {match.listing.quantity} {match.listing.unit}
                      </span>
                      <span className="text-xs text-surface-400">{match.listing.location}</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">{match.score}%</div>
                  <p className="text-xs text-surface-400">match score</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${urgencyStyle[match.urgency]}`}>
                    {match.urgency === 'high' ? '🔴 Urgent' : match.urgency === 'medium' ? '🟡 Soon' : '🟢 Flexible'}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-surface-200" />
                <span className="text-surface-400 text-sm font-medium">→ best matched with →</span>
                <div className="flex-1 h-px bg-surface-200" />
              </div>

              {/* NGO info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {match.ngo.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-surface-800">{match.ngo.name}</p>
                  <p className="text-sm text-surface-500">
                    {match.distance} km away · Capacity: {match.ngo.capacity - match.ngo.currentLoad} meals available
                  </p>
                </div>
              </div>

              {/* Reasons */}
              <div className="mt-4 p-3 bg-surface-50 rounded-lg">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Why this match</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.reasons.map((r, j) => (
                    <span key={j} className="text-xs text-surface-600 bg-white border border-surface-200 px-2.5 py-1 rounded-md">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
