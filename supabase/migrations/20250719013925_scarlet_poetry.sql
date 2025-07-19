/*
  # Medical Reward System Database Schema

  1. New Tables
    - `users` - Customer and staff profiles with role-based access
    - `clinics` - 7 clinic locations with details and services
    - `transactions` - Point earning history from customer visits
    - `redemptions` - Point redemption history for cash savings
    - `promotions` - Marketing campaigns and special offers
    - `system_config` - Configurable point earning and redemption rates

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Customers can only access their own data
    - Staff can access clinic-specific data
    - Admins have full access

  3. Sample Data
    - 7 pre-populated clinic locations
    - Default system configuration
    - Sample promotional campaigns
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone_number text,
  points_balance integer DEFAULT 0,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  clinic_id uuid REFERENCES clinics(id),
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('aesthetic', 'medical', 'dental')),
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  operating_hours text NOT NULL,
  services text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  bill_amount decimal(10,2) NOT NULL,
  points_earned integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  points_redeemed integer NOT NULL,
  cash_value_offset decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  target_segment_criteria jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
  id text PRIMARY KEY DEFAULT '1',
  points_per_dollar decimal(5,2) DEFAULT 1.0,
  points_per_dollar_value decimal(5,3) DEFAULT 0.01,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Staff can read customers"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );

-- Clinics policies
CREATE POLICY "Anyone can read clinics"
  ON clinics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage clinics"
  ON clinics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );

-- Transactions policies
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can read clinic transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role IN ('staff', 'admin')
      AND (staff_user.role = 'admin' OR staff_user.clinic_id = transactions.clinic_id)
    )
  );

CREATE POLICY "Staff can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role IN ('staff', 'admin')
      AND (staff_user.role = 'admin' OR staff_user.clinic_id = clinic_id)
    )
  );

-- Redemptions policies
CREATE POLICY "Users can read own redemptions"
  ON redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can read clinic redemptions"
  ON redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role IN ('staff', 'admin')
      AND (staff_user.role = 'admin' OR staff_user.clinic_id = redemptions.clinic_id)
    )
  );

CREATE POLICY "Staff can create redemptions"
  ON redemptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role IN ('staff', 'admin')
      AND (staff_user.role = 'admin' OR staff_user.clinic_id = clinic_id)
    )
  );

-- Promotions policies
CREATE POLICY "Anyone can read active promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );

-- System config policies
CREATE POLICY "Anyone can read system config"
  ON system_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage system config"
  ON system_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );

-- Insert sample clinics
INSERT INTO clinics (name, type, address, phone, email, operating_hours, services) VALUES
  (
    'Downtown Medical Center',
    'medical',
    '123 Main Street, Downtown, City 12345',
    '(555) 123-4567',
    'info@downtownmedical.com',
    'Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 2:00 PM',
    ARRAY['General Medicine', 'Cardiology', 'Internal Medicine', 'Preventive Care']
  ),
  (
    'Aesthetic Beauty Clinic',
    'aesthetic',
    '456 Beauty Boulevard, Uptown, City 12346',
    '(555) 234-5678',
    'hello@aestheticbeauty.com',
    'Mon-Sat: 9:00 AM - 7:00 PM, Sun: 10:00 AM - 4:00 PM',
    ARRAY['Botox', 'Dermal Fillers', 'Laser Treatments', 'Skin Rejuvenation', 'Chemical Peels']
  ),
  (
    'Smile Dental Care',
    'dental',
    '789 Dental Drive, Midtown, City 12347',
    '(555) 345-6789',
    'appointments@smiledentalcare.com',
    'Mon-Thu: 8:00 AM - 5:00 PM, Fri: 8:00 AM - 3:00 PM',
    ARRAY['General Dentistry', 'Teeth Cleaning', 'Fillings', 'Root Canal', 'Orthodontics']
  ),
  (
    'Westside Medical Plaza',
    'medical',
    '321 West Avenue, Westside, City 12348',
    '(555) 456-7890',
    'contact@westsidemedical.com',
    'Mon-Fri: 7:00 AM - 8:00 PM, Sat-Sun: 9:00 AM - 5:00 PM',
    ARRAY['Emergency Care', 'Family Medicine', 'Pediatrics', 'Women\'s Health']
  ),
  (
    'Elite Aesthetic Studio',
    'aesthetic',
    '654 Luxury Lane, Elite District, City 12349',
    '(555) 567-8901',
    'book@eliteaesthetic.com',
    'Tue-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 5:00 PM',
    ARRAY['Advanced Facials', 'Micro-needling', 'Body Contouring', 'Anti-aging Treatments']
  ),
  (
    'Family Dental Group',
    'dental',
    '987 Family Circle, Suburban, City 12350',
    '(555) 678-9012',
    'info@familydentalgroup.com',
    'Mon-Wed: 8:00 AM - 6:00 PM, Thu-Fri: 8:00 AM - 4:00 PM',
    ARRAY['Family Dentistry', 'Cosmetic Dentistry', 'Implants', 'Whitening', 'Oral Surgery']
  ),
  (
    'Comprehensive Health Center',
    'medical',
    '147 Health Way, Medical District, City 12351',
    '(555) 789-0123',
    'care@comprehensivehealth.com',
    'Mon-Sun: 24/7 Emergency, Regular Hours: Mon-Fri 6:00 AM - 10:00 PM',
    ARRAY['Emergency Medicine', 'Urgent Care', 'Specialist Referrals', 'Diagnostic Services', 'Pharmacy']
  );

-- Insert default system configuration
INSERT INTO system_config (id, points_per_dollar, points_per_dollar_value) VALUES
  ('1', 1.0, 0.01)
ON CONFLICT (id) DO NOTHING;

-- Insert sample promotions
INSERT INTO promotions (title, description, start_date, end_date, target_segment_criteria, is_active) VALUES
  (
    'Welcome Bonus - Double Points',
    'New members earn 2x points on their first visit to any clinic!',
    now(),
    now() + interval '30 days',
    '{"new_member": true}',
    true
  ),
  (
    'Dental Health Month',
    'Earn 50% bonus points on all dental services during National Dental Health Month.',
    now(),
    now() + interval '30 days',
    '{"clinic_type": "dental"}',
    true
  ),
  (
    'Aesthetic Summer Special',
    'Get 25% bonus points on aesthetic treatments. Perfect time for your summer glow-up!',
    now(),
    now() + interval '60 days',
    '{"clinic_type": "aesthetic"}',
    true
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_clinic_id ON redemptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for system_config table
CREATE TRIGGER update_system_config_updated_at 
  BEFORE UPDATE ON system_config 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();