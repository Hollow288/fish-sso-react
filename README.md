# Fish SSO React 前端

Fish SSO 单点登录系统的前端应用，基于 React + TypeScript + Vite。

## 项目结构

```
src/
├── api/              # API 接口层
│   ├── axios.ts      # Axios 配置
│   └── auth.ts       # 认证相关接口
├── pages/            # 页面组件
│   ├── Login.tsx     # 登录页面
│   ├── Consent.tsx   # 授权确认页面
│   └── Error.tsx     # 错误页面
├── types/            # TypeScript 类型定义
│   └── api.ts        # API 接口类型
├── styles/           # 样式文件
│   └── common.css    # 通用样式
├── App.tsx           # 路由配置
└── main.tsx          # 应用入口
```

## 功能页面

- `/login` - 用户登录
- `/consent` - OAuth2 授权确认
- `/error` - 错误提示

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 配置

后端API地址配置在 `src/api/axios.ts`：

```typescript
baseURL: '/fish-sso/sso'
```

开发环境需要在 `vite.config.ts` 配置代理。

## 技术栈

- React 19
- TypeScript
- React Router v6
- Axios
- Vite

