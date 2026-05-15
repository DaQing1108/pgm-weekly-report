# Microsoft AAD 整合建議
**專案**：PgM Weekly Report System  
**建立日期**：2026-04-30  
**狀態**：待規劃（Pre-implementation）

---

## 建議方案：MSAL.js（前端）+ 後端 JWT 驗證

### 為何選此方案

系統為 Vanilla JS SPA + 輕量 Express，無 session、無 SSR。  
MSAL.js 方案最符合現有架構，不需 IT 基礎設施改動，工作量可控。

---

## 架構說明

```
使用者瀏覽器
  │
  ├─ 1. 點擊「登入」→ MSAL.js 導向 AAD 登入頁
  │
  ├─ 2. AAD 驗證成功 → 回傳 Authorization Code（PKCE）
  │
  ├─ 3. MSAL.js 換取 Access Token（存 memory，非 localStorage）
  │
  └─ 4. 每次 API call 帶 Bearer Token → Express 驗簽 → 允許/拒絕
```

---

## 實作步驟

### Step 1 — IT 申請 AAD App Registration（IT 端）

需向 IT 申請：
- 新建一個 App Registration（Single Page Application 類型）
- Redirect URI：`https://pgm-weekly-report-production.up.railway.app`（生產）+ `http://localhost:3001`（開發）
- 啟用 **Implicit Grant** 或 **Authorization Code + PKCE**（建議後者）
- 記下：`Tenant ID`、`Client ID`

如需角色控制，還需：
- 在 App Registration 建立 App Roles（如 `PgM.Write`、`PgM.Read`）
- 在 Enterprise Application → Users and groups 指派角色給對應 AD 群組

---

### Step 2 — 前端：加入 MSAL.js 登入流程（半天）

**安裝（或透過 CDN）**
```html
<!-- 在所有頁面 head 加入 -->
<script src="https://alcdn.msauth.net/browser/3.x.x/js/msal-browser.min.js"></script>
```

**新增 `assets/js/auth.js`**
```javascript
// assets/js/auth.js
const MSAL_CONFIG = {
  auth: {
    clientId: 'YOUR_CLIENT_ID',          // App Registration Client ID
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',     // 不用 localStorage，安全性較高
    storeAuthStateInCookie: false,
  },
};

const _msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);

const SCOPES = ['openid', 'profile', 'email'];

export async function getAccessToken() {
  // 靜默取 token（已登入時）
  const accounts = _msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    try {
      const result = await _msalInstance.acquireTokenSilent({
        scopes: SCOPES,
        account: accounts[0],
      });
      return result.accessToken;
    } catch (e) {
      // 靜默失敗 → 重新互動式登入
    }
  }
  // 互動式登入
  const result = await _msalInstance.acquireTokenPopup({ scopes: SCOPES });
  return result.accessToken;
}

export async function login() {
  await _msalInstance.loginPopup({ scopes: SCOPES });
}

export function logout() {
  _msalInstance.logoutPopup();
}

export function getCurrentUser() {
  const accounts = _msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

export function isLoggedIn() {
  return _msalInstance.getAllAccounts().length > 0;
}
```

**修改 `app-init.js`**：在 `appInit()` 開頭加入登入檢查
```javascript
import { isLoggedIn, login, getCurrentUser, getAccessToken } from './auth.js';

export async function appInit() {
  // --- 新增：AAD 登入檢查 ---
  if (!isLoggedIn()) {
    await login();  // 強制登入，未登入不允許進入頁面
  }
  const user = getCurrentUser();
  window._currentUser = user;  // 供其他模組使用
  // --- 以下維持現有邏輯 ---
  _showLoader();
  // ...
}
```

**修改 `api.js`**：每次 API call 帶 Bearer Token
```javascript
import { getAccessToken } from './auth.js';

async function _fetch(url, options = {}) {
  const token = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}
```

---

### Step 3 — 後端：JWT 驗簽（半天）

