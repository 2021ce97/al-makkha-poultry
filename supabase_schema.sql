-- ==========================================================
-- AL-MAKKAH POULTRY FEED MANUFACTURING DATABASE SCHEMA
-- شرکت تولیدی دانه مرغ المکه - سکیما برای Supabase (PostgreSQL)
-- ==========================================================

-- 1. Table: factory_settings / backup state (Singular state backup table)
CREATE TABLE IF NOT EXISTS factory_settings (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: raw_materials (مواد اولیه و زېرمه)
CREATE TABLE IF NOT EXISTS raw_materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock_kg NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  supplier_id TEXT,
  supplier_name TEXT,
  date_added TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Table: suppliers (تأمین کنندگان و حساب باقیات)
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  total_purchased_amount NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  balance_owed NUMERIC NOT NULL DEFAULT 0,
  transactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Table: formulas (فورمول های ساخت دانه)
CREATE TABLE IF NOT EXISTS formulas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_weight_kg NUMERIC NOT NULL DEFAULT 0,
  total_batch_cost NUMERIC NOT NULL DEFAULT 0,
  cost_per_kg NUMERIC NOT NULL DEFAULT 0,
  created_date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Table: production_batches (دوره های تولید شده)
CREATE TABLE IF NOT EXISTS production_batches (
  id TEXT PRIMARY KEY,
  formula_id TEXT NOT NULL,
  formula_name TEXT NOT NULL,
  date TEXT NOT NULL,
  total_weight_kg NUMERIC NOT NULL DEFAULT 0,
  cost_per_kg NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  operator_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Table: processed_stock (دانه‌های آماده در گدام)
CREATE TABLE IF NOT EXISTS processed_stock (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  formula_id TEXT,
  stock_kg NUMERIC NOT NULL DEFAULT 0,
  average_cost_per_kg NUMERIC NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Table: customers (مشتریان و حساب باقیات قرضداری)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  total_purchased_amount NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  balance_owed NUMERIC NOT NULL DEFAULT 0,
  transactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Table: sales (بل های فروشات دانه)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'bag',
  unit_quantity NUMERIC NOT NULL DEFAULT 1,
  quantity_kg NUMERIC NOT NULL DEFAULT 50,
  sale_price_per_unit NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  cost_rate_per_kg NUMERIC NOT NULL DEFAULT 0,
  total_cost_of_goods NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Table: expenses (مصارف روزمره، تیل، معاشات و کرایه)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY (RLS) FOR PROTECTION
ALTER TABLE factory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write (public access policy with anon key for easy prototyping & staff usage)
CREATE POLICY "Allow anon all on factory_settings" ON factory_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on raw_materials" ON raw_materials FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on suppliers" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on formulas" ON formulas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on production_batches" ON production_batches FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on processed_stock" ON processed_stock FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on customers" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on sales" ON sales FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on expenses" ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);
