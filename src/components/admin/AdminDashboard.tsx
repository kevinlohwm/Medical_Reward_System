import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { BarChart3, Users, Award, TrendingUp, Settings, Plus, Send } from 'lucide-react'

interface Analytics {
  totalMembers: number
  totalPointsInCirculation: number
  totalTransactions: number
  totalRedemptions: number
  topClinic: string
  averageSpending: number
}

interface Customer {
  id: string
  name: string
  email: string
  points_balance: number
  created_at: string
  last_visit?: string
  total_spending: number
  visit_count: number
}

interface SystemConfig {
  points_per_dollar: number
  points_per_dollar_value: number
}

export function AdminDashboard() {
  const { signOut } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics>({
    totalMembers: 0,
    totalPointsInCirculation: 0,
    totalTransactions: 0,
    totalRedemptions: 0,
    topClinic: '',
    averageSpending: 0
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ points_per_dollar: 1, points_per_dollar_value: 0.01 })
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  })
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchAnalytics()
    fetchCustomers()
    fetchSystemConfig()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Get total members
      const { count: totalMembers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')

      // Get total points in circulation
      const { data: pointsData } = await supabase
        .from('users')
        .select('points_balance')
        .eq('role', 'customer')

      const totalPointsInCirculation = pointsData?.reduce((sum, user) => sum + user.points_balance, 0) || 0

      // Get transaction count
      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })

      // Get redemption count
      const { count: totalRedemptions } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })

      // Get top performing clinic
      const { data: clinicData } = await supabase
        .from('transactions')
        .select(`
          clinic_id,
          clinics (name),
          bill_amount
        `)

      const clinicStats = clinicData?.reduce((acc: any, transaction: any) => {
        const clinicName = transaction.clinics?.name || 'Unknown'
        if (!acc[clinicName]) {
          acc[clinicName] = { revenue: 0, count: 0 }
        }
        acc[clinicName].revenue += transaction.bill_amount
        acc[clinicName].count += 1
        return acc
      }, {})

      const topClinic = Object.entries(clinicStats || {})
        .sort(([,a]: any, [,b]: any) => b.revenue - a.revenue)[0]?.[0] || 'N/A'

      // Calculate average spending
      const totalSpending = clinicData?.reduce((sum, t: any) => sum + t.bill_amount, 0) || 0
      const averageSpending = totalMembers ? totalSpending / totalMembers : 0

      setAnalytics({
        totalMembers: totalMembers || 0,
        totalPointsInCirculation,
        totalTransactions: totalTransactions || 0,
        totalRedemptions: totalRedemptions || 0,
        topClinic,
        averageSpending
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          points_balance,
          created_at
        `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      // Enhance with transaction data
      const enhancedCustomers = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('bill_amount, created_at')
            .eq('user_id', customer.id)

          const totalSpending = transactions?.reduce((sum, t) => sum + t.bill_amount, 0) || 0
          const visitCount = transactions?.length || 0
          const lastVisit = transactions?.[0]?.created_at

          return {
            ...customer,
            total_spending: totalSpending,
            visit_count: visitCount,
            last_visit: lastVisit
          }
        })
      )

      setCustomers(enhancedCustomers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const updateSystemConfig = async () => {
    try {
      // First check if a config record exists
      const { data: existingConfig } = await supabase
        .from('system_config')
        .select('id')
        .single()

      let error
      if (existingConfig) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('system_config')
          .update({
            points_per_dollar: systemConfig.points_per_dollar,
            points_per_dollar_value: systemConfig.points_per_dollar_value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
        error = updateError
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('system_config')
          .insert({
            points_per_dollar: systemConfig.points_per_dollar,
            points_per_dollar_value: systemConfig.points_per_dollar_value
          })
        error = insertError
      }

      if (error) throw error
      setMessage('System configuration updated successfully!')
    } catch (error) {
      setMessage('Error updating system configuration')
      console.error('Error:', error)
    }
  }

  const createPromotion = async () => {
    try {
      const { error } = await supabase
        .from('promotions')
        .insert({
          title: promotionForm.title,
          description: promotionForm.description,
          start_date: promotionForm.startDate,
          end_date: promotionForm.endDate,
          target_segment_criteria: {},
          is_active: true
        })

      if (error) throw error
      
      setMessage('Promotion created successfully!')
      setPromotionForm({ title: '', description: '', startDate: '', endDate: '' })
      setIsPromotionDialogOpen(false)
    } catch (error) {
      setMessage('Error creating promotion')
      console.error('Error:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark-bg">
        <div className="text-center">
          <div className="w-12 h-12 modern-spinner mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white heading-primary">Admin Dashboard</h1>
            <p className="text-slate-400">Manage the entire loyalty program</p>
          </div>
          <Button onClick={signOut} className="btn-danger">
            Sign Out
          </Button>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stats-card text-white interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">{analytics.totalMembers}</div>
            </CardContent>
          </Card>

          <Card className="stats-card-success text-white interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points in Circulation</CardTitle>
              <Award className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">{analytics.totalPointsInCirculation.toLocaleString()}</div>
              <p className="text-xs text-slate-300">
                ${(analytics.totalPointsInCirculation * systemConfig.points_per_dollar_value).toFixed(2)} value
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card-warning text-white interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <BarChart3 className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">{analytics.totalTransactions}</div>
            </CardContent>
          </Card>

          <Card className="stats-card-danger text-white interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Clinic</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-gradient">{analytics.topClinic}</div>
              <p className="text-xs text-slate-300">
                Avg spending: ${analytics.averageSpending.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-md text-sm ${
            message.includes('Error') ? 'notification-error text-white' : 'notification-success text-white'
          }`}>
            {message}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="nav-tabs grid w-full grid-cols-3">
            <TabsTrigger value="customers" className="nav-tab">Customer Management</TabsTrigger>
            <TabsTrigger value="promotions" className="nav-tab">Promotions</TabsTrigger>
            <TabsTrigger value="settings" className="nav-tab">System Settings</TabsTrigger>
          </TabsList>

          {/* Customer Management */}
          <TabsContent value="customers">
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="heading-secondary">Customer Segmentation</CardTitle>
                <CardDescription className="text-slate-400">
                  View and analyze customer data for targeted marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg glass-card interactive-card">
                      <div>
                        <p className="font-medium text-white">{customer.name}</p>
                        <p className="text-sm text-slate-400">{customer.email}</p>
                        <p className="text-sm text-slate-400">
                          Joined: {formatDate(customer.created_at)}
                        </p>
                        {customer.last_visit && (
                          <p className="text-sm text-slate-400">
                            Last visit: {formatDate(customer.last_visit)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white text-gradient">{customer.points_balance} points</p>
                        <p className="text-sm text-slate-400">
                          ${customer.total_spending.toFixed(2)} spent
                        </p>
                        <p className="text-sm text-slate-400">
                          {customer.visit_count} visits
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promotions */}
          <TabsContent value="promotions">
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="heading-secondary">Campaign Management</span>
                  <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" onClick={() => setIsPromotionDialogOpen(true)} className="btn-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Promotion
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card text-white">
                      <DialogHeader>
                        <DialogTitle className="heading-secondary">Create New Promotion</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Create a targeted promotion for your customers
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title" className="text-white">Title</Label>
                          <Input
                            id="title"
                            value={promotionForm.title}
                            onChange={(e) => setPromotionForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Double Points Weekend"
                            className="modern-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-white">Description</Label>
                          <Input
                            id="description"
                            value={promotionForm.description}
                            onChange={(e) => setPromotionForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe the promotion details"
                            className="modern-input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate" className="text-white">Start Date</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={promotionForm.startDate}
                              onChange={(e) => setPromotionForm(prev => ({ ...prev, startDate: e.target.value }))}
                              className="modern-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="endDate" className="text-white">End Date</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={promotionForm.endDate}
                              onChange={(e) => setPromotionForm(prev => ({ ...prev, endDate: e.target.value }))}
                              className="modern-input"
                            />
                          </div>
                        </div>
                        <Button onClick={createPromotion} className="w-full btn-success">
                          <Send className="h-4 w-4 mr-2" />
                          Create Promotion
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Create and manage promotional campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-slate-400 py-8">
                  Use the "Create Promotion" button to start a new campaign
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="settings">
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  System Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure point earning and redemption rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="pointsPerDollar" className="text-white">Points per Dollar Spent</Label>
                    <Input
                      id="pointsPerDollar"
                      type="number"
                      step="0.1"
                      value={systemConfig.points_per_dollar}
                      onChange={(e) => setSystemConfig(prev => ({ 
                        ...prev, 
                        points_per_dollar: parseFloat(e.target.value) || 0 
                      }))}
                      className="modern-input"
                    />
                    <p className="text-sm text-slate-400 mt-1">
                      How many points customers earn per dollar spent
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="pointValue" className="text-white">Point Redemption Value</Label>
                    <Input
                      id="pointValue"
                      type="number"
                      step="0.001"
                      value={systemConfig.points_per_dollar_value}
                      onChange={(e) => setSystemConfig(prev => ({ 
                        ...prev, 
                        points_per_dollar_value: parseFloat(e.target.value) || 0 
                      }))}
                      className="modern-input"
                    />
                    <p className="text-sm text-slate-400 mt-1">
                      Dollar value of each point when redeemed
                    </p>
                  </div>
                </div>
                
                <div className="p-4 notification-info rounded-lg">
                  <h4 className="font-medium mb-2 text-white">Current Configuration:</h4>
                  <p className="text-sm text-slate-300">
                    • Customers earn {systemConfig.points_per_dollar} point(s) per $1 spent
                  </p>
                  <p className="text-sm text-slate-300">
                    • Each point is worth ${systemConfig.points_per_dollar_value.toFixed(3)} when redeemed
                  </p>
                  <p className="text-sm text-slate-300">
                    • 100 points = ${(100 * systemConfig.points_per_dollar_value).toFixed(2)} cash value
                  </p>
                </div>

                <Button onClick={updateSystemConfig} className="btn-primary">
                  Update Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}