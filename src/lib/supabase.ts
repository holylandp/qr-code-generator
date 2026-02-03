import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface DynamicQRCode {
  id: string;
  short_code: string;
  target_url: string;
  qr_config: Record<string, any>;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface QRScanLog {
  id: string;
  qr_code_id: string;
  ip_address?: string;
  user_agent?: string;
  scanned_at: string;
}

// 生成短码
export function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 创建活码
export async function createDynamicQRCode(
  targetUrl: string,
  qrConfig: Record<string, any>
): Promise<DynamicQRCode | null> {
  const shortCode = generateShortCode();
  
  const { data, error } = await supabase
    .from('dynamic_qr_codes')
    .insert([
      {
        short_code: shortCode,
        target_url: targetUrl,
        qr_config: qrConfig,
        scan_count: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating QR code:', error);
    return null;
  }

  return data;
}

// 获取所有活码
export async function getAllDynamicQRCodes(): Promise<DynamicQRCode[]> {
  const { data, error } = await supabase
    .from('dynamic_qr_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching QR codes:', error);
    return [];
  }

  return data || [];
}

// 根据短码获取活码
export async function getDynamicQRCodeByShortCode(
  shortCode: string
): Promise<DynamicQRCode | null> {
  const { data, error } = await supabase
    .from('dynamic_qr_codes')
    .select('*')
    .eq('short_code', shortCode)
    .single();

  if (error) {
    console.error('Error fetching QR code:', error);
    return null;
  }

  return data;
}

// 更新活码目标URL
export async function updateDynamicQRCodeTarget(
  id: string,
  newTargetUrl: string
): Promise<boolean> {
  const { error } = await supabase
    .from('dynamic_qr_codes')
    .update({ target_url: newTargetUrl, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating QR code:', error);
    return false;
  }

  return true;
}

// 删除活码
export async function deleteDynamicQRCode(id: string): Promise<boolean> {
  console.log('🗑️ Attempting to delete QR code with ID:', id);
  console.log('🔑 Using Supabase URL:', supabaseUrl);

  const { error, status, statusText } = await supabase
    .from('dynamic_qr_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting QR code:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: status,
      statusText: statusText
    });
    return false;
  }

  console.log('✅ QR code deleted successfully');
  console.log('Status:', status, statusText);
  return true;
}

// 记录扫描并更新计数
export async function recordScan(shortCode: string): Promise<void> {
  // 获取QR码信息
  const { data: qrCode } = await supabase
    .from('dynamic_qr_codes')
    .select('id, scan_count')
    .eq('short_code', shortCode)
    .single();

  if (!qrCode) return;

  // 更新扫描计数
  await supabase
    .from('dynamic_qr_codes')
    .update({ scan_count: (qrCode.scan_count || 0) + 1 })
    .eq('id', qrCode.id);

  // 记录扫描日志
  await supabase.from('qr_scan_logs').insert([
    {
      qr_code_id: qrCode.id,
      user_agent: navigator.userAgent,
    },
  ]);
}