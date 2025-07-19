import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, hsl(var(--clinic-teal)) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, hsl(var(--clinic-coral)) 0%, transparent 50%)
          `,
        }}></div>
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 rounded-lg bg-gradient-to-br from-coral-100 to-coral-200 opacity-40 transform rotate-45"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 opacity-25"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 opacity-30"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-6">
              <h1 className="text-5xl font-bold mb-3 tracking-tight heading-primary">
                <span className="bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                  MedRewards
                </span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-coral-500 rounded-full mx-auto"></div>
            </div>
            <p className="text-gray-700 text-xl font-semibold mb-3">
              Healthcare Loyalty Program
            </p>
            <p className="text-gray-600 text-lg mb-6">
              Earn points, save money, get rewarded
            </p>
            
            {/* Trust indicators */}
            <div className="flex justify-center items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Trusted</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-coral-500 rounded-full"></div>
                <span>Rewarding</span>
              </div>
            </div>
          </div>
          
          {/* Auth forms */}
          <div className="animate-slide-up">
            {isLogin ? (
              <LoginForm onToggleForm={() => setIsLogin(false)} />
            ) : (
              <RegisterForm onToggleForm={() => setIsLogin(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}