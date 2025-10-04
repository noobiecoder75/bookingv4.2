# BookingGPT Integration Guide
**Vercel Deployment → Production Database & Authentication**

---

## Table of Contents
1. [Overview](#overview)
2. [Current Architecture](#current-architecture)
3. [Supabase Setup](#supabase-setup)
4. [Authentication Migration](#authentication-migration)
5. [Database Schema](#database-schema)
6. [Data Migration Strategy](#data-migration-strategy)
7. [API Configuration](#api-configuration)
8. [Implementation Checklist](#implementation-checklist)
9. [Testing & Validation](#testing--validation)

---

## Overview

### What This Guide Covers
This document provides a complete roadmap for migrating BookingGPT from client-side storage (Zustand) to production-ready infrastructure with:
- **Supabase PostgreSQL database** for persistent data storage
- **Supabase Authentication** replacing mock authentication
- **Proper API key management** via Vercel environment variables
- **Real-time data synchronization** across clients
- **Row Level Security (RLS)** for data protection

### Prerequisites
- Vercel deployment completed ✅
- Stripe account configured ✅
- HotelBeds API credentials ✅
- OpenAI API key ✅
- Supabase account (free tier available)

---

## Current Architecture

### Client-Side Storage (Zustand)
Currently using 13 Zustand stores for ALL data:

```typescript
// booking-app/src/store/
├── auth-store.ts          // Mock authentication
├── quote-store.ts         // Travel quotes
├── booking-store.ts       // Booking confirmations
├── payment-store.ts       // Payment records
├── contact-store.ts       // Client contacts
├── invoice-store.ts       // Invoices
├── expense-store.ts       // Expenses
├── commission-store.ts    // Commission tracking
├── transaction-store.ts   // Financial transactions
├── rate-store.ts          // Pricing rates
├── task-store.ts          // Tasks & reminders
├── settings-store.ts      // App settings
└── sidebar-store.ts       // UI state (keep client-side)
```

### Problems with Current Approach
- ❌ Data lost on browser refresh/clear
- ❌ No multi-device sync
- ❌ No authentication security
- ❌ No data backup
- ❌ Cannot share data between users
- ❌ No audit trail

---

## Supabase Setup

### 1. Create Supabase Project

```bash
# Visit https://supabase.com/dashboard
1. Click "New Project"
2. Name: "bookinggpt-production"
3. Database Password: Generate strong password (save securely!)
4. Region: Choose closest to your users
5. Plan: Free tier (upgrade as needed)
```

### 2. Get Supabase Credentials

Navigate to Project Settings → API:

```bash
# Copy these values for .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side only!
```

### 3. Install Supabase Client

```bash
cd booking-app
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
```

### 4. Create Supabase Client

Create `booking-app/src/lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side (use in components)
export const createClient = () => createClientComponentClient()

// Server-side (use in API routes)
export const createServerClient = () =>
  createServerComponentClient({ cookies })
```

Create `booking-app/src/lib/supabase/server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

// Admin client (bypass RLS for server operations)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

---

## Authentication Migration

### Current Implementation (Mock)
`src/store/auth-store.ts` - Accepts ANY email/password, stores in localStorage:

```typescript
login: async (email: string, password: string) => {
  // Demo mode - accept any login ❌
  const demoUser: User = {
    id: crypto.randomUUID(),
    email: email || 'agent@bookinggpt.com',
    name: 'Travel Agent',
    role: 'agent',
  };
  set({ isAuthenticated: true, user: demoUser });
  return true;
}
```

### New Implementation (Supabase Auth)

#### 1. Replace Auth Store
Update `booking-app/src/store/auth-store.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'admin';
}

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,

      login: async (email: string, password: string) => {
        const supabase = createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          console.error('Login failed:', error?.message);
          return false;
        }

        // Fetch user profile from database
        const { data: profile } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', data.user.id)
          .single();

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || 'User',
          role: profile?.role || 'agent',
        };

        set({ isAuthenticated: true, user });
        return true;
      },

      signup: async (email: string, password: string, name: string) => {
        const supabase = createClient();

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }, // Store name in auth metadata
          },
        });

        if (error || !data.user) {
          console.error('Signup failed:', error?.message);
          return false;
        }

        // Create user profile in database (trigger will handle this)
        return true;
      },

      logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ isAuthenticated: false, user: null });
      },

      checkAuth: async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        // Restore user from session
        const { data: profile } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', session.user.id)
          .single();

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: profile?.name || 'User',
          role: profile?.role || 'agent',
        };

        set({ isAuthenticated: true, user });
        return true;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

