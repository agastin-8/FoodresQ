import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      await login(email, password, role);
      navigate('/dashboard');
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  const quickLogin = async (demoRole) => {
    const emails = {
      donor: 'donor@foodlink.demo',
      ngo: 'ngo@foodlink.demo',
      volunteer: 'volunteer@foodlink.demo',
      admin: 'admin@foodlink.demo',
    };
    setRole(demoRole);
    setEmail(emails[demoRole]);
    setPassword('password123');
    try {
      await login(emails[demoRole], 'password123', demoRole);
      navigate('/dashboard');
    } catch {
      setError('Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">FoodLink AI</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Reduce waste.<br />Feed communities.
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Connect surplus food from restaurants, hotels, and bakeries with NGOs
            that deliver it to people in need with real-time GPS tracking.
          </p>
          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">🍛</div>
              <span className="text-primary-100">Smart food-to-NGO matching</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">🛰️</div>
              <span className="text-primary-100">Live GPS tracking with Leaflet & WebSockets</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">📊</div>
              <span className="text-primary-100">PostgreSQL database persistence & analytics</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-primary-200 text-sm">
          © 2026 FoodLink AI — Food Donation & Redistribution
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">FoodLink AI</span>
          </div>

          <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
          <p className="text-surface-500 mt-1 mb-6">Sign in to your account to continue</p>

          {/* Quick demo login buttons */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2.5">Quick Demo Login</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'donor', label: '🍳 Donor', desc: 'Restaurant' },
                { key: 'ngo', label: '🤝 NGO', desc: 'Partner' },
                { key: 'volunteer', label: '🛵 Volunteer', desc: 'Live GPS' },
                { key: 'admin', label: '⚙️ Admin', desc: 'Manager' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => quickLogin(item.key)}
                  disabled={loading}
                  className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl border-2 border-surface-200 hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer text-center bg-white shadow-xs"
                >
                  <span className="text-xs font-bold text-surface-800">{item.label}</span>
                  <span className="text-[10px] text-surface-400">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-xs text-surface-400 font-medium">or sign in manually</span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                I am a
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { key: 'donor', label: 'Donor' },
                  { key: 'ngo', label: 'NGO' },
                  { key: 'volunteer', label: 'Volunteer' },
                  { key: 'admin', label: 'Admin' },
                ].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      role === r.key
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-surface-700 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-surface-900 placeholder:text-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-surface-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 bg-white text-surface-900 placeholder:text-surface-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-danger-100 text-danger-500 text-xs">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-surface-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
