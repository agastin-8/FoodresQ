import { useState } from 'react';
import { Search, Filter, Clock, MapPin, Shield, Radio } from 'lucide-react';
import { DEMO_FOOD_LISTINGS } from '../data/demoData';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { useNavigate } from 'react-router-dom';

export default function AvailableFood() {
  const { user } = useAuth();
  const { listings, createDonationFromListing } = useDonations();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [claimedIds, setClaimedIds] = useState(new Set());

  const categories = ['all', ...new Set(listings.map((l) => l.category).filter(Boolean))];

  const filtered = listings.filter((l) => {
    if (l.status !== 'available') return false;
    if (search && !l.foodName.toLowerCase().includes(search.toLowerCase()) && !l.donorName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    return true;
  });

  const handleClaim = async (listing) => {
    setClaimedIds((prev) => new Set(prev).add(listing.id));
    try {
      const newDonation = await createDonationFromListing(
        listing,
        user || { id: 2, name: 'FeedIndia Foundation', location: 'Indiranagar, Bangalore' }
      );
      navigate(`/track/${newDonation?.id || 1}`);
    } catch (err) {
      console.error('Claim donation error:', err);
      navigate('/donations');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Available Surplus Food</h1>
          <p className="text-surface-500 mt-1">Browse nearby excess food and claim for instant Zomato-style tracking</p>
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food or donor..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-surface-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-surface-400 mb-4">{filtered.length} listing{filtered.length !== 1 && 's'} available</p>

      {/* Listings grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
          <span className="text-5xl block mb-3">🔍</span>
          <p className="text-surface-500 font-medium">No food listings match your search</p>
          <p className="text-sm text-surface-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((listing) => {
            const isClaimed = claimedIds.has(listing.id);
            const deadline = new Date(listing.pickupDeadline);
            const hoursLeft = Math.max(0, (deadline - new Date()) / (1000 * 60 * 60));

            return (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{listing.image}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-surface-900 truncate">{listing.foodName}</h3>
                      <p className="text-sm text-surface-500 mt-0.5">{listing.donorName}</p>
                    </div>
                    {hoursLeft < 2 && (
                      <span className="px-2 py-1 text-[11px] font-bold bg-danger-100 text-danger-500 rounded-md">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 mt-3">{listing.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-md font-medium">
                      {listing.quantity} {listing.unit}
                    </span>
                    <span className="text-xs bg-surface-100 text-surface-600 px-2.5 py-1 rounded-md font-medium">
                      {listing.category}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-surface-500">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary-600" />
                      <span>{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-500">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Pickup by{' '}
                        {deadline.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {hoursLeft < 4 && (
                          <span className="text-warning-500 font-medium"> ({hoursLeft.toFixed(1)}h left)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-500">
                      <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{listing.foodSafety}</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="px-5 pb-5 pt-2">
                  <button
                    onClick={() => handleClaim(listing)}
                    disabled={isClaimed}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isClaimed
                        ? 'bg-primary-50 text-primary-600 border border-primary-200'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                    }`}
                  >
                    {isClaimed ? (
                      <>✓ Claimed — Opening Live Tracking...</>
                    ) : (
                      <>
                        <Radio className="w-4 h-4" /> Claim & Track Live 🛰️
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
