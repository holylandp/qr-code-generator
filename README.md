# 宇宙二维码生成器

专业级二维码生成工具，支持活码、自定义样式、Logo 上传，部署于 Vercel，数据存储于 Supabase。

## 功能特点

- ✨ **普通二维码生成** - 支持自定义颜色、样式、添加 Logo
- 🔄 **活码管理** - 可随时修改跳转地址，二维码图案保持不变
- 🎨 **多种样式** - 方形、圆角、圆点、液态四种码点样式
- 🌈 **渐变色支持** - 二维码可使用渐变色
- 🖼️ **Logo 上传** - 支持上传图片作为二维码中心 Logo
- 📊 **扫描统计** - 活码支持扫描次数统计

## 技术栈

- **前端**: React + TypeScript + Vite
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel
- **二维码生成**: qrcode.js

## 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/holylandp/qr-code-generator.git
cd qr-code-generator
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入你的 Supabase 凭证：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**获取 Supabase 凭证：**
1. 访问 https://supabase.com/dashboard
2. 选择或创建项目
3. 进入 Settings → API
4. 复制 Project URL 和 anon/public key

### 4. 启动开发服务器

```bash
npm run dev
```

## 部署

### 部署到 Vercel

1. 在 Vercel 导入 GitHub 仓库
2. 配置环境变量（同上）
3. 点击部署

### Supabase 数据库配置

执行以下 SQL 创建表：

```sql
-- 活码表
CREATE TABLE IF NOT EXISTS dynamic_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    qr_config JSONB DEFAULT '{}'::jsonb,
    scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 扫描日志表
CREATE TABLE IF NOT EXISTS qr_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID REFERENCES dynamic_qr_codes(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);
```

## License

MIT