#### 2. Create Protected Route Middleware

Create `booking-app/src/middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Protect API routes
  if (req.nextUrl.pathname.startsWith('/api/') && !session) {
    const publicRoutes = ['/api/webhooks']; // Allow webhooks
    if (!publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
```

#### 3. Update Login Page

Update `booking-app/src/app/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push('/');
    } else {
      setError('Invalid email or password');
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">BookingGPT Login</h1>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

## Database Schema

### Supabase SQL Editor Setup

Navigate to Supabase Dashboard → SQL Editor → New Query

### 1. Enable Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Users Table

```sql
-- Users table (linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
  stripe_connect_account_id TEXT, -- For commission payouts
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### 3. Contacts Table

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  tags TEXT[], -- Array of tags
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id);
```

### 4. Quotes Table

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travelers INTEGER NOT NULL DEFAULT 1,

  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'paid', 'expired', 'cancelled')),

  -- Client access
  client_link_token TEXT UNIQUE, -- UUID for shareable link

  -- Metadata
  notes TEXT,
  internal_notes TEXT, -- Private agent notes
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_contact_id ON quotes(contact_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_client_link ON quotes(client_link_token);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quotes"
  ON quotes FOR ALL
  USING (auth.uid() = user_id);

-- Public access via client link (no auth required)
CREATE POLICY "Public can view quotes via link"
  ON quotes FOR SELECT
  USING (client_link_token IS NOT NULL);
```

### 5. Quote Items Table

```sql
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('hotel', 'flight', 'transfer', 'activity', 'package')),
  title TEXT NOT NULL,
  description TEXT,

  -- Dates
  date DATE NOT NULL,
  time TEXT,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Source
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'api', 'offline_platform', 'offline_agent')),
  api_provider TEXT, -- 'hotelbeds', 'amadeus', 'sabre'
  api_booking_reference TEXT, -- For API-booked items

  -- Supplier info
  supplier_name TEXT,
  supplier_cost DECIMAL(10, 2), -- What we pay supplier

  -- Cancellation policy
  cancellation_policy JSONB,

  -- Item-specific data
  metadata JSONB, -- Hotel details, flight numbers, etc.

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_type ON quote_items(type);
CREATE INDEX idx_quote_items_date ON quote_items(date);

-- RLS
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items in own quotes"
  ON quote_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- Public access via quote link
CREATE POLICY "Public can view items via quote link"
  ON quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.client_link_token IS NOT NULL
    )
  );
```

### 6. Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('full', 'deposit', 'balance')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Metadata
  payment_method TEXT,
  failure_reason TEXT,
  refunded_amount DECIMAL(10, 2),

  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_quote_id ON payments(quote_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_pi ON payments(stripe_payment_intent_id);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payments for own quotes"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = payments.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
```

### 7. Bookings Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  quote_item_id UUID NOT NULL REFERENCES quote_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed')),

  -- API booking details
  api_provider TEXT, -- 'hotelbeds', 'amadeus', etc.
  api_booking_reference TEXT, -- Confirmation code from API
  api_response JSONB, -- Full API response for record-keeping

  -- Supplier details
  supplier_name TEXT,
  supplier_confirmation TEXT,
  supplier_cost DECIMAL(10, 2),

  -- Dates
  booking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  travel_date DATE NOT NULL,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_quote_id ON bookings(quote_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_travel_date ON bookings(travel_date);

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookings"
  ON bookings FOR ALL
  USING (auth.uid() = user_id);
```

### 8. Invoices Table

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  invoice_number TEXT UNIQUE NOT NULL,

  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

  due_date DATE,
  paid_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate invoice numbers
CREATE SEQUENCE invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
         LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE invoices
  ALTER COLUMN invoice_number
  SET DEFAULT generate_invoice_number();

-- Indexes
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON invoices FOR ALL
  USING (auth.uid() = user_id);
```

### 9. Expenses Table

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL,

  date DATE NOT NULL,
  receipt_url TEXT, -- S3/Supabase Storage URL

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses"
  ON expenses FOR ALL
  USING (auth.uid() = user_id);
```

### 10. Commissions Table

```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,

  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'released', 'paid', 'clawed_back')),

  type TEXT NOT NULL CHECK (type IN ('agent_markup', 'platform_fee')),

  -- Payout tracking
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_commissions_user_id ON commissions(user_id);
CREATE INDEX idx_commissions_booking_id ON commissions(booking_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commissions"
  ON commissions FOR SELECT
  USING (auth.uid() = user_id);
```

### 11. Tasks Table

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);
```

### 12. Rates Table (Pricing)

```sql
CREATE TABLE rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for platform rates

  type TEXT NOT NULL CHECK (type IN ('hotel', 'flight', 'transfer', 'activity')),
  provider TEXT, -- 'hotelbeds', 'platform', 'custom'

  name TEXT NOT NULL,
  description TEXT,

  base_price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Markup configuration
  markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed')),
  markup_value DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Validity
  valid_from DATE,
  valid_until DATE,

  -- Rate details
  metadata JSONB, -- Hotel names, room types, etc.

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rates_type ON rates(type);
CREATE INDEX idx_rates_user_id ON rates(user_id);
CREATE INDEX idx_rates_validity ON rates(valid_from, valid_until);

