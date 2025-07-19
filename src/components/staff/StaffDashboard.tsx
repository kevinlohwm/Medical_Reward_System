import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Search, DollarSign, Gift, History, QrCode, User, Award } from 'lucide-react'

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
    fetchTodaysTransactions()
  }, [])

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

      const { data } = await supabase
        .from('users')
        .select('id, name, email, phone_number, points_balance')
        .eq('role', 'customer')
        .or(`id.eq.${searchQuery},email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
        .limit(1)
        .single()

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Portal</h1>
            <p className="text-gray-600">Manage customer rewards and transactions</p>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Customer Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Customer Lookup
            </CardTitle>
            <CardDescription>
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
                />
              </div>
              <Button onClick={searchCustomer} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-md text-sm ${
                message.includes('Error') || message.includes('not found') || message.includes('Insufficient')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {message}
              </div>
            )}

            {selectedCustomer && (
              <div className="mt-6 p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    {selectedCustomer.phone_number && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone_number}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Points Balance: {selectedCustomer.points_balance}</span>
                  <span className="text-sm text-muted-foreground">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Award Points
                </CardTitle>
                <CardDescription>
                  Enter bill amount to calculate and award points
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="billAmount">Bill Amount ($)</Label>
                  <Input
                    id="billAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                  />
                  {billAmount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Will award: {Math.floor(parseFloat(billAmount || '0') * systemConfig.points_per_dollar)} points
                    </p>
                  )}
                </div>
                <Button onClick={awardPoints} disabled={!billAmount || loading} className="w-full">
                  Award Points
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Redeem Points
                </CardTitle>
                <CardDescription>
                  Enter points to redeem for cash value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pointsToRedeem">Points to Redeem</Label>
                  <Input
                    id="pointsToRedeem"
                    type="number"
                    placeholder="0"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(e.target.value)}
                    max={selectedCustomer.points_balance}
                  />
                  {pointsToRedeem && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Cash value: ${(parseInt(pointsToRedeem || '0') * systemConfig.points_per_dollar_value).toFixed(2)}
                    </p>
                  )}
                </div>
                <Button onClick={redeemPoints} disabled={!pointsToRedeem || loading} className="w-full">
                  Redeem Points
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Today's Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Today's Transactions
            </CardTitle>
            <CardDescription>
              All loyalty transactions for your clinic today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions today</p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.users.name}</p>
                      <p className="text-sm text-muted-foreground">{transaction.users.email}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+{transaction.points_earned} points</p>
                      <p className="text-sm text-muted-foreground">${transaction.bill_amount.toFixed(2)} bill</p>
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