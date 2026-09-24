-- Al-Makkah Poultry Feed: Supabase schema and persistence migration
-- Run this once in Supabase Dashboard -> SQL Editor -> New query.
-- It is safe to run on the current project: existing rows are not deleted.

create table if not exists public.suppliers (
  id text primary key,
  name text not null,
  phone text,
  address text,
  total_purchased_amount numeric not null default 0,
  total_paid numeric not null default 0,
  balance_owed numeric not null default 0,
  created_at date
);

create table if not exists public.raw_materials (
  id text primary key,
  name text not null,
  category text not null,
  stock_kg numeric not null default 0,
  unit_price numeric not null default 0,
  supplier_id text,
  supplier_name text,
  date_added date not null,
  notes text,
  low_stock_threshold numeric not null default 5000
);

create table if not exists public.supplier_transactions (
  id text primary key,
  supplier_id text not null,
  date date not null,
  type text not null,
  description text not null,
  amount numeric not null default 0,
  paid_amount numeric not null default 0,
  remaining_amount numeric not null default 0
);

create table if not exists public.customers (
  id text primary key,
  name text not null,
  phone text,
  address text,
  total_purchased_amount numeric not null default 0,
  total_paid numeric not null default 0,
  balance_owed numeric not null default 0,
  created_at date
);

create table if not exists public.customer_transactions (
  id text primary key,
  customer_id text not null,
  date date not null,
  type text not null,
  description text not null,
  amount numeric not null default 0,
  paid_amount numeric not null default 0,
  remaining_amount numeric not null default 0
);

create table if not exists public.formulas (
  id text primary key,
  name text not null,
  description text,
  ingredients jsonb not null default '[]'::jsonb,
  operator_name text,
  date_created date not null
);

create table if not exists public.production_batches (
  id text primary key,
  formula_id text,
  formula_name text not null,
  date date not null,
  total_weight_kg numeric not null default 0,
  cost_per_kg numeric not null default 0,
  total_cost numeric not null default 0,
  operator_name text,
  notes text
);

-- Add the fields that the original batch sync accidentally omitted.  These
-- statements also upgrade an already-created production_batches table.
alter table public.production_batches add column if not exists formula_id text;
alter table public.production_batches add column if not exists cost_per_kg numeric not null default 0;
alter table public.production_batches add column if not exists total_cost numeric not null default 0;
alter table public.production_batches add column if not exists notes text;

create table if not exists public.processed_stock (
  id text primary key,
  name text not null,
  formula_id text,
  stock_kg numeric not null default 0,
  average_cost_per_kg numeric not null default 0,
  last_updated date not null
);

create table if not exists public.sales (
  id text primary key,
  date date not null,
  product_id text,
  product_name text not null,
  customer_id text,
  customer_name text not null,
  customer_phone text,
  unit_type text not null,
  unit_quantity numeric not null default 0,
  quantity_kg numeric not null default 0,
  sale_price_per_unit numeric not null default 0,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  remaining_amount numeric not null default 0,
  total_cost_of_goods numeric not null default 0,
  profit numeric not null default 0,
  notes text
);

create table if not exists public.expenses (
  id text primary key,
  date date not null,
  category text not null,
  amount numeric not null default 0,
  description text not null,
  paid_by text,
  notes text
);

-- A running cash balance cannot be accurately rebuilt from a partial history.
create table if not exists public.factory_state (
  id text primary key,
  cash_in_hand numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- The app now signs in through Supabase Auth before it reads any business
-- data. Every authenticated dashboard user can use this single-factory data
-- set. Replace these with organisation-specific policies if data must be
-- separated between multiple factories.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'suppliers', 'raw_materials', 'supplier_transactions', 'customers',
    'customer_transactions', 'formulas', 'production_batches',
    'processed_stock', 'sales', 'expenses', 'factory_state'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', 'factory state browser access', table_name);
    execute format('drop policy if exists %I on public.%I', 'authenticated factory access', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      'authenticated factory access', table_name
    );
  end loop;
end $$;

create index if not exists supplier_transactions_supplier_id_idx
  on public.supplier_transactions (supplier_id);
create index if not exists customer_transactions_customer_id_idx
  on public.customer_transactions (customer_id);
create index if not exists sales_date_idx on public.sales (date desc);
create index if not exists expenses_date_idx on public.expenses (date desc);
