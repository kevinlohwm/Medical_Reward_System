import { useAuth } from './hooks/useAuth'
import { AuthPage } from './components/auth/AuthPage'
import { CustomerDashboard } from './components/customer/Dashboard'
import { StaffDashboard } from './components/staff/StaffDashboard'
import { AdminDashboard } from './components/admin/AdminDashboard'

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthPage />
  }

  // Route based on user role
  switch (profile.role) {
    case 'customer':
      return <CustomerDashboard />
    case 'staff':
      return <StaffDashboard />
    case 'admin':
      return <AdminDashboard />
    default:
      return <AuthPage />
  }
}

export default App