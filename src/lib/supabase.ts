import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uyksksiddunmirsdlhlw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a3Nrc2lkZHVubWlyc2RsaGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzUzMzksImV4cCI6MjA4NTIxMTMzOX0.p-8mstK_7Q54G1t3b_pi7T6S2Uwq7gGXe4CeZ82GzkA';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface DynamicQRCode {
  id: string; short_code: string; target_url: string;
  qr_config: Record<string, any>; scan_count: number;
  created_at: string; updated_at: string;
}

export function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export async function createDynamicQRCode(targetUrl: string, qrConfig: Record<string, any>): Promise<DynamicQRCode | null> {
  const shortCode = generateShortCode();
  const { data, error } = await supabase.from('dynamic_qr_codes').insert([{ short_code: shortCode, target_url: targetUrl, qr_config: qrConfig, scan_count: 0 }]).select().single();
  if (error) { console.error('Error creating QR code:', error); return null; }
  return data;
}

export async function getAllDynamicQRCodes(): Promise<DynamicQRCode[]> {
  const { data, error } = await supabase.from('dynamic_qr_codes').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching QR codes:', error); return []; }
  return data || [];
}

export async function getDynamicQRCodeByShortCode(shortCode: string): Promise<DynamicQRCode | null> {
  const { data, error } = await supabase.from('dynamic_qr_codes').select('*').eq('short_code', shortCode).single();
  if (error) { console.error('Error fetching QR code:', error); return null; }
  return data;
}

export async function updateDynamicQRCodeTarget(id: string, newTargetUrl: string): Promise<boolean> {
  const { error } = await supabase.from('dynamic_qr_codes').update({ target_url: newTargetUrl, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { console.error('Error updating QR code:', error); return false; }
  return true;
}

export async function deleteDynamicQRCode(id: string): Promise<boolean> {
  const { error } = await supabase.from('dynamic_qr_codes').delete().eq('id', id);
  if (error) { console.error('Error deleting QR code:', error); return false; }
  return true;
}

export async function recordScan(shortCode: string): Promise<void> {
  const { data: qrCode } = await supabase.from('dynamic_qr_codes').select('id, scan_count').eq('short_code', shortCode).single();
  if (!qrCode) return;
  await supabase.from('dynamic_qr_codes').update({ scan_count: (qrCode.scan_count || 0) + 1 }).eq('id', qrCode.id);
  await supabase.from('qr_scan_logs').insert([{ qr_code_id: qrCode.id, user_agent: navigator.userAgent }]);
}