-- RLS
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rates"
  ON rates FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view platform rates"
  ON rates FOR SELECT
  USING (user_id IS NULL);
```

### 13. Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'commission', 'refund')),
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  description TEXT,

  -- Links
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,

  date DATE NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id);
```

### 14. Settings Table

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Business settings
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_logo_url TEXT,

  -- Default markup
  default_markup_percentage DECIMAL(5, 2) DEFAULT 10.00,

  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,

  -- Preferences
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON settings FOR ALL
  USING (auth.uid() = user_id);
```

### 15. Updated At Trigger

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repeat for all tables with updated_at...
-- (Add remaining triggers for: quote_items, payments, bookings, invoices,
--  expenses, commissions, tasks, rates, transactions, settings)
```

---

## Data Migration Strategy

### Approach: Dual-Mode Operation

Support BOTH Zustand (client-side) and Supabase during transition:

#### 1. Create Database Adapters

Create `booking-app/src/lib/database/quotes.ts`:

```typescript
import { createClient } from '@/lib/supabase/client';
import { TravelQuote } from '@/types';

export const QuoteDB = {
  async getAll(userId: string): Promise<TravelQuote[]> {
    const supabase = createClient();

    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*),
        contact:contacts(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return quotes as TravelQuote[];
  },

  async getById(id: string): Promise<TravelQuote | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*),
        contact:contacts(*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data as TravelQuote;
  },

  async create(quote: Partial<TravelQuote>, userId: string): Promise<TravelQuote> {
    const supabase = createClient();

    // Insert quote
    const { data: newQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        user_id: userId,
        title: quote.title,
        destination: quote.destination,
        start_date: quote.startDate,
        end_date: quote.endDate,
        travelers: quote.travelers,
        total_cost: quote.totalCost,
        status: quote.status || 'draft',
        client_link_token: crypto.randomUUID(),
      })
      .select()
      .single();

    if (quoteError) throw quoteError;

    // Insert items
    if (quote.items && quote.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(
          quote.items.map(item => ({
            quote_id: newQuote.id,
            type: item.type,
            title: item.title,
            description: item.description,
            date: item.date,
            price: item.price,
            source: item.source,
            api_provider: item.apiProvider,
            metadata: item.metadata,
          }))
        );

      if (itemsError) throw itemsError;
    }

    return newQuote as TravelQuote;
  },

  async update(id: string, updates: Partial<TravelQuote>): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('quotes')
      .update({
        title: updates.title,
        status: updates.status,
        total_cost: updates.totalCost,
        // ... other fields
      })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Real-time subscription
  subscribeToChanges(userId: string, callback: (quotes: TravelQuote[]) => void) {
    const supabase = createClient();

    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Refetch quotes when changes detected
          const quotes = await this.getAll(userId);
          callback(quotes);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
```

#### 2. Update Zustand Stores to Use Database

