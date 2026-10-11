import { Users as UsersIcon, Shield, Building2, Heart } from 'lucide-react';
import { DEMO_NGOS } from '../data/demoData';

const ALL_DEMO_USERS = [
  {
    id: 1,
    name: 'Green Kitchen Restaurant',
    email: 'donor@foodlink.demo',
    role: 'donor',
    type: 'Restaurant',
    location: 'Koramangala, Bangalore',
    status: 'Active',
    joinedAt: '2026-08-15',
  },
  {
    id: 2,
    name: 'FeedIndia Foundation',
    email: 'ngo@foodlink.demo',
    role: 'ngo',
    type: 'NGO / Shelter',
    location: 'Indiranagar, Bangalore',
    status: 'Verified',
    joinedAt: '2026-08-10',
  },
  {
    id: 3,
    name: 'Taj Hotel Banquets',
    email: 'taj@hotel.demo',
    role: 'donor',
    type: 'Hotel',
    location: 'MG Road, Bangalore',
    status: 'Active',
    joinedAt: '2026-09-01',
  },
  {
    id: 4,
    name: 'Baker\'s Dozen',
    email: 'bakers@dozen.demo',
    role: 'donor',
    type: 'Bakery',
    location: 'HSR Layout, Bangalore',
    status: 'Active',
    joinedAt: '2026-09-12',
  },
  {
    id: 5,
    name: 'Akshaya Patra',
    email: 'akshaya@patra.demo',
    role: 'ngo',
    type: 'NGO',
    location: 'BTM Layout, Bangalore',
    status: 'Verified',
    joinedAt: '2026-07-20',
  },
  {
    id: 6,
    name: 'Robin Hood Army',
    email: 'robinhood@army.demo',
    role: 'ngo',
    type: 'NGO',
    location: 'JP Nagar, Bangalore',
    status: 'Verified',
    joinedAt: '2026-08-01',
  },
];

export default function Users() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Registered Platform Users</h1>
        <p className="text-surface-500 mt-1">Manage donors, NGOs, and platform partners</p>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Organization / User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm text-surface-700">
              {ALL_DEMO_USERS.map((u) => (
                <tr key={u.id} className="hover:bg-surface-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-surface-900">
                    <div>
                      <p>{u.name}</p>
                      <p className="text-xs text-surface-400 font-normal">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        u.role === 'donor'
                          ? 'bg-primary-50 text-primary-700'
                          : u.role === 'ngo'
                          ? 'bg-info-100 text-info-500'
                          : 'bg-surface-100 text-surface-700'
                      }`}
                    >
                      {u.role === 'donor' ? (
                        <Building2 className="w-3 h-3" />
                      ) : u.role === 'ngo' ? (
                        <Heart className="w-3 h-3" />
                      ) : (
                        <Shield className="w-3 h-3" />
                      )}
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">{u.type}</td>
                  <td className="px-6 py-4">{u.location}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-surface-400">{u.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
