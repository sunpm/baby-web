# Baby Log PWA

宝宝记录网页端，聚焦三个动作：

- 喂奶
- 拉粑粑
- 益生菌

目标是单手快速记录、离线可用、家人跨设备同步。

## 技术栈

- `React 19 + TypeScript + Vite`
- `Tailwind CSS v4`
- `vite-plugin-pwa`
- `Supabase (Anonymous Auth + Postgres + Realtime)`
- `Netlify` 静态部署

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

## 环境变量

前端和 `Netlify` 构建只需要下面三个变量：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BABY_HOUSEHOLD_NAME`

## Supabase 初始化

1. 在 `Authentication -> Providers -> Anonymous` 打开匿名登录。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 把 `.env` 或 `Netlify` 环境变量中的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 填好。
4. 打开网页后，在页面里的“家庭共享”面板创建家庭或输入邀请码加入家庭。

## Netlify 部署

仓库里已经包含 `netlify.toml`，默认配置如下：

- 构建命令：`npm run build`
- 发布目录：`dist`
- Node 版本：`20.19.0`
- SPA 回退：所有路由回退到 `index.html`
- PWA 关键文件：`sw.js`、`manifest.webmanifest` 使用 `must-revalidate`

### 部署步骤

1. 把仓库导入到 `Netlify`。
2. 在 `Site configuration -> Environment variables` 中配置：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BABY_HOUSEHOLD_NAME`（可选，但建议配置）
3. 触发一次部署。
4. 部署完成后，用两个设备测试：
   - 设备 A 创建家庭并生成邀请链接
   - 设备 B 打开邀请链接并加入同一家庭
   - 互相新增一条记录，确认同步正常

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
