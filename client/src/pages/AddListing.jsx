import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';

export default function AddListing() {
  const { user } = useAuth();
  const { addListing } = useDonations();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    foodName: '',
    description: '',
    quantity: '',
    unit: 'meals',
    category: 'Main Course',
    pickupDeadline: '',
    location: user?.location || 'Koramangala, Bangalore',
    foodSafety: '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addListing(form, user);
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate('/my-listings'), 1200);
    } catch (err) {
      console.error('Failed to add listing:', err);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="text-2xl font-bold text-surface-900">Listing Created!</h2>
          <p className="text-surface-500 mt-2">Your food listing is now visible to NGOs.</p>
          <p className="text-sm text-surface-400 mt-1">Redirecting to your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-surface-900">Add Food Listing</h1>
      <p className="text-surface-500 mt-1 mb-6">Share your surplus food with NGOs in need</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-6 space-y-5">
        {/* Food name */}
        <div>
          <label htmlFor="add-food-name" className="block text-sm font-medium text-surface-700 mb-1.5">
            Food Name *
          </label>
          <input
            id="add-food-name"
            type="text"
            required
            value={form.foodName}
            onChange={(e) => update('foodName', e.target.value)}
            placeholder="e.g. Vegetable Biryani"
            className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="add-description" className="block text-sm font-medium text-surface-700 mb-1.5">
            Description
          </label>
          <textarea
            id="add-description"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe the food, how it was prepared, etc."
            className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition resize-none"
          />
        </div>

        {/* Quantity + unit + category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="add-quantity" className="block text-sm font-medium text-surface-700 mb-1.5">Quantity *</label>
            <input
              id="add-quantity"
              type="number"
              required
              min="1"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              placeholder="e.g. 25"
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            />
          </div>
          <div>
            <label htmlFor="add-unit" className="block text-sm font-medium text-surface-700 mb-1.5">Unit</label>
            <select
              id="add-unit"
              value={form.unit}
              onChange={(e) => update('unit', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="meals">Meals</option>
              <option value="pieces">Pieces</option>
              <option value="kg">Kilograms</option>
              <option value="loaves">Loaves</option>
              <option value="plates">Plates</option>
              <option value="boxes">Boxes</option>
            </select>
          </div>
          <div>
            <label htmlFor="add-category" className="block text-sm font-medium text-surface-700 mb-1.5">Category</label>
            <select
              id="add-category"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option>Main Course</option>
              <option>Snacks</option>
              <option>Bakery</option>
              <option>Starters</option>
              <option>Fruits</option>
              <option>Beverages</option>
              <option>Desserts</option>
            </select>
          </div>
        </div>

        {/* Pickup deadline */}
        <div>
          <label htmlFor="add-deadline" className="block text-sm font-medium text-surface-700 mb-1.5">
            Pickup Deadline *
          </label>
          <input
            id="add-deadline"
            type="datetime-local"
            required
            value={form.pickupDeadline}
            onChange={(e) => update('pickupDeadline', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="add-location" className="block text-sm font-medium text-surface-700 mb-1.5">
            Pickup Location *
          </label>
          <input
            id="add-location"
            type="text"
            required
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="e.g. Koramangala, Bangalore"
            className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          />
        </div>

        {/* Food safety */}
        <div>
          <label htmlFor="add-safety" className="block text-sm font-medium text-surface-700 mb-1.5">
            Food Handling & Safety Info
          </label>
          <textarea
            id="add-safety"
            rows={2}
            value={form.foodSafety}
            onChange={(e) => update('foodSafety', e.target.value)}
            placeholder="Allergens, storage info, dietary info (veg/non-veg), etc."
            className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating listing...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Create Listing
            </>
          )}
        </button>
      </form>
    </div>
  );
}