Update `booking-app/src/store/quote-store.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TravelQuote } from '@/types';
import { QuoteDB } from '@/lib/database/quotes';
import { useAuthStore } from './auth-store';

interface QuoteStore {
  quotes: TravelQuote[];
  loading: boolean;

  // Actions
  fetchQuotes: () => Promise<void>;
  addQuote: (quote: Partial<TravelQuote>) => Promise<void>;
  updateQuote: (id: string, updates: Partial<TravelQuote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  // Subscriptions
  subscribeToChanges: () => () => void;
}

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  quotes: [],
  loading: false,

  fetchQuotes: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ loading: true });
    try {
      const quotes = await QuoteDB.getAll(userId);
      set({ quotes });
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      set({ loading: false });
    }
  },

  addQuote: async (quote: Partial<TravelQuote>) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      const newQuote = await QuoteDB.create(quote, userId);
      set(state => ({
        quotes: [newQuote, ...state.quotes],
      }));
    } catch (error) {
      console.error('Failed to add quote:', error);
      throw error;
    }
  },

  updateQuote: async (id: string, updates: Partial<TravelQuote>) => {
    try {
      await QuoteDB.update(id, updates);
      set(state => ({
        quotes: state.quotes.map(q =>
          q.id === id ? { ...q, ...updates } : q
        ),
      }));
    } catch (error) {
      console.error('Failed to update quote:', error);
      throw error;
    }
  },

  deleteQuote: async (id: string) => {
    try {
      await QuoteDB.delete(id);
      set(state => ({
        quotes: state.quotes.filter(q => q.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete quote:', error);
      throw error;
    }
  },

  subscribeToChanges: () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return () => {};

    return QuoteDB.subscribeToChanges(userId, (quotes) => {
      set({ quotes });
    });
  },
}));
```

#### 3. Migration Steps

1. **Deploy database schema** to Supabase
2. **Update auth system** to use Supabase Auth
3. **Create database adapters** for each store
4. **Update Zustand stores** to call adapters instead of local state
5. **Test thoroughly** with real data
6. **Remove Zustand persistence** once stable

---

## API Configuration

### 1. Vercel Environment Variables

Navigate to Vercel Dashboard → Project → Settings → Environment Variables:

#### Add All Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side only!

# Stripe (Already configured ✅)
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# HotelBeds (Already configured ✅)
HOTELBEDS_API_KEY=your_api_key
HOTELBEDS_SECRET=your_secret

# OpenAI (Already configured ✅)
OPENAI_API_KEY=sk-proj-...

# Email Service (SendGrid example)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@bookinggpt.com

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Important**:
- Variables starting with `NEXT_PUBLIC_` are exposed to browser
- Other variables are server-side only
- Set for "Production", "Preview", and "Development" environments

### 2. Webhook Configuration

#### Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

Create `booking-app/src/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(failedPayment);
      break;

    case 'charge.refunded':
      const refund = event.data.object as Stripe.Charge;
      await handleRefund(refund);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Update payment status in database
  // Trigger booking if full payment
  // Send confirmation email
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  // Update payment status
  // Send failure notification
}

async function handleRefund(charge: Stripe.Charge) {
  // Update payment records
  // Clawback commissions
  // Cancel bookings if needed
}
```

---

## Implementation Checklist

### Phase 1: Supabase Setup (Day 1)
- [ ] Create Supabase project
- [ ] Run database schema SQL (all tables)
- [ ] Configure RLS policies
- [ ] Test database access in SQL editor
- [ ] Add Supabase environment variables to `.env.local`
- [ ] Install `@supabase/supabase-js` package

### Phase 2: Authentication (Day 2)
- [ ] Create Supabase client utilities (`lib/supabase/`)
- [ ] Update `auth-store.ts` with Supabase Auth
- [ ] Create middleware for protected routes
- [ ] Update login page UI
- [ ] Add signup page
- [ ] Test login/logout flow
- [ ] Add password reset functionality

### Phase 3: Database Adapters (Days 3-5)
- [ ] Create `lib/database/quotes.ts`
- [ ] Create `lib/database/contacts.ts`
- [ ] Create `lib/database/payments.ts`
- [ ] Create `lib/database/bookings.ts`
- [ ] Create `lib/database/invoices.ts`
- [ ] Create `lib/database/expenses.ts`
- [ ] Create `lib/database/tasks.ts`
- [ ] Test all CRUD operations

### Phase 4: Store Migration (Days 6-8)
- [ ] Update `quote-store.ts` to use QuoteDB
- [ ] Update `contact-store.ts` to use ContactDB
- [ ] Update `payment-store.ts` to use PaymentDB
- [ ] Update `booking-store.ts` to use BookingDB
- [ ] Update `invoice-store.ts` to use InvoiceDB
- [ ] Update `expense-store.ts` to use ExpenseDB
- [ ] Update `task-store.ts` to use TaskDB
- [ ] Keep `sidebar-store.ts` and `settings-store.ts` local

