import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { QrCode, Gift, MapPin, Clock, Phone, Mail, Star, History, Award } from 'lucide-react'
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
        const url = await QRCode.toDataURL(qrData)
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
        return '💄'
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-primary/10 to-emerald-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-tr from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome back, {profile?.name}! 👋
            </h1>
            <p className="text-gray-600 text-lg">Manage your rewards and explore our clinics</p>
          </div>
          <Button onClick={signOut} className="btn-secondary">
            Sign Out
          </Button>
        </div>

        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <Card className="gradient-primary text-white border-0 shadow-xl shadow-primary/25 card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Points Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{profile?.points_balance || 0}</div>
              <p className="text-white/80 text-lg">Cash Value: ${((profile?.points_balance || 0) / 100).toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-xl card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900 mb-2">{transactions.length}</div>
              <p className="text-muted-foreground">Lifetime visits</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-xl card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Points Redeemed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {redemptions.reduce((sum, r) => sum + r.points_redeemed, 0)}
              </div>
              <p className="text-muted-foreground">Total savings: ${redemptions.reduce((sum, r) => sum + r.cash_value_offset, 0).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="qr-code" className="space-y-6 animate-fade-in">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <TabsTrigger value="qr-code">QR Code</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr-code">
            <Card className="glass-effect border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Your Digital Loyalty Card
                </CardTitle>
                <CardDescription>
                  Show this QR code to clinic staff to earn and redeem points
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                {qrCodeUrl && (
                  <div className="bg-white p-8 rounded-2xl shadow-2xl shadow-black/10 border border-gray-100">
                    <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56" />
                  </div>
                )}
                <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                  <p className="font-semibold text-lg text-gray-900">{profile?.name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <p className="text-sm text-muted-foreground">ID: {profile?.id.slice(0, 8)}...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-6">
              <Card className="glass-effect border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>Points earned from your visits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-muted-foreground text-lg">No transactions yet</p>
                        <p className="text-sm text-muted-foreground">Visit one of our clinics to start earning points!</p>
                      </div>
                    ) : (
                      transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-6 border border-gray-200 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getClinicTypeIcon(transaction.clinics.type)}</div>
                            <div>
                              <p className="font-semibold text-gray-900">{transaction.clinics.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-success text-lg">+{transaction.points_earned} points</p>
                            <p className="text-sm text-muted-foreground">${transaction.bill_amount.toFixed(2)} spent</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Redemption History
                  </CardTitle>
                  <CardDescription>Points you've redeemed for savings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {redemptions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Gift className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-muted-foreground text-lg">No redemptions yet</p>
                        <p className="text-sm text-muted-foreground">Start redeeming your points for great savings!</p>
                      </div>
                    ) : (
                      redemptions.map((redemption) => (
                        <div key={redemption.id} className="flex items-center justify-between p-6 border border-gray-200 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getClinicTypeIcon(redemption.clinics.type)}</div>
                            <div>
                              <p className="font-semibold text-gray-900">{redemption.clinics.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(redemption.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-destructive text-lg">-{redemption.points_redeemed} points</p>
                            <p className="text-sm text-muted-foreground">${redemption.cash_value_offset.toFixed(2)} saved</p>
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
            <Card className="glass-effect border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Active Promotions
                </CardTitle>
                <CardDescription>Special offers and bonus point opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promotions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-muted-foreground text-lg">No active promotions</p>
                      <p className="text-sm text-muted-foreground">Check back soon for exciting offers!</p>
                    </div>
                  ) : (
                    promotions.map((promotion) => (
                      <div key={promotion.id} className="p-6 border border-yellow-200 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                            <Star className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-gray-900 mb-2">{promotion.title}</h3>
                        <p className="text-muted-foreground mt-1">{promotion.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>Valid until: {new Date(promotion.end_date).toLocaleDateString()}</span>
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
            <Card className="glass-effect border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Our Clinic Locations
                </CardTitle>
                <CardDescription>Find and visit our clinic locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clinics.map((clinic) => (
                    <div key={clinic.id} className="p-6 border border-gray-200 rounded-xl bg-white/50 hover:bg-white/80 hover:shadow-lg transition-all duration-200 card-hover">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl">
                          {getClinicTypeIcon(clinic.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 mb-1">{clinic.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize mb-2">{clinic.type} Clinic</p>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span>{clinic.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-primary" />
                              <span>{clinic.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-primary" />
                              <span>{clinic.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{clinic.operating_hours}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm font-semibold mb-2 text-gray-900">Services:</p>
                            <div className="flex flex-wrap gap-1">
                              {clinic.services.map((service, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium"
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