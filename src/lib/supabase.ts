import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  phone: string;
  name: string;
  language: string;
  role: string;
  is_online: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  mrp: number;
  image_url: string;
  stock: number;
  offer_text: string;
  available: boolean;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: Product;
};

export type Bill = {
  id: string;
  user_id: string;
  manager_id: string;
  items: any;
  total_amount: number;
  status: string;
  created_at: string;
};

export type ManagerSettings = {
  id: string;
  password: string;
  updated_at: string;
};