### Phase 5: Real-time Features (Day 9)
- [ ] Add Supabase Realtime subscriptions
- [ ] Test multi-tab synchronization
- [ ] Add optimistic UI updates
- [ ] Add loading states
- [ ] Add error handling

### Phase 6: API Integration (Day 10)
- [ ] Add all environment variables to Vercel
- [ ] Configure Stripe webhooks
- [ ] Test HotelBeds API calls
- [ ] Test Stripe payment flow
- [ ] Test OpenAI rate extraction

### Phase 7: Testing & Deployment (Days 11-12)
- [ ] Test complete user flow (signup → quote → payment)
- [ ] Test API routes with authentication
- [ ] Test real-time updates
- [ ] Deploy to Vercel
- [ ] Verify production environment variables
- [ ] Monitor logs for errors

---

## Testing & Validation

### 1. Authentication Testing

```bash
# Test signup
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 2. Database Testing

```sql
-- Verify user creation
SELECT * FROM users WHERE email = 'test@example.com';

-- Check RLS policies
SELECT * FROM quotes; -- Should only return user's quotes

-- Test relationships
SELECT
  q.title,
  qi.title as item_title,
  c.name as contact_name
FROM quotes q
LEFT JOIN quote_items qi ON qi.quote_id = q.id
LEFT JOIN contacts c ON c.id = q.contact_id
LIMIT 10;
```

### 3. API Testing

```bash
# Test protected route
curl https://your-app.vercel.app/api/quotes \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"

# Test HotelBeds search
curl -X POST https://your-app.vercel.app/api/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "NYC",
    "checkIn": "2025-11-01",
    "checkOut": "2025-11-05",
    "adults": 2
  }'
```

### 4. Payment Testing

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### 5. Performance Monitoring

Enable Supabase logging:
- Go to Supabase Dashboard → Logs
- Monitor slow queries
- Check error rates
- Review authentication events

---

## Troubleshooting

### Issue: "Session not found" errors

**Solution**:
```typescript
// In middleware.ts, refresh session
const { data: { session }, error } = await supabase.auth.getSession()

if (!session) {
  const { data: { session: refreshedSession } } =
    await supabase.auth.refreshSession()
}
```

### Issue: RLS policies blocking queries

**Solution**:
```sql
-- Check if RLS is causing issues
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT * FROM quotes;

-- Re-enable and fix policy
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Fix policy to use correct user check
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);
```

### Issue: CORS errors with Supabase

**Solution**:
Add allowed origins in Supabase Dashboard → API Settings → CORS:
```
https://your-app.vercel.app
http://localhost:3000
```

### Issue: Environment variables not loading

**Solution**:
```bash
# Verify in Vercel deployment logs
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

# Redeploy after adding variables
vercel --prod
```

---

## Next Steps After Integration

### 1. Email Notifications
- Set up SendGrid/Resend
- Create email templates (payment reminders, booking confirmations)
- Add cron jobs for scheduled emails

### 2. File Storage
- Enable Supabase Storage
- Upload receipts, invoices, documents
- Generate signed URLs for secure access

### 3. Analytics
- Add PostHog/Mixpanel for user analytics
- Track quote conversions
- Monitor payment success rates

### 4. Multi-tenancy
- Add organization/agency support
- Team member invitations
- Role-based permissions

### 5. Mobile App
- Use same Supabase backend
- React Native + Expo
- Offline-first with Supabase Realtime

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Auth Guide**: https://supabase.com/docs/guides/auth
- **Supabase Realtime**: https://supabase.com/docs/guides/realtime
- **Next.js + Supabase**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **HotelBeds API**: https://developer.hotelbeds.com/

---

**Document Version**: 1.0
**Last Updated**: October 2025
**Status**: Ready for Implementation

---

## Quick Start Commands

```bash
# 1. Install dependencies
cd booking-app
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# 2. Copy environment template
cp .env.example .env.local

# 3. Add Supabase credentials to .env.local
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 4. Run database migrations (in Supabase SQL Editor)
# Copy/paste schema from "Database Schema" section above

# 5. Test locally
npm run dev

# 6. Deploy to Vercel
vercel --prod
```
