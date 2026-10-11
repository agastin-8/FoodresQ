import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor',
    location: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await register(form);
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-surface-900">FoodLink AI</span>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 shadow-[var(--shadow-card)] p-8">
          <h2 className="text-2xl font-bold text-surface-900">Create your account</h2>
          <p className="text-surface-500 mt-1 mb-6">Join the FoodLink AI network</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">I want to</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => update('role', 'donor')}
                  className={`py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border-2 ${
                    form.role === 'donor'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 text-surface-600 hover:border-surface-300'
                  }`}
                >
                  🍳 Donate Food
                </button>
                <button
                  type="button"
                  onClick={() => update('role', 'ngo')}
                  className={`py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border-2 ${
                    form.role === 'ngo'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 text-surface-600 hover:border-surface-300'
                  }`}
                >
                  🤝 Collect as NGO
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-surface-700 mb-1.5">
                {form.role === 'donor' ? 'Business / Restaurant Name' : 'Organization Name'} *
              </label>
              <input
                id="reg-name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder={form.role === 'donor' ? 'e.g. Green Kitchen Restaurant' : 'e.g. FeedIndia Foundation'}
                className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-surface-900 placeholder:text-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-surface-700 mb-1.5">Email *</label>
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-surface-900 placeholder:text-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-sm font-medium text-surface-700 mb-1.5">Phone</label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-surface-900 placeholder:text-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="reg-location" className="block text-sm font-medium text-surface-700 mb-1.5">Location</label>
              <input
                id="reg-location"
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="e.g. Koramangala, Bangalore"
                className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-surface-900 placeholder:text-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-surface-700 mb-1.5">Password *</label>
              <input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-surface-900 placeholder:text-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-danger-500 bg-danger-100 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-sm text-center text-surface-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
