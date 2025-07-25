import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, Lock, Mail, User, Phone, AlertCircle, ArrowRight, Check, X, UserPlus } from 'lucide-react'

interface RegisterFormProps {
  onToggleForm: () => void
}

export function RegisterForm({ onToggleForm }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const result = await signUp(
      formData.email,
      formData.password,
      formData.name,
      formData.phone
    )
    
    if (result.error) {
      setError(result.error.message)
    } else if (result.message) {
      // Show success message for email confirmation
      setError('')
      setMessage(result.message)
    } else {
      // Successful signup with immediate login
      setError('')
      setMessage('Account created successfully!')
    }
    
    setLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getPasswordStrength = () => {
    const password = formData.password
    let strength = 0
    if (password.length >= 6) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/\d/)) strength++
    if (password.match(/[^a-zA-Z\d]/)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength()
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

  const handleSocialLogin = (provider: string) => {
    // Placeholder for social login implementation
    console.log(`Register with ${provider}`)
  }

  return (
    <Card className="glass-card animate-scale-in overflow-hidden">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold heading-primary">
          <span className="text-gradient flex items-center justify-center gap-2">
            <UserPlus className="h-8 w-8 text-blue-400" />
            Join MedRewards
          </span>
        </CardTitle>
        <CardDescription className="text-slate-400 text-lg">
          Create your account and start earning rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300 font-semibold">Full Name</Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="modern-input pl-12 h-12"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300 font-semibold">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400 group-focus-within:text-green-300 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="modern-input pl-12 h-12"
                required
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300 font-semibold">Phone Number <span className="text-slate-500">(Optional)</span></Label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="modern-input pl-12 h-12"
              />
            </div>
          </div>
          
          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300 font-semibold">Password</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="modern-input pl-12 pr-12 h-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Password Strength Meter */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-3 flex-1 rounded-full transition-all duration-300 ${
                        level <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  passwordStrength >= 3 ? 'text-green-600' : passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  Password strength: {strengthLabels[passwordStrength - 1] || 'Very Weak'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300 font-semibold">Confirm Password</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="modern-input pl-12 pr-12 h-12"
                required
              />
              {formData.confirmPassword && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {formData.password === formData.confirmPassword ? (
                    <Check className="h-5 w-5 text-green-400" />
                  ) : (
                    <X className="h-5 w-5 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 notification-error px-4 py-3 rounded-xl">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="flex items-center gap-3 notification-success px-4 py-3 rounded-xl">
              <Check className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          {/* Create Account Button */}
          <Button type="submit" className="btn-success w-full h-12 group" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 modern-spinner"></div>
                Creating account...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Create Account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-900 text-slate-400 font-semibold">Or continue with</span>
          </div>
        </div>

        {/* Social Login Options */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            className="btn-secondary h-12"
            onClick={() => handleSocialLogin('google')}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>
          <Button
            type="button"
            className="btn-secondary h-12"
            onClick={() => handleSocialLogin('facebook')}
          >
            <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </Button>
        </div>

        {/* Sign In Link */}
        <div className="text-center pt-6 border-t border-slate-600">
          <p className="text-slate-400">
            Already have an account?{' '}
            <button
              onClick={onToggleForm}
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}