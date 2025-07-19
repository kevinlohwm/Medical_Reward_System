import { useAuth } from './hooks/useAuth'
import { AuthPage } from './components/auth/AuthPage'
import { CustomerDashboard } from './components/customer/Dashboard'
import { StaffDashboard } from './components/staff/StaffDashboard'
import { AdminDashboard } from './components/admin/AdminDashboard'

function App() {
  const { user, profile, loading } = useAuth()

  console.log('App render - loading:', loading, 'user:', user, 'profile:', profile)

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

  console.log('Checking auth state - user exists:', !!user, 'profile exists:', !!profile)
  
  if (!user) {
    console.log('No user, showing auth page')
    return <AuthPage />
  }

  if (!profile) {
    console.log('User exists but no profile, showing loading...')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    )
  }

  console.log('Routing to dashboard for role:', profile.role)

  // Route based on user role
  switch (profile.role) {
    case 'customer':
      console.log('Rendering customer dashboard')
      return <CustomerDashboard />
    case 'staff':
      console.log('Rendering staff dashboard')
      return <StaffDashboard />
    case 'admin':
      console.log('Rendering admin dashboard')
      return <AdminDashboard />
    default:
      console.log('Unknown role, showing auth page')
      return <AuthPage />
  }
}

export default App