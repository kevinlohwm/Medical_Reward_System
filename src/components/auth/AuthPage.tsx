import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen dark-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/10 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 transform rotate-45 animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 rounded-full bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 animate-pulse delay-3000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-8">
              <h1 className="text-6xl font-bold mb-4 tracking-tight heading-primary">
                MedRewards
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mx-auto animate-pulse-glow"></div>
            </div>
            <p className="text-slate-300 text-xl font-semibold mb-3">
              Healthcare Loyalty Program
            </p>
            <p className="text-slate-400 text-lg mb-8">
              Earn points, save money, get rewarded
            </p>
            
            {/* Trust indicators */}
            <div className="flex justify-center items-center gap-8 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-500"></div>
                <span className="font-medium">Trusted</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-1000"></div>
                <span className="font-medium">Rewarding</span>
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