**安裝套件**
```bash
cd backend
npm install jwks-rsa jsonwebtoken
```

**修改 `backend/src/index.js`**：換掉 `requireAdminToken`
```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const TENANT_ID = process.env.AAD_TENANT_ID;  // 新增環境變數
const CLIENT_ID = process.env.AAD_CLIENT_ID;  // 新增環境變數

const jwks = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 60 * 60 * 1000,  // 1小時
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

// 取代原有的 requireAdminToken
function requireAdminToken(req, res, next) {
  // 相容舊有 ADMIN_TOKEN 機制（開發環境 fallback）
  if (process.env.ADMIN_TOKEN && req.headers['x-admin-token'] === process.env.ADMIN_TOKEN) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  jwt.verify(token, getKey, {
    audience: CLIENT_ID,
    issuer: [
      `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      `https://sts.windows.net/${TENANT_ID}/`,
    ],
  }, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token', detail: err.message });
    req.user = decoded;  // 解碼後的 user 資訊（含 email、name 等）
    next();
  });
}
```

**新增環境變數（`backend/.env`）**
```
AAD_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AAD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

### Step 4 — 角色分流（選做，+1天）

**使用 AAD App Roles 控制讀寫權限**

IT 在 App Registration 建立：
- `PgM.Write`：可新增/修改所有資料
- `PgM.Read`：唯讀瀏覽

後端解碼 token 後檢查 roles：
```javascript
function requireWriteRole(req, res, next) {
  const roles = req.user?.roles || [];
  if (!roles.includes('PgM.Write')) {
    return res.status(403).json({ error: 'Forbidden: PgM.Write role required' });
  }
  next();
}
// 在需要寫入的 route 加上此 middleware
app.post('/api/weeks/:label', requireAdminToken, requireWriteRole, ...);
```

前端依角色顯示/隱藏編輯按鈕：
```javascript
const roles = window._currentUser?.idTokenClaims?.roles || [];
const canWrite = roles.includes('PgM.Write');
if (!canWrite) {
  document.querySelectorAll('.edit-only').forEach(el => el.style.display = 'none');
}
```

---

## 工作量估計

| 步驟 | 負責 | 估時 |
|------|------|------|
| IT 申請 App Registration + 設定 Redirect URI | IT | 半天 |
| 前端：auth.js + app-init.js + api.js 修改 | Dev | 半天 |
| 後端：JWT 驗簽替換 requireAdminToken | Dev | 半天 |
| 測試（本地 + Railway 環境） | Dev | 半天 |
| **（選做）** AAD App Roles + 前後端角色控制 | Dev + IT | 1天 |

---

## 前置確認清單

- [ ] 公司 AAD Tenant ID
- [ ] IT 能否開 App Registration（SPA 類型）
- [ ] Redirect URI 確認：Railway 網址 + localhost:3001
- [ ] 是否需要角色控制（唯讀 vs 編輯）
- [ ] 是否需要 Group-based 存取（特定 AD 群組才能進入）

---

## 安全注意事項

1. **Token 儲存**：Access Token 存 `sessionStorage`（非 `localStorage`），避免 XSS 竊取
2. **PKCE 強制**：SPA 必須使用 Authorization Code + PKCE，不使用 Implicit flow
3. **後端驗簽**：每次 write API 必須驗 JWT 簽名，不能只信任前端傳來的 user 資訊
4. **HTTPS 強制**：Railway 已強制 HTTPS，本地開發用 localhost 即可
5. **Token 有效期**：AAD Access Token 預設 1 小時，MSAL.js 會自動靜默更新

---

## 參考資源

- [MSAL.js for Browser — Microsoft Docs](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)
- [SPA + AAD — Microsoft Identity Platform Quickstart](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-single-page-app-javascript-sign-in)
- [Validate JWT from AAD in Node.js](https://learn.microsoft.com/en-us/azure/active-directory/develop/access-tokens)
- npm: `@azure/msal-browser`, `jwks-rsa`, `jsonwebtoken`
