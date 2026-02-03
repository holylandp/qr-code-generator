-- 快速修复：删除RLS策略问题
-- 在Supabase Dashboard的SQL Editor中执行此SQL

DROP POLICY IF EXISTS "Allow anon users to delete dynamic qr codes" ON public.dynamic_qr_codes;

CREATE POLICY "Allow anon users to delete dynamic qr codes"
ON public.dynamic_qr_codes
FOR DELETE
TO anon
USING (true);