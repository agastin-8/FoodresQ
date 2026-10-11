import { Link } from 'react-router-dom';
import { Plus, Clock, MapPin, Trash2, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';

export default function MyListings() {
  const { user } = useAuth();
  const { listings, deleteListing, donations } = useDonations();

  // Filter listings for current donor (or show all donor listings if demo)
  const myListings = listings.filter((l) => {
    if (!user) return true;
    if (user.role === 'admin') return true;
    return l.donorId === user.id || l.donorName === user.name || (!l.donorId && user.role === 'donor');
  });

  const statusStyle = {
    available: 'bg-primary-50 text-primary-600 border border-primary-200',
    claimed: 'bg-info-100 text-info-700 border border-info-200',
    picked_up: 'bg-surface-100 text-surface-600 border border-surface-200',
  };

  const statusLabel = {
    available: 'Available',
    claimed: 'Claimed by NGO',
    picked_up: 'Picked Up',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Food Listings</h1>
          <p className="text-surface-500 mt-1">Manage your surplus food donations</p>
        </div>
        <Link
          to="/add-listing"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Food
        </Link>
      </div>

      {myListings.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center shadow-xs">
          <span className="text-5xl block mb-3">🍽️</span>
          <p className="text-surface-600 font-medium">No listings yet</p>
          <p className="text-sm text-surface-400 mt-1 mb-4">Start by adding your surplus food</p>
          <Link
            to="/add-listing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myListings.map((listing) => {
            const deadline = listing.pickupDeadline ? new Date(listing.pickupDeadline) : new Date();
            const linkedDonation = donations.find((d) => String(d.listingId) === String(listing.id));
            const trackId = linkedDonation ? linkedDonation.id : donations[0]?.id || 1;

            return (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-5 transition hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl p-2.5 bg-surface-50 rounded-xl border border-surface-100 flex-shrink-0">
                    {listing.image || '🍱'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-surface-900 text-base">{listing.foodName}</h3>
                        <p className="text-sm text-surface-500 mt-0.5">{listing.description || 'Fresh surplus food offered for donation.'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${statusStyle[listing.status] || statusStyle.available}`}>
                        {statusLabel[listing.status] || 'Available'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-sm text-surface-500 pt-2 border-t border-surface-100">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="font-medium text-surface-700">{listing.quantity} {listing.unit}</span>
                        <span className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-surface-400" /> {listing.location || 'Bangalore'}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="w-3.5 h-3.5 text-surface-400" /> By {deadline.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/track/${trackId}`}
                          className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-semibold transition flex items-center gap-1 border border-primary-200"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse text-primary-600" /> Track Live 🛰️
                        </Link>
                        {listing.status === 'available' && (
                          <button
                            onClick={() => deleteListing(listing.id)}
                            className="p-1.5 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
