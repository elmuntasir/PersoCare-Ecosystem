import axios from 'axios';
import { supabase } from './supabase';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'https://persocare.vercel.app/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});
