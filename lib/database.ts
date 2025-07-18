import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);




// -- Clients table
// CREATE TABLE clients (
//   id SERIAL PRIMARY KEY,
//   name TEXT NOT NULL,
//   email TEXT,
//   phone TEXT,
//   address TEXT,
//   created_at TIMESTAMP DEFAULT NOW()
// );

// -- Invoices table
// CREATE TABLE invoices (
//   id SERIAL PRIMARY KEY,
//   client_id INTEGER REFERENCES clients(id),
//   invoice_number TEXT NOT NULL,
//   date DATE NOT NULL,
//   due_date DATE NOT NULL,
//   status TEXT DEFAULT 'draft',
//   tax_rate DECIMAL(5,2) DEFAULT 0,
//   notes TEXT,
//   created_at TIMESTAMP DEFAULT NOW()
// );

// -- Invoice items table
// CREATE TABLE invoice_items (
//   id SERIAL PRIMARY KEY,
//   invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
//   name TEXT NOT NULL,
//   description TEXT,
//   rate DECIMAL(10,2) NOT NULL,
//   quantity INTEGER NOT NULL DEFAULT 1,
//   created_at TIMESTAMP DEFAULT NOW()
// );