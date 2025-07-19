import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-25 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
        
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
        
        {/* Animated particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-yellow-300 rounded-full opacity-50 animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-2 h-2 bg-pink-300 rounded-full opacity-70 animate-ping" style={{ animationDelay: '3s' }}></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
              <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                MedRewards
              </span>
            </h1>
            <p className="text-white/90 text-xl font-medium mb-2">
              Healthcare Loyalty Program
            </p>
            <p className="text-white/70 text-lg">
              Earn points, save money, get rewarded
            </p>
            
            {/* Decorative elements */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
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