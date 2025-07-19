/*
  # Medical Reward System Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone_number` (text)
      - `points_balance` (integer, default 0)
      - `two_factor_enabled` (boolean, default false)
      - `two_factor_secret` (text, nullable)
      - `role` (enum: customer, staff, admin)
      - `clinic_id` (uuid, foreign key to clinics, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `clinics`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (enum: aesthetic, medical, dental)
      - `address` (text)
      - `contact_info` (text)
      - `operating_hours` (text)
      - `services` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `clinic_id` (uuid, foreign key to clinics)
      - `bill_amount` (decimal)
      - `points_earned` (integer)
      - `created_at` (timestamp)

    - `redemptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `clinic_id` (uuid, foreign key to clinics)
      - `points_redeemed` (integer)
      - `cash_value_offset` (decimal)
      - `created_at` (timestamp)

    - `promotions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `target_segment_criteria` (jsonb)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `system_config`
      - `id` (uuid, primary key)
      - `point_earning_rate` (decimal, default 1.0)
      - `redemption_rate` (integer, default 100)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Customers can only access their own data
    - Staff can access customers and transactions for their clinic
    - Admins have full access
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
CREATE TYPE clinic_type AS ENUM ('aesthetic', 'medical', 'dental');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text NOT NULL,
  points_balance integer DEFAULT 0,
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text,
  role user_role DEFAULT 'customer',
  clinic_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type clinic_type NOT NULL,
  address text NOT NULL,
  contact_info text NOT NULL,
  operating_hours text NOT NULL,
  services text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  point_earning_rate decimal(5,2) DEFAULT 1.0,
  redemption_rate integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for clinic_id in users table
ALTER TABLE users ADD CONSTRAINT fk_users_clinic_id 
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_clinic_id ON redemptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON redemptions(created_at);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Staff can read customers"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff can update customer points"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for clinics table
CREATE POLICY "Anyone can read clinics"
  ON clinics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage clinics"
  ON clinics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for transactions table
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can read clinic transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND (
        staff_user.role = 'admin' OR 
        (staff_user.role = 'staff' AND staff_user.clinic_id = transactions.clinic_id)
      )
    )
  );

CREATE POLICY "Staff can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND (
        staff_user.role = 'admin' OR 
        (staff_user.role = 'staff' AND staff_user.clinic_id = clinic_id)
      )
    )
  );

-- RLS Policies for redemptions table
CREATE POLICY "Users can read own redemptions"
  ON redemptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can read clinic redemptions"
  ON redemptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND (
        staff_user.role = 'admin' OR 
        (staff_user.role = 'staff' AND staff_user.clinic_id = redemptions.clinic_id)
      )
    )
  );

CREATE POLICY "Staff can create redemptions"
  ON redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND (
        staff_user.role = 'admin' OR 
        (staff_user.role = 'staff' AND staff_user.clinic_id = clinic_id)
      )
    )
  );

-- RLS Policies for promotions table
CREATE POLICY "Anyone can read active promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for system_config table
CREATE POLICY "Anyone can read system config"
  ON system_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage system config"
  ON system_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Insert default system configuration
INSERT INTO system_config (point_earning_rate, redemption_rate) 
VALUES (1.0, 100)
ON CONFLICT DO NOTHING;

-- Insert sample clinics
INSERT INTO clinics (name, type, address, contact_info, operating_hours, services) VALUES
('Downtown Medical Center', 'medical', '123 Main St, Downtown', 'Phone: (555) 123-4567', 'Mon-Fri: 8AM-6PM, Sat: 9AM-2PM', ARRAY['General Medicine', 'Cardiology', 'Dermatology']),
('Aesthetic Beauty Clinic', 'aesthetic', '456 Beauty Ave, Uptown', 'Phone: (555) 234-5678', 'Mon-Sat: 9AM-7PM', ARRAY['Botox', 'Fillers', 'Laser Treatments', 'Facials']),
('Family Dental Practice', 'dental', '789 Smile Blvd, Midtown', 'Phone: (555) 345-6789', 'Mon-Fri: 7AM-5PM', ARRAY['Cleanings', 'Fillings', 'Crowns', 'Orthodontics']),
('Westside Medical Group', 'medical', '321 West St, Westside', 'Phone: (555) 456-7890', 'Mon-Fri: 8AM-6PM', ARRAY['Family Medicine', 'Pediatrics', 'Women\'s Health']),
('Elite Aesthetic Center', 'aesthetic', '654 Luxury Lane, Elite District', 'Phone: (555) 567-8901', 'Tue-Sat: 10AM-8PM', ARRAY['CoolSculpting', 'Microneedling', 'Chemical Peels']),
('Bright Smile Dentistry', 'dental', '987 Dental Dr, Suburbia', 'Phone: (555) 678-9012', 'Mon-Thu: 8AM-6PM, Fri: 8AM-4PM', ARRAY['Cosmetic Dentistry', 'Implants', 'Whitening']),
('Eastside Health Clinic', 'medical', '147 East Ave, Eastside', 'Phone: (555) 789-0123', 'Mon-Fri: 7AM-7PM, Sat: 8AM-4PM', ARRAY['Urgent Care', 'Lab Services', 'Vaccinations'])
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();