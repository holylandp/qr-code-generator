# Supabase RLS策略修复脚本
# 使用方法：在PowerShell中运行此脚本

$env:SUPABASE_ACCESS_TOKEN = "sbp_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxODIzNDM2MTA0LCJpYXQiOjE3Njk2NzYxMDQsInN1YiI6IjBlNTZkYWQ3LWYyYzktNDM4ZS1iYTBiLWVkZDY5ZmIyNjRiNyIsImVtYWlsIjoiaW5mby5qZXJyeW1pc0BnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwic2Vzc2lvbl9pZCI6IjcxNDRjZWU3LTYyMTctNDVlNy1iZGUyLTcyMmUyYTM1YTZkMyIsImlzX2Fub255bW91cyI6ZmFsc2V9.6tZz9kT7GSeM0Kz1q8iLkD8nV2mX4yP5wQ7rT9uV3xY"

$PROJECT_REF = "uyksksiddunmirsdlhlw"

Write-Host "正在连接到Supabase项目: $PROJECT_REF" -ForegroundColor Green

# SQL查询（DELETE操作不需要WITH CHECK）
$sqlQuery = @"
DROP POLICY IF EXISTS "Allow anon users to delete dynamic qr codes" ON public.dynamic_qr_codes;

CREATE POLICY "Allow anon users to delete dynamic qr codes"
ON public.dynamic_qr_codes
FOR DELETE
TO anon
USING (true);
"@

try {
    # 使用curl调用Supabase管理API
    $response = Invoke-RestMethod `
        -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $env:SUPABASE_ACCESS_TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body (@{
            query = $sqlQuery
        } | ConvertTo-Json) `
        -ErrorAction Stop

    Write-Host "✅ RLS策略创建成功！" -ForegroundColor Green
    Write-Host "现在可以正常删除活码了。"
} catch {
    Write-Host "❌ 执行失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动执行以下步骤：" -ForegroundColor Yellow
    Write-Host "1. 登录 https://supabase.com/dashboard" -ForegroundColor Yellow
    Write-Host "2. 选择项目: uyksksiddunmirsdlhlw" -ForegroundColor Yellow
    Write-Host "3. 打开 SQL Editor" -ForegroundColor Yellow
    Write-Host "4. 执行以下SQL：" -ForegroundColor Yellow
    Write-Host $sqlQuery -ForegroundColor Cyan
}