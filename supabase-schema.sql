-- ============================================================
-- NexTool Database Schema — Supabase PostgreSQL
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. CUSTOMERS (CRM)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  source TEXT DEFAULT 'website',
  notes TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'power')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned')),
  stripe_customer_id TEXT UNIQUE,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. ORDERS
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'in_progress', 'preview_sent', 'completed', 'cancelled', 'refunded')),
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  description TEXT,
  delivery_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Auto-generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'NXT-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                      LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('pro_monthly', 'pro_annual', 'power_monthly', 'power_annual')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. FINANCES
CREATE TABLE finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  tax_relevant BOOLEAN DEFAULT true,
  receipt_url TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_finances_type ON finances(type);
CREATE INDEX idx_finances_date ON finances(date);
CREATE INDEX idx_finances_category ON finances(category);

ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- Monthly summary view
CREATE VIEW monthly_summary AS
SELECT
  DATE_TRUNC('month', date) AS month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS profit
FROM finances
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- 5. ANIMA DOWNLOADS
CREATE TABLE anima_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')),
  model TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anima_tier ON anima_downloads(tier);

ALTER TABLE anima_downloads ENABLE ROW LEVEL SECURITY;

-- 6. EMAILS SENT
CREATE TABLE emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'bounced', 'failed')),
  resend_id TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emails_customer ON emails_sent(customer_id);
CREATE INDEX idx_emails_template ON emails_sent(template);

ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;

-- 7. ACTIVITY LOG (for admin dashboard)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — Admin has full access via service_role key
-- Public (anon) has no access by default
-- ============================================================

-- Customers: Only service_role
CREATE POLICY "Service role full access" ON customers FOR ALL
  USING (auth.role() = 'service_role');

-- Orders: Only service_role
CREATE POLICY "Service role full access" ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- Subscriptions: Only service_role
CREATE POLICY "Service role full access" ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Finances: Only service_role
CREATE POLICY "Service role full access" ON finances FOR ALL
  USING (auth.role() = 'service_role');

-- Anima downloads: Anon can INSERT (tracking), service_role can read all
CREATE POLICY "Anon can track downloads" ON anima_downloads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role full access" ON anima_downloads FOR ALL
  USING (auth.role() = 'service_role');

-- Emails: Only service_role
CREATE POLICY "Service role full access" ON emails_sent FOR ALL
  USING (auth.role() = 'service_role');

-- Activity: Only service_role
CREATE POLICY "Service role full access" ON activity_log FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamp)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DONE! Your NexTool database is ready.
-- ============================================================
