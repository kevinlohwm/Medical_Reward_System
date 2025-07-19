import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { QrCode, Gift, MapPin, Clock, Phone, Mail, Star, History, Award, TrendingUp, Calendar } from 'lucide-react'
import QRCode from 'qrcode'

interface Transaction {
  id: string
  bill_amount: number
  points_earned: number
  created_at: string
  clinics: {
    name: string
    type: string
  }
}

interface Redemption {
  id: string
  points_redeemed: number
  cash_value_offset: number
  created_at: string
  clinics: {
    name: string
    type: string
  }
}

interface Clinic {
  id: string
  name: string
  type: string
  address: string
  phone: string
  email: string
  operating_hours: string
  services: string[]
}

interface Promotion {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
}

export function CustomerDashboard() {
  const { profile, signOut } = useAuth()
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      generateQRCode()
      fetchData()
    }
  }, [profile])

  const generateQRCode = async () => {
    if (profile) {
      try {
        const qrData = JSON.stringify({
          userId: profile.id,
          email: profile.email,
          name: profile.name
        })
        const url = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        })
        setQrCodeUrl(url)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }
  }

  const fetchData = async () => {
    try {
      // Fetch transactions
      const { data: transactionData } = await supabase
        .from('transactions')
        .select(`
          *,
          clinics (name, type)
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })

      // Fetch redemptions
      const { data: redemptionData } = await supabase
        .from('redemptions')
        .select(`
          *,
          clinics (name, type)
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })

      // Fetch clinics
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('*')
        .order('name')

      // Fetch active promotions
      const { data: promotionData } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })

      setTransactions(transactionData || [])
      setRedemptions(redemptionData || [])
      setClinics(clinicData || [])
      setPromotions(promotionData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getClinicTypeIcon = (type: string) => {
    switch (type) {
      case 'aesthetic':
        return '✨'
      case 'medical':
        return '🏥'
      case 'dental':
        return '🦷'
      default:
        return '🏥'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 modern-spinner mx-auto mb-4"></div>
          <p className="text-white text-xl font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 heading-primary">
              Welcome back, {profile?.name}! 👋
            </h1>
            <p className="text-slate-400 text-xl">Manage your rewards and explore benefits</p>
          </div>
          <Button onClick={signOut} className="btn-danger">
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          <Card className="stats-card text-white border-0 shadow-2xl interactive-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Award className="h-6 w-6 text-blue-400" />
                Points Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold mb-2 text-gradient">{profile?.points_balance || 0}</div>
              <p className="text-slate-300 text-lg">
                Cash Value: ${((profile?.points_balance || 0) * 0.01).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card-success text-white border-0 shadow-2xl interactive-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <TrendingUp className="h-6 w-6 text-green-400" />
                Total Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold mb-2 text-gradient">{transactions.length}</div>
              <p className="text-slate-300 text-lg">Lifetime transactions</p>
            </CardContent>
          </Card>

          <Card className="stats-card-warning text-white border-0 shadow-2xl interactive-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Gift className="h-6 w-6 text-yellow-400" />
                Total Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold mb-2 text-gradient">
                ${redemptions.reduce((sum, r) => sum + r.cash_value_offset, 0).toFixed(0)}
              </div>
              <p className="text-slate-300 text-lg">
                {redemptions.reduce((sum, r) => sum + r.points_redeemed, 0)} points redeemed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="qr-code" className="space-y-6 animate-scale-in">
          <TabsList className="nav-tabs grid w-full grid-cols-4">
            <TabsTrigger value="qr-code" className="nav-tab">
              <QrCode className="h-5 w-5 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="history" className="nav-tab">
              <History className="h-5 w-5 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="promotions" className="nav-tab">
              <Star className="h-5 w-5 mr-2" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="clinics" className="nav-tab">
              <MapPin className="h-5 w-5 mr-2" />
              Clinics
            </TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr-code">
            <Card className="glass-card text-white">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl heading-secondary">
                  <QrCode className="h-7 w-7 text-blue-400" />
                  Your Digital Loyalty Card
                </CardTitle>
                <CardDescription className="text-lg text-slate-400">
                  Show this QR code to clinic staff to earn and redeem points
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                {qrCodeUrl && (
                  <div className="qr-container animate-scale-in animate-pulse-glow">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                )}
                <div className="text-center glass-card p-8 rounded-2xl w-full max-w-md">
                  <p className="font-bold text-2xl text-white mb-2 text-gradient">{profile?.name}</p>
                  <p className="text-slate-300 text-lg mb-1">{profile?.email}</p>
                  <p className="text-slate-400">Member ID: {profile?.id.slice(0, 8)}...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-6">
              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl heading-secondary">
                    <History className="h-7 w-7 text-green-400" />
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-lg text-slate-400">
                    Points earned from your visits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mx-auto mb-6">
                          <History className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-slate-300 text-xl mb-2">No transactions yet</p>
                        <p className="text-slate-400">Visit one of our clinics to start earning points!</p>
                      </div>
                    ) : (
                      transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-6 glass-card rounded-2xl shadow-lg interactive-card">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 stats-card-success rounded-xl flex items-center justify-center text-2xl">
                              {getClinicTypeIcon(transaction.clinics.type)}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-white">{transaction.clinics.name}</p>
                              <p className="text-slate-400 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(transaction.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-2xl text-green-400 text-gradient">+{transaction.points_earned}</p>
                            <p className="text-slate-400">${transaction.bill_amount.toFixed(2)} spent</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl heading-secondary">
                    <Gift className="h-7 w-7 text-purple-400" />
                    Redemption History
                  </CardTitle>
                  <CardDescription className="text-lg text-slate-400">
                    Points you've redeemed for savings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {redemptions.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mx-auto mb-6">
                          <Gift className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-slate-300 text-xl mb-2">No redemptions yet</p>
                        <p className="text-slate-400">Start redeeming your points for great savings!</p>
                      </div>
                    ) : (
                      redemptions.map((redemption) => (
                        <div key={redemption.id} className="flex items-center justify-between p-6 glass-card rounded-2xl shadow-lg interactive-card">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 stats-card-danger rounded-xl flex items-center justify-center text-2xl">
                              {getClinicTypeIcon(redemption.clinics.type)}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-white">{redemption.clinics.name}</p>
                              <p className="text-slate-400 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(redemption.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-2xl text-red-400 text-gradient">-{redemption.points_redeemed}</p>
                            <p className="text-slate-400">${redemption.cash_value_offset.toFixed(2)} saved</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions">
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl heading-secondary">
                  <Star className="h-7 w-7 text-yellow-400" />
                  Active Promotions
                </CardTitle>
                <CardDescription className="text-lg text-slate-400">
                  Special offers and bonus point opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {promotions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center mx-auto mb-6">
                        <Star className="h-10 w-10 text-slate-400" />
                      </div>
                      <p className="text-slate-300 text-xl mb-2">No active promotions</p>
                      <p className="text-slate-400">Check back soon for exciting offers!</p>
                    </div>
                  ) : (
                    promotions.map((promotion) => (
                      <div key={promotion.id} className="p-8 stats-card-warning rounded-2xl shadow-xl interactive-card">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 stats-card rounded-2xl flex items-center justify-center shadow-lg">
                            <Star className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-2xl text-white mb-3 text-gradient">{promotion.title}</h3>
                            <p className="text-slate-300 text-lg mb-4">{promotion.description}</p>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Calendar className="h-5 w-5" />
                              <span className="font-medium">Valid until: {new Date(promotion.end_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinics Tab */}
          <TabsContent value="clinics">
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl heading-secondary">
                  <MapPin className="h-7 w-7 text-red-400" />
                  Our Clinic Locations
                </CardTitle>
                <CardDescription className="text-lg text-slate-400">
                  Find and visit our clinic locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clinics.map((clinic) => (
                    <div key={clinic.id} className="p-8 glass-card rounded-2xl shadow-xl interactive-card">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 stats-card rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                          {getClinicTypeIcon(clinic.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-2xl text-white mb-2 text-gradient">{clinic.name}</h3>
                          <p className="text-blue-400 font-semibold capitalize mb-4 text-lg">{clinic.type} Clinic</p>
                          
                          <div className="space-y-3 text-slate-300">
                            <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5 text-red-400" />
                              <span>{clinic.address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5 text-green-400" />
                              <span>{clinic.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-blue-400" />
                              <span>{clinic.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-purple-400" />
                              <span>{clinic.operating_hours}</span>
                            </div>
                          </div>

                          <div className="mt-6">
                            <p className="font-bold text-white mb-3">Services:</p>
                            <div className="flex flex-wrap gap-2">
                              {clinic.services.map((service, index) => (
                                <span
                                  key={index}
                                  className="px-4 py-2 stats-card text-white text-sm rounded-xl font-semibold"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}