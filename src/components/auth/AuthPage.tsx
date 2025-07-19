import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen relative overflow-hidden animated-bg">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating holographic shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 cyber-gradient-1 rounded-3xl opacity-30 float neon-glow" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-32 w-24 h-24 cyber-gradient-3 rounded-full opacity-40 float-delayed neon-glow-green" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 cyber-gradient-4 rounded-2xl opacity-35 float neon-glow-purple" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 cyber-gradient-5 rounded-full opacity-30 float-delayed pulse-glow" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 cyber-gradient-2 rounded-xl opacity-25 float neon-glow-pink" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/3 right-10 w-20 h-20 cyber-gradient-6 rounded-2xl opacity-30 float-delayed" style={{ animationDelay: '4s' }}></div>
        
        {/* Particle effects */}
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-60 animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="relative mb-6">
              <h1 className="text-6xl font-bold mb-3 tracking-tight holographic-text">
                MedRewards
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
            </div>
            <p className="text-white text-2xl font-bold mb-3 neon-glow">
              Healthcare Loyalty Program
            </p>
            <p className="text-white/80 text-lg mb-6">
              Earn points, save money, get rewarded
            </p>
            
            {/* Decorative elements */}
            <div className="flex justify-center items-center gap-4">
              <div className="w-3 h-3 cyber-gradient-2 rounded-full pulse-glow"></div>
              <div className="w-4 h-4 cyber-gradient-3 rounded-full pulse-glow" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-3 h-3 cyber-gradient-4 rounded-full pulse-glow" style={{ animationDelay: '1s' }}></div>
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