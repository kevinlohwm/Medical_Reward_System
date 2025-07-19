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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.name}!</h1>
            <p className="text-gray-600">Manage your rewards and explore our clinics</p>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Points Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profile?.points_balance || 0}</div>
              <p className="text-blue-100">Cash Value: ${((profile?.points_balance || 0) / 100).toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{transactions.length}</div>
              <p className="text-muted-foreground">Lifetime visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Points Redeemed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {redemptions.reduce((sum, r) => sum + r.points_redeemed, 0)}
              </div>
              <p className="text-muted-foreground">Total savings: ${redemptions.reduce((sum, r) => sum + r.cash_value_offset, 0).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="qr-code" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="qr-code">QR Code</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr-code">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Your Digital Loyalty Card
                </CardTitle>
                <CardDescription>
                  Show this QR code to clinic staff to earn and redeem points
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                {qrCodeUrl && (
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-medium">{profile?.name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <p className="text-sm text-muted-foreground">ID: {profile?.id.slice(0, 8)}...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Points earned from your visits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                    ) : (
                      transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getClinicTypeIcon(transaction.clinics.type)}</div>
                            <div>
                              <p className="font-medium">{transaction.clinics.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">+{transaction.points_earned} points</p>
                            <p className="text-sm text-muted-foreground">${transaction.bill_amount.toFixed(2)} spent</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Redemption History</CardTitle>
                  <CardDescription>Points you've redeemed for savings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {redemptions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No redemptions yet</p>
                    ) : (
                      redemptions.map((redemption) => (
                        <div key={redemption.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getClinicTypeIcon(redemption.clinics.type)}</div>
                            <div>
                              <p className="font-medium">{redemption.clinics.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(redemption.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-600">-{redemption.points_redeemed} points</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Active Promotions
                </CardTitle>
                <CardDescription>Special offers and bonus point opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promotions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No active promotions</p>
                  ) : (
                    promotions.map((promotion) => (
                      <div key={promotion.id} className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                        <h3 className="font-semibold text-lg">{promotion.title}</h3>
                        <p className="text-muted-foreground mt-1">{promotion.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>Valid until: {new Date(promotion.end_date).toLocaleDateString()}</span>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Our Clinic Locations
                </CardTitle>
                <CardDescription>Find and visit our 7 clinic locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clinics.map((clinic) => (
                    <div key={clinic.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{getClinicTypeIcon(clinic.type)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{clinic.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize mb-2">{clinic.type} Clinic</p>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{clinic.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{clinic.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{clinic.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{clinic.operating_hours}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Services:</p>
                            <div className="flex flex-wrap gap-1">
                              {clinic.services.map((service, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
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