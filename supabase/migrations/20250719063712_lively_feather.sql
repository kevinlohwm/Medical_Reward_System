/*
  # Create MedRewards Database Schema

  1. New Tables
    - `clinics`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text - aesthetic/medical/dental)
      - `address` (text)
      - `phone` (text)
      - `email` (text)
      - `operating_hours` (text)
      - `services` (text array)
      - `created_at` (timestamp)
    
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `name` (text)
      - `phone_number` (text, optional)
      - `points_balance` (integer, default 0)
      - `role` (text, default 'customer')
      - `clinic_id` (uuid, references clinics, optional)
      - `two_factor_enabled` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `clinic_id` (uuid, references clinics)
      - `bill_amount` (numeric)
      - `points_earned` (integer)
      - `created_at` (timestamp)
    
    - `redemptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `clinic_id` (uuid, references clinics)
      - `points_redeemed` (integer)
      - `cash_value_offset` (numeric)
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
    
    - `system_config`
      - `id` (uuid, primary key)
      - `points_per_dollar` (numeric, default 1)
      - `points_per_dollar_value` (numeric, default 0.01)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    - Add policies for staff to manage clinic data
    - Add policies for admins to manage system data
*/

-- Create clinics table first (referenced by users table)
CREATE TABLE IF NOT EXISTS public.clinics (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('aesthetic', 'medical', 'dental')),
    address text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    operating_hours text NOT NULL,
    services text[] NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email text NOT NULL,
    name text NOT NULL,
    phone_number text,
    points_balance integer DEFAULT 0 NOT NULL,
    role text DEFAULT 'customer' NOT NULL CHECK (role IN ('customer', 'staff', 'admin')),
    clinic_id uuid REFERENCES public.clinics(id),
    two_factor_enabled boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    bill_amount numeric(10,2) NOT NULL,
    points_earned integer NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create redemptions table
CREATE TABLE IF NOT EXISTS public.redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    points_redeemed integer NOT NULL,
    cash_value_offset numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL,
    target_segment_criteria jsonb NOT NULL DEFAULT '{}',
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    points_per_dollar numeric(5,2) DEFAULT 1.00 NOT NULL,
    points_per_dollar_value numeric(5,4) DEFAULT 0.0100 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Staff can view users in their clinic
CREATE POLICY "Staff can view clinic users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users staff_user
            WHERE staff_user.id = auth.uid()
            AND staff_user.role = 'staff'
            AND staff_user.clinic_id = users.clinic_id
        )
    );

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON public.users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
        )
    );

-- Clinics table policies
CREATE POLICY "Anyone can view clinics"
    ON public.clinics
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage clinics"
    ON public.clinics
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
        )
    );

-- Transactions table policies
CREATE POLICY "Users can view their own transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Staff can view clinic transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users staff_user
            WHERE staff_user.id = auth.uid()
            AND staff_user.role IN ('staff', 'admin')
            AND staff_user.clinic_id = transactions.clinic_id
        )
    );

CREATE POLICY "Staff can insert clinic transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users staff_user
            WHERE staff_user.id = auth.uid()
            AND staff_user.role IN ('staff', 'admin')
            AND staff_user.clinic_id = clinic_id
        )
    );

-- Redemptions table policies
CREATE POLICY "Users can view their own redemptions"
    ON public.redemptions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Staff can view clinic redemptions"
    ON public.redemptions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users staff_user
            WHERE staff_user.id = auth.uid()
            AND staff_user.role IN ('staff', 'admin')
            AND staff_user.clinic_id = redemptions.clinic_id
        )
    );

CREATE POLICY "Staff can insert clinic redemptions"
    ON public.redemptions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users staff_user
            WHERE staff_user.id = auth.uid()
            AND staff_user.role IN ('staff', 'admin')
            AND staff_user.clinic_id = clinic_id
        )
    );

-- Promotions table policies
CREATE POLICY "Anyone can view active promotions"
    ON public.promotions
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage promotions"
    ON public.promotions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
        )
    );

-- System config table policies
CREATE POLICY "Anyone can view system config"
    ON public.system_config
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage system config"
    ON public.system_config
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
        )
    );

-- Insert default system configuration
INSERT INTO public.system_config (points_per_dollar, points_per_dollar_value)
VALUES (1.00, 0.0100)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON public.users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON public.transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON public.redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_clinic_id ON public.redemptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);