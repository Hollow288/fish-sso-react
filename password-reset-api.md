# 密码重置 API 文档

## 概述

用户忘记密码后，通过 **用户名 + 绑定邮箱** 获取验证码，再凭验证码重置密码。整个流程涉及两个接口，前端需要两个页面（或两步表单）来完成。

### 流程图

```
用户点击「忘记密码」
       │
       ▼
┌─────────────────────┐
│  第一步：输入用户名和邮箱  │
│  调用 POST /reset-code   │
└──────────┬──────────┘
           │
           ▼
     用户查收邮件，获取6位验证码
           │
           ▼
┌──────────────────────────┐
│  第二步：输入用户名、新密码、验证码 │
│  调用 POST /reset              │
└──────────┬───────────────┘
           │
           ▼
       密码重置成功，跳转登录页
```

---

## 接口一：发送验证码

### 基本信息

| 项目 | 值 |
|------|------|
| URL | `POST /sso/password/reset-code` |
| Content-Type | `application/json` |
| 是否需要登录 | 否 |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名 |
| `email` | string | 是 | 用户绑定的邮箱地址 |

### 请求示例

```http
POST /sso/password/reset-code HTTP/1.1
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com"
}
```

### 响应

#### 成功 — 200 OK

> **注意**：无论用户名和邮箱是否匹配，只要参数合法，都会返回 200。这是出于安全考虑，防止攻击者探测哪些用户名存在。前端不需要根据响应判断用户是否存在，统一提示用户去邮箱查看即可。

```json
{
  "message": "如果用户名和邮箱匹配，验证码已发送至您的邮箱"
}
```

#### 参数为空 — 400 Bad Request

当 `username` 或 `email` 为空/空白时：

```json
{
  "error": "invalid_request",
  "error_description": "用户名和邮箱不能为空"
}
```

#### 发送过于频繁 — 429 Too Many Requests

同一用户名在 **60秒** 内重复请求时：

```json
{
  "error": "rate_limited",
  "error_description": "发送过于频繁，请稍后再试"
}
```

### 前端处理建议

- 调用成功后，统一显示"验证码已发送，请查看邮箱"，跳转到第二步表单
- 收到 `429` 时，显示"发送过于频繁"提示，并禁用发送按钮，倒计时 60 秒后再允许点击
- 收到 `400` 时，提示用户检查输入

---

## 接口二：重置密码

### 基本信息

| 项目 | 值 |
|------|------|
| URL | `POST /sso/password/reset` |
| Content-Type | `application/json` |
| 是否需要登录 | 否 |

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名（与第一步相同） |
| `new_password` | string | 是 | 新密码 |
| `code` | string | 是 | 邮件中收到的6位数字验证码 |

### 请求示例

```http
POST /sso/password/reset HTTP/1.1
Content-Type: application/json

{
  "username": "alice",
  "new_password": "myNewSecurePassword123",
  "code": "582947"
}
```

### 响应

#### 成功 — 200 OK

```json
{
  "message": "密码重置成功"
}
```

#### 参数为空 — 400 Bad Request

```json
{
  "error": "invalid_request",
  "error_description": "用户名、新密码和验证码不能为空"
}
```

#### 验证码错误 — 400 Bad Request

验证码不正确，但还有剩余尝试机会：

```json
{
  "error": "invalid_code",
  "error_description": "验证码错误，剩余尝试次数: 3"
}
```

#### 验证码无效或已过期 — 400 Bad Request

验证码已过期（超过5分钟）或从未发送过：

```json
{
  "error": "invalid_code",
  "error_description": "验证码无效或已过期"
}
```

#### 验证码错误次数过多 — 400 Bad Request

连续错误达到 **5次**，验证码自动作废，需要重新获取：

```json
{
  "error": "code_exhausted",
  "error_description": "验证码错误次数过多，请重新获取"
}
```

### 前端处理建议

- 成功后跳转到登录页，提示"密码已重置，请重新登录"
- 收到 `invalid_code` 时，显示 `error_description` 中的剩余次数提示
- 收到 `code_exhausted` 时，提示用户返回第一步重新获取验证码
- 收到 `invalid_code`（已过期）时，提示用户返回第一步重新获取

---

## 错误码汇总

| error | HTTP 状态码 | 含义 | 前端处理 |
|-------|-----------|------|---------|
| `invalid_request` | 400 | 参数缺失或为空 | 表单校验提示 |
| `rate_limited` | 429 | 发送验证码过于频繁 | 禁用按钮，倒计时60秒 |
| `invalid_code` | 400 | 验证码错误或已过期 | 显示错误提示，允许重试 |
| `code_exhausted` | 400 | 验证码错误次数达上限 | 引导用户返回重新获取验证码 |

统一错误响应结构：

```typescript
interface ErrorResponse {
  error: string;           // 错误码，用于程序判断
  error_description: string; // 错误描述，可直接展示给用户
}
```

---

## 前端完整实现参考

### 推荐的页面结构

**页面一：请求验证码**

```
┌─────────────────────────────┐
│        忘记密码               │
│                              │
│  用户名: [____________]      │
│  邮  箱: [____________]      │
│                              │
│  [发送验证码]   [返回登录]     │
└─────────────────────────────┘
```

**页面二：重置密码**

```
┌─────────────────────────────┐
│        重置密码               │
│                              │
│  用户名:   alice (只读回显)    │
│  新密码:   [____________]     │
│  确认密码: [____________]     │
│  验证码:   [____________]     │
│                              │
│  [确认重置]   [重新获取验证码]  │
└─────────────────────────────┘
```

### JavaScript 调用示例

```javascript
// 第一步：发送验证码
async function sendResetCode(username, email) {
  const res = await fetch('/sso/password/reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email })
  });

  if (res.status === 429) {
    alert('发送过于频繁，请60秒后再试');
    return false;
  }

  if (!res.ok) {
    const err = await res.json();
    alert(err.error_description);
    return false;
  }

  // 成功，跳转到第二步
  return true;
}

// 第二步：重置密码
async function resetPassword(username, newPassword, code) {
  const res = await fetch('/sso/password/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, new_password: newPassword, code })
  });

  if (!res.ok) {
    const err = await res.json();
    if (err.error === 'code_exhausted') {
      alert('验证码错误次数过多，请重新获取');
      // 跳转回第一步
      return 'restart';
    }
    alert(err.error_description);
    return 'error';
  }

  alert('密码重置成功，请重新登录');
  // 跳转到登录页
  return 'success';
}
```

---

## 安全机制说明

| 机制 | 说明 |
|------|------|
| 防用户枚举 | 用户名/邮箱不匹配时仍返回 200，不暴露用户是否存在 |
| 发送频率限制 | 同一用户名 60 秒内只能发一次验证码 |
| 验证码有效期 | 5 分钟后自动过期（Redis TTL） |
| 防暴力破解 | 验证码连续错误 5 次后自动作废 |
| 一次性使用 | 验证码验证成功后立即删除，不可重复使用 |
| 密码加密 | 新密码使用 BCrypt 加密存储 |

---

## 配置项参考（后端 application.yml）

```yaml
app:
  sso:
    password-reset:
      code-ttl: 5m           # 验证码有效时间
      max-verify-failures: 5  # 最大验证错误次数
      send-interval: 60s      # 同一用户发送间隔
```

前端倒计时时间建议与 `send-interval`（60秒）保持一致。
