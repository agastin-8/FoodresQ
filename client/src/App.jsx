import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AvailableFood from './pages/AvailableFood';
import AddListing from './pages/AddListing';
import MyListings from './pages/MyListings';
import Donations from './pages/Donations';
import SmartMatch from './pages/SmartMatch';
import Users from './pages/Users';
import Stats from './pages/Stats';
import TrackDonation from './pages/TrackDonation';
import SampleCollectionTrip from './pages/SampleCollectionTrip';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <main className="lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8">{children}</main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/available-food"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AvailableFood />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-listing"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AddListing />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-listings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MyListings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/donations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Donations />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/smart-match"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SmartMatch />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Users />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Stats />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/track"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TrackDonation />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/track/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TrackDonation />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/collection-trip"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SampleCollectionTrip />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
