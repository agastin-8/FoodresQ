import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  HandHeart,
  BrainCircuit,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  Leaf,
  Radio,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import { useState } from 'react';

const NAV_ITEMS = {
  donor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-listings', icon: UtensilsCrossed, label: 'My Listings' },
    { to: '/add-listing', icon: UtensilsCrossed, label: 'Add Food' },
    { to: '/donations', icon: HandHeart, label: 'Donations' },
    { to: '/track/1', icon: Radio, label: 'Live Tracking 🛰️' },
    { to: '/collection-trip', icon: Truck, label: 'Collection Trip 🚚' },
    { to: '/smart-match', icon: BrainCircuit, label: 'Smart Match' },
  ],
  ngo: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/available-food', icon: UtensilsCrossed, label: 'Available Food' },
    { to: '/donations', icon: HandHeart, label: 'My Pickups' },
    { to: '/track/1', icon: Radio, label: 'Live Tracking 🛰️' },
    { to: '/collection-trip', icon: Truck, label: 'Collection Trip 🚚' },
    { to: '/smart-match', icon: BrainCircuit, label: 'Smart Match' },
  ],
  volunteer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/track/1', icon: Radio, label: 'My Active Delivery 🛰️' },
    { to: '/collection-trip', icon: Truck, label: 'Collection Route 🚚' },
    { to: '/donations', icon: HandHeart, label: 'All Trips' },
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/available-food', icon: UtensilsCrossed, label: 'All Listings' },
    { to: '/donations', icon: HandHeart, label: 'All Donations' },
    { to: '/track/1', icon: Radio, label: 'Live Tracking 🛰️' },
    { to: '/collection-trip', icon: Truck, label: 'Collection Trip 🚚' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/stats', icon: BarChart3, label: 'Statistics' },
    { to: '/smart-match', icon: BrainCircuit, label: 'Smart Match' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.donor;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel =
    user?.role === 'donor'
      ? 'Food Donor'
      : user?.role === 'ngo'
      ? 'NGO Partner'
      : user?.role === 'volunteer'
      ? 'Volunteer Hero'
      : 'Admin';

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-6 border-b border-surface-100 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shadow-xs">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-surface-900 leading-tight">FoodLink</h1>
              <span className="text-[11px] font-semibold tracking-wider text-primary-600 uppercase">
                AI
              </span>
            </div>
          </div>
          <NotificationCenter />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm font-semibold'
                  : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-surface-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-50 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">{user?.name || 'Demo User'}</p>
            <p className="text-xs text-surface-400 capitalize">{roleLabel}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-surface-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-surface-200 px-4 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-surface-900">FoodLink AI</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-surface-600 hover:bg-surface-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-64 bg-white z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-surface-200 flex-col z-30 shadow-xs">
        {sidebarContent}
      </aside>
    </>
  );
}
