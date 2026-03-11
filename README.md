# Baby Log PWA

宝宝记录网页端，聚焦三个动作:

- 喂奶
- 拉粑粑
- 益生菌

目标是单手快速记录、离线可用、家人跨设备同步。

## 技术栈

- `React 19 + TypeScript + Vite`
- `Tailwind CSS v4`
- `vite-plugin-pwa`
- `Supabase (Auth + Postgres + Realtime)`

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 拷贝环境变量

```bash
cp .env.example .env
```

3. 启动开发

```bash
npm run dev
```

## Supabase 配置

`Web/PWA` 前端不应使用数据库密码。请使用下面三个变量:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BABY_FAMILY_CODE`

数据库表与 RLS 策略在 [`supabase/schema.sql`](/Users/sunpm/i/baby-web/supabase/schema.sql)。

### 初始化步骤

1. 在 Supabase Dashboard 打开 `Authentication -> Providers -> Anonymous`。
2. 在 SQL Editor 执行 [`supabase/schema.sql`](/Users/sunpm/i/baby-web/supabase/schema.sql)。
3. 把 `.env` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 填好。
4. 家人使用同一个 `VITE_BABY_FAMILY_CODE` 或在页面设置里填相同代号。
5. 如果你之前执行过旧版 SQL，再执行一遍以补上删除策略。

## 可用脚本

- `npm run dev` 开发模式
- `npm run build` 构建生产包
- `npm run preview` 预览生产包
- `npm run lint` ESLint 检查

## PWA 特性

- 自动注册 Service Worker
- 资源离线缓存
- 可安装到主屏幕
- 新版本发布后支持前端提示刷新
