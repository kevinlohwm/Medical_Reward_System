import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Search, DollarSign, Gift, History, User, Award } from 'lucide-react'

// Animation utility functions
const animateCounter = (element: HTMLElement, start: number, end: number, duration: number = 1000) => {
  const startTime = performance.now()
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const current = Math.floor(start + (end - start) * progress)
    element.textContent = current.toString()
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  requestAnimationFrame(animate)
}

const showSuccessAnimation = (element: HTMLElement) => {
  element.classList.add('success-animation', 'show')
  setTimeout(() => {
    element.classList.remove('success-animation', 'show')
  }, 600)
}

const createConfetti = () => {
  const container = document.createElement('div')
  container.className = 'confetti-container'
  document.body.appendChild(container)

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div')
    confetti.className = 'confetti-piece'
    confetti.style.left = Math.random() * 100 + '%'
    confetti.style.animationDelay = Math.random() * 3 + 's'
    confetti.style.backgroundColor = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]
    container.appendChild(confetti)
  }

  setTimeout(() => {
    document.body.removeChild(container)
  }, 3000)
}

interface Customer {
  id: string
  name: string
  email: string
  phone_number: string | null
  points_balance: number
}

interface Transaction {
  id: string
  user_id: string
  bill_amount: number
  points_earned: number
  created_at: string
  users: {
    name: string
    email: string
  }
}

interface SystemConfig {
  points_per_dollar: number
  points_per_dollar_value: number
}

export function StaffDashboard() {
  const { profile, signOut } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [billAmount, setBillAmount] = useState('')
  const [pointsToRedeem, setPointsToRedeem] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ points_per_dollar: 1, points_per_dollar_value: 0.01 })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSystemConfig()
    if (profile?.clinic_id) {
      fetchTodaysTransactions()
    }
  }, [profile?.clinic_id])

  const fetchSystemConfig = async () => {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('*')
        .single()
      
      if (data) {
        setSystemConfig(data)
      }
    } catch (error) {
      console.error('Error fetching system config:', error)
    }
  }

  const fetchTodaysTransactions = async () => {
    if (!profile?.clinic_id) {
      console.warn('No clinic_id available, skipping transaction fetch')
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          users (name, email)
        `)
        .eq('clinic_id', profile?.clinic_id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })

      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  const searchCustomer = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      // Try to parse as QR code data first
      let searchQuery = searchTerm
      try {
        const qrData = JSON.parse(searchTerm)
        if (qrData.userId) {
          searchQuery = qrData.userId
        }
      } catch {
        // Not QR code data, continue with regular search
      }

      // Build the query conditions based on whether searchQuery is a valid UUID
      let orConditions = [
        `email.ilike.%${searchQuery}%`,
        `name.ilike.%${searchQuery}%`,
        `phone_number.ilike.%${searchQuery}%`
      ]

      // Only add UUID search if the search query is a valid UUID
      if (isValidUUID(searchQuery)) {
        orConditions.unshift(`id.eq.${searchQuery}`)
      }

      const { data } = await supabase
        .from('users')
        .select('id, name, email, phone_number, points_balance')
        .eq('role', 'customer')
        .or(orConditions.join(','))
        .limit(1)
        .maybeSingle()

      if (data) {
        setSelectedCustomer(data)
        setMessage('')
      } else {
        setMessage('Customer not found')
        setSelectedCustomer(null)
      }
    } catch (error) {
      setMessage('Customer not found')
      setSelectedCustomer(null)
    } finally {
      setLoading(false)
    }
  }

  const awardPoints = async () => {
    if (!selectedCustomer || !billAmount || !profile?.clinic_id) return

    setLoading(true)
    try {
      const amount = parseFloat(billAmount)
      const pointsEarned = Math.floor(amount * systemConfig.points_per_dollar)

      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedCustomer.id,
          clinic_id: profile.clinic_id,
          bill_amount: amount,
          points_earned: pointsEarned
        })

      if (transactionError) throw transactionError

      // Update user points balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          points_balance: selectedCustomer.points_balance + pointsEarned
        })
        .eq('id', selectedCustomer.id)

      if (updateError) throw updateError

      // Show success animation and confetti
      const awardButton = document.getElementById('award-points-button')
      if (awardButton) {
        showSuccessAnimation(awardButton)
      }
      createConfetti()

      // Animate the points counter
      const pointsElement = document.getElementById('customer-points-balance')
      if (pointsElement) {
        animateCounter(pointsElement, selectedCustomer.points_balance, selectedCustomer.points_balance + pointsEarned, 1000)
      }

      setMessage(`Successfully awarded ${pointsEarned} points!`)
      setSelectedCustomer({
        ...selectedCustomer,
        points_balance: selectedCustomer.points_balance + pointsEarned
      })
      setBillAmount('')
      fetchTodaysTransactions()
    } catch (error) {
      setMessage('Error awarding points')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const redeemPoints = async () => {
    if (!selectedCustomer || !pointsToRedeem || !profile?.clinic_id) return

    const points = parseInt(pointsToRedeem)
    if (points > selectedCustomer.points_balance) {
      setMessage('Insufficient points balance')
      return
    }

    setLoading(true)
    try {
      const cashValue = points * systemConfig.points_per_dollar_value

      // Create redemption
      const { error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
          user_id: selectedCustomer.id,
          clinic_id: profile.clinic_id,
          points_redeemed: points,
          cash_value_offset: cashValue
        })

      if (redemptionError) throw redemptionError

      // Update user points balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          points_balance: selectedCustomer.points_balance - points
        })
        .eq('id', selectedCustomer.id)

      if (updateError) throw updateError

      // Show success animation
      const redeemButton = document.getElementById('redeem-points-button')
      if (redeemButton) {
        showSuccessAnimation(redeemButton)
      }

      // Animate the points counter
      const pointsElement = document.getElementById('customer-points-balance')
      if (pointsElement) {
        animateCounter(pointsElement, selectedCustomer.points_balance, selectedCustomer.points_balance - points, 1000)
      }

      setMessage(`Successfully redeemed ${points} points for $${cashValue.toFixed(2)}!`)
      setSelectedCustomer({
        ...selectedCustomer,
        points_balance: selectedCustomer.points_balance - points
      })
      setPointsToRedeem('')
    } catch (error) {
      setMessage('Error redeeming points')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen dark-bg py-6 container-padding">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white heading-primary">Staff Portal</h1>
            <p className="text-slate-400">Manage customer rewards and transactions</p>
          </div>
          <Button onClick={signOut} className="btn-danger focus-visible" aria-label="Sign out of staff portal">
            Sign Out
          </Button>
        </div>

        {/* Customer Search */}
        <Card className="mb-8 glass-card text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-400" aria-hidden="true" />
              Customer Lookup
            </CardTitle>
            <CardDescription className="text-slate-400">
              Search by name, email, phone, or scan QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter customer details or QR code data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
                  className="modern-input"
                  aria-label="Search for customer by name, email, phone, or QR code"
                />
              </div>
              <Button 
                onClick={searchCustomer} 
                disabled={loading} 
                className="btn-primary focus-visible"
                aria-label="Search for customer"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-md text-sm ${
                message.includes('Error') || message.includes('not found') || message.includes('Insufficient')
                  ? 'notification-error text-white'
                  : 'notification-success text-white'
              }`}>
                {message}
              </div>
            )}

            {selectedCustomer && (
              <div className="mt-6 p-4 border rounded-lg glass-card">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-8 w-8 text-blue-400" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-lg text-white text-gradient">{selectedCustomer.name}</h3>
                    <p className="text-sm text-slate-400">{selectedCustomer.email}</p>
                    {selectedCustomer.phone_number && (
                      <p className="text-sm text-slate-400">{selectedCustomer.phone_number}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  <span className="font-medium text-white">
                    Points Balance: <span id="customer-points-balance" className="animated-counter">{selectedCustomer.points_balance}</span>
                  </span>
                  <span className="text-sm text-slate-400">
                    (${(selectedCustomer.points_balance * systemConfig.points_per_dollar_value).toFixed(2)} value)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {selectedCustomer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" aria-hidden="true" />
                  Award Points
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Enter bill amount to calculate and award points
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="billAmount" className="text-white">Bill Amount ($)</Label>
                  <Input
                    id="billAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="modern-input"
                    aria-describedby="bill-amount-help"
                  />
                  {billAmount && (
                    <p id="bill-amount-help" className="text-sm text-slate-400 mt-1">
                      Will award: {Math.floor(parseFloat(billAmount || '0') * systemConfig.points_per_dollar)} points
                    </p>
                  )}
                </div>
                <Button 
                  id="award-points-button"
                  onClick={awardPoints} 
                  disabled={!billAmount || loading} 
                  className="w-full btn-success focus-visible"
                  aria-label="Award points to customer"
                >
                  Award Points
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-400" aria-hidden="true" />
                  Redeem Points
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Enter points to redeem for cash value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pointsToRedeem" className="text-white">Points to Redeem</Label>
                  <Input
                    id="pointsToRedeem"
                    type="number"
                    placeholder="0"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(e.target.value)}
                    max={selectedCustomer.points_balance}
                    className="modern-input"
                    aria-describedby="points-redeem-help"
                  />
                  {pointsToRedeem && (
                    <p id="points-redeem-help" className="text-sm text-slate-400 mt-1">
                      Cash value: ${(parseInt(pointsToRedeem || '0') * systemConfig.points_per_dollar_value).toFixed(2)}
                    </p>
                  )}
                </div>
                <Button 
                  id="redeem-points-button"
                  onClick={redeemPoints} 
                  disabled={!pointsToRedeem || loading} 
                  className="w-full btn-primary focus-visible"
                  aria-label="Redeem customer points"
                >
                  Redeem Points
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Today's Transactions */}
        <Card className="glass-card text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-400" aria-hidden="true" />
              Today's Transactions
            </CardTitle>
            <CardDescription className="text-slate-400">
              All loyalty transactions for your clinic today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No transactions today</p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg glass-card interactive-card">
                    <div>
                      <p className="font-medium text-white">{transaction.users.name}</p>
                      <p className="text-sm text-slate-400">{transaction.users.email}</p>
                      <p className="text-sm text-slate-400">
                        <time dateTime={transaction.created_at}>
                          {formatDate(transaction.created_at)}
                        </time>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-400 text-gradient">+{transaction.points_earned} points</p>
                      <p className="text-sm text-slate-400">${transaction.bill_amount.toFixed(2)} bill</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}