-- ============================================
-- 修复活码删除功能的RLS策略
-- ============================================
-- 在Supabase Dashboard的SQL Editor中执行此脚本

-- 1. 首先检查当前的RLS策略
SELECT policyname, tablename, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'dynamic_qr_codes';

-- 2. 删除可能存在的旧的删除策略（避免冲突）
DROP POLICY IF EXISTS "Enable delete for all users" ON public.dynamic_qr_codes;
DROP POLICY IF EXISTS "Allow anon users to delete dynamic qr codes" ON public.dynamic_qr_codes;
DROP POLICY IF EXISTS "Allow delete based on id" ON public.dynamic_qr_codes;

-- 3. 创建允许匿名用户删除的策略（DELETE操作不需要WITH CHECK）
CREATE POLICY "Allow anon users to delete dynamic qr codes"
ON public.dynamic_qr_codes
FOR DELETE
TO anon
USING (true);

-- 4. 验证策略已创建
SELECT policyname, tablename, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'dynamic_qr_codes' AND cmd = 'DELETE';

-- 5. 测试删除（可选 - 不建议在production环境执行）
-- SELECT * FROM dynamic_qr_codes LIMIT 1;
-- 记录要测试的ID后，执行以下命令测试：
-- DELETE FROM dynamic_qr_codes WHERE id = 'test-id';