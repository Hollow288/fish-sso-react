# fish-sso-react

基于 React 19 + TypeScript + Vite 的 SSO 前端服务，为 [fish-sso](https://github.com/hollow-fish/fish-sso) 后端提供登录页、授权同意页、密码重置页和用户中心页。

## 技术栈

- React 19
- TypeScript 5
- Vite 8
- react-router-dom v6
- axios

## 页面路由

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | Home | 用户中心，展示已授权应用，支持撤销授权和登出 |
| `/login` | Login | 登录页，支持 `return_to` 参数跳转 |
| `/forgot-password` | ForgotPassword | 忘记密码，两步流程：发送验证码 → 重置密码 |
| `/consent` 或 `/oauth/consent` | Consent | OAuth2 授权同意页 |
| `/callback` 或 `/oauth/callback` | Callback | OAuth2 回调页，接收 `code` 和 `state` |

## 本地开发

### 依赖

- Node.js 18+
- 已启动的 fish-sso 后端（默认监听 `http://localhost:9000`）

### 安装与启动

```bash
npm install
npm run dev
```

Vite 开发服务器默认监听 `http://localhost:5173`。

### 代理配置

`vite.config.ts` 已配置代理，开发时无需关心跨域：

- `/api/*` → `http://localhost:9000/*`（前端 axios 的 `baseURL` 为 `/api`）
- `/sso/*` → `http://localhost:9000/sso/*`

生产部署时，需在反向代理（如 Nginx）中配置相同规则，或将前端与后端部署到同一域名下。

## 目录结构

```text
src/
├── api/
│   ├── axios.ts          # axios 实例（baseURL=/api, withCredentials=true）
│   └── auth.ts           # 所有 SSO 接口封装
├── components/
│   └── PageShell.tsx     # 页面通用布局组件
├── pages/
│   ├── Home.tsx          # 用户中心
│   ├── Login.tsx         # 登录页
│   ├── ForgotPassword.tsx# 忘记密码
│   ├── Consent.tsx       # 授权同意页
│   └── Callback.tsx      # OAuth 回调页
├── styles/
│   └── common.css        # 全局样式
├── types/
│   └── api.ts            # 接口类型定义
├── App.tsx               # 路由配置
└── main.tsx
```

## 典型登录流程

```
用户访问业务系统
  → 业务系统构造 /sso/authorize 链接并跳转
  → SSO 后端重定向到 /consent?...
  → 若未登录：前端检测到 401 login_required，跳转 /login?return_to=/consent?...
  → 用户在登录页提交账号密码
  → 登录成功后跳回 /consent?...
  → 用户点击"同意"，前端 POST /consent
  → SSO 后端返回 redirect_url（含 code 和 state）
  → 前端跳转到业务系统回调地址
  → 业务系统用 code 换取 token（在服务端完成）
```

## 构建

```bash
npm run build
```

产物在 `dist/` 目录，为标准静态文件，可直接用 Nginx、CDN 或任意静态服务器托管。

### Nginx 配置参考

```nginx
server {
    listen 80;
    server_name sso.example.com;

    root /path/to/dist;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 代理到 fish-sso 后端
    location /api/ {
        proxy_pass http://127.0.0.1:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /sso/ {
        proxy_pass http://127.0.0.1:9000/sso/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 注意事项

- axios 实例全局启用了 `withCredentials: true`，请求会自动携带 `SSO_SESSION` Cookie。
- 登录页的 `return_to` 参数只允许同源路径，外部地址会被忽略，跳回 `/`。
- OAuth 回调页（`/callback`）仅负责接收参数并转交业务系统；`client_secret` 换 token 的操作应在业务系统服务端完成，不要在浏览器端调用 `/sso/token`。
