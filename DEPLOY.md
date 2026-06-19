# 部署指南：Railway + Docker（db / backend / frontend 三服務）

可複製到其他專案的通用部署說明。架構：**PostgreSQL + FastAPI(或任意後端) + 前端(nginx 靜態 + /api 反向代理)**。
前端 nginx 把 `/api/` 代理到後端，所以瀏覽器只打**同源相對路徑** `/api/...`，免 CORS。

```
[瀏覽器] → https://<frontend>  ──/api/──▶ [backend] ──▶ [postgres]
              nginx 靜態 + proxy        FastAPI         private network
```

本專案對應檔案（拿去別的專案照抄即可）：
- `docker-compose.yml` — 本機一鍵起三服務
- `backend/Dockerfile` — 後端映像（跑 migration 後啟動）
- `frontend/Dockerfile` + `frontend/nginx.conf` — 前端 build → nginx，模板注入 `PORT`/`BACKEND_URL`

---

## 0. Railway 心智模型

- 一個 **Project** 內含多個 **Service**。這裡 = `db`、`backend`、`frontend` 三個 service。
- 每個 service 各自從 Dockerfile（或 Nixpacks 自動偵測）build，獨立部署、獨立環境變數。
- Railway 啟動容器時**注入 `$PORT`**，你的程式必須監聽它，不能寫死 port。
- Service 之間走 **private network**（`<service>.railway.internal`，**IPv6**）。對外才需要 public domain。
- Postgres 用 Railway 的 **官方 Postgres plugin**（不是自己 build），它提供 `DATABASE_URL`。

### 三個 Dockerfile/程式的關鍵慣例（缺了會在 Railway 起不來）

1. **後端監聽 `$PORT` 且綁 IPv6 雙棧**，否則 private network 連不到：
   ```dockerfile
   CMD ["sh","-c","alembic upgrade head && uvicorn app.main:app --host :: --port ${PORT:-8000}"]
   ```
   `--host ::`（雙棧）是重點；`0.0.0.0` 只有 IPv4，Railway 私網是 IPv6。
2. **前端 nginx 用模板 + envsubst** 把 `PORT`/`BACKEND_URL` 注入設定檔：
   ```dockerfile
   COPY nginx.conf /etc/nginx/templates/default.conf.template
   ENV NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL)$"   # 別替換 nginx 自己的 $host/$uri
   ```
   `nginx.conf` 內 `listen ${PORT};`、`proxy_pass ${BACKEND_URL};`，並加 `proxy_ssl_server_name on;`（BACKEND_URL 走 https 時要）。
3. **前端打相對路徑** `/api/...`，由 nginx `location /api/` 代理到後端 → 同源、免 CORS。

---

## 1. 用 Railway Dashboard 建（最快上手）

1. **建 Project** → `New Project`。
2. **加 Postgres**：`+ New` → `Database` → `PostgreSQL`。建好後它自帶變數 `DATABASE_URL`、`PGHOST`、`PGPORT`…
3. **加 backend**：`+ New` → `GitHub Repo`（選你的 repo）。
   - Settings → **Root Directory** 設 `backend/`（讓它用 `backend/Dockerfile`）。
   - Variables 設（見 §3）。`DB_URL` 引用 Postgres：填 `${{Postgres.DATABASE_URL}}`。
4. **加 frontend**：再 `+ New` → 同 repo，**Root Directory** 設 `frontend/`。
   - Variables：`BACKEND_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:8000` 之類（用私網域名）。
   - **Networking** → `Generate Domain` 產生對外網址。
5. backend 若也要對外（除錯用）可各自 `Generate Domain`；正式只開 frontend 對外即可。

> 引用語法 `${{ServiceName.VAR}}` 是 Railway 的跨 service 變數參照，部署時自動解析。

---

## 2. 用 Railway CLI（可重複、可進 CI）

### 安裝 / 登入
```bash
npm i -g @railway/cli            # 或 brew install railway / scoop install railway
railway --version
railway login                    # 開瀏覽器授權；CI 用 railway login --browserless
```

### 連結專案
```bash
railway init                     # 在新專案目錄建立 Railway project
# 或連到既有 project：
railway link                     # 互動選 project / environment / service
railway status                   # 看目前連到哪個 project/service
```

### 加 Postgres
```bash
railway add --database postgres  # 在當前 project 加一個 Postgres service
```

### 部署某個 service
Railway CLI 一次操作「一個 service」。每個服務各自 `up`：
```bash
# 後端
railway up --service backend           # 從本機目前資料夾 build & 部署該 service
# 前端
railway up --service frontend
```
> `railway up` 會上傳當前目錄。多服務 monorepo 時，到各自子目錄執行，或在 service 設好 Root Directory 後從 repo 根 `up`。
> 接 GitHub 後其實 push 即自動部署，CLI 的 `up` 主要用於手動/即時部署。

### 環境變數
```bash
railway variables                                   # 列出當前 service 變數
railway variables --set "JWT_SECRET=xxxx" --service backend
railway variables --set "BACKEND_URL=http://backend.railway.internal:8000" --service frontend
```

### Log / 連 DB / 跑一次性指令
```bash
railway logs --service backend                      # 即時 log
railway run alembic upgrade head                    # 用該 service 的環境變數在本機跑指令
railway connect Postgres                             # 直接開 psql 連到雲端 DB
railway run env | grep DB_URL                        # 確認注入的變數
```

### 對外網址 / 重啟 / 刪除
```bash
railway domain                                       # 產生/查看對外網址
railway redeploy --service backend
railway down                                         # 移除最近一次部署
```

---

## 3. 環境變數一覽（照本專案，改成你的）

**backend**（FastAPI）
| 變數 | 範例 / 來源 |
|------|------|
| `DB_URL` | `${{Postgres.DATABASE_URL}}`（Railway）／`postgresql://user:pw@db:5432/app`（compose） |
| `JWT_SECRET` | 隨機長字串（`openssl rand -hex 32`） |
| `JWT_EXPIRE_HOURS` | `8` |
| `ALLOWED_ORIGINS` | 前端網址；同源走 nginx proxy 時可只填前端 domain |
| `BOOTSTRAP_ADMIN_USERNAME/PASSWORD` | 首次建立管理員帳號用 |

**frontend**（nginx）
| 變數 | 範例 |
|------|------|
| `PORT` | Railway 自動注入；compose 自己給（如 `80`） |
| `BACKEND_URL` | Railway：`http://backend.railway.internal:8000`；compose：`http://backend:8000` |

**db**：用 Railway Postgres plugin 不用自己設；compose 用 `POSTGRES_USER/PASSWORD/DB`。

> ⚠️ 前端若同時要部署到 **GitHub Pages**，`vite.config.js` 的 `base` 會是 `/<repo>/`；但 Railway/nginx 是部署在 **網域根目錄**，base 要是 `/`。用環境判斷或不同 build target 處理，別讓 Pages 的 base 帶進 Railway 映像。

---

## 4. 本機 Docker（實體電腦一鍵起整套）

需要 Docker Desktop / Docker Engine。

```bash
# 起整套（db + backend + frontend）
docker compose up -d --build

# 看 log
docker compose logs -f backend

# 停
docker compose down
# 連 DB volume 一起清掉（重置資料）
docker compose down -v
```

預設埠（見 `docker-compose.yml`，可自行調整）：
- 前端 http://localhost:8080
- 後端 http://localhost:8000
- Postgres localhost:5432

`.env`（放 compose 同層，覆蓋預設）：
```env
POSTGRES_PASSWORD=set-a-real-password
JWT_SECRET=set-a-random-secret
ALLOWED_ORIGINS=http://localhost:8080
```

---

## 5. 雲端實體機 / VPS 用 Docker 部署（DigitalOcean、Vultr、自架 server）

適用「想離開 Railway、改自己掌控一台機器」的情境。

### A. 最省事：直接搬 compose 上 VM
```bash
# 在 VM 上（Ubuntu 22.04 範例）
curl -fsSL https://get.docker.com | sh          # 裝 Docker + compose plugin
git clone <your-repo> && cd <your-repo>
cp .env.example .env && nano .env                # 填正式密碼/secret
docker compose up -d --build
```
- 開放防火牆只放對外要用的埠（通常只留前端）。
- 正式環境把 `db` 的 `ports: 5432` 對外埠拿掉（只在內網用）。

### B. 加 TLS / 網域（正式對外建議）
compose 前面再擺一層反向代理（Caddy 最省事，自動 Let's Encrypt）：
```
# Caddyfile
your-domain.com {
    reverse_proxy frontend:80
}
```
把 Caddy 也寫進 compose、和 frontend 同一個 network，對外只開 80/443。

### C. 單獨 build / run（不想用 compose 時）
```bash
docker build -t app-backend ./backend
docker build -t app-frontend ./frontend
docker network create appnet
docker run -d --name db --network appnet -e POSTGRES_PASSWORD=... postgres:16
docker run -d --name backend --network appnet -e DB_URL=postgresql://...@db:5432/app -e PORT=8000 app-backend
docker run -d --name frontend --network appnet -p 80:80 -e PORT=80 -e BACKEND_URL=http://backend:8000 app-frontend
```

### 映像可攜性
- 任一台有 Docker 的機器都能跑同一份映像。
- 要搬到內網離線機器：`docker save app-frontend | gzip > frontend.tar.gz`，對面 `docker load`。
- 或 push 到 registry（Docker Hub / GHCR / Railway 不需要），各機 `docker pull`。

---

## 6. 從零到上線 checklist

- [ ] 後端 `CMD` 監聽 `$PORT` 且 `--host ::`
- [ ] 前端 nginx 模板含 `listen ${PORT}` 與 `proxy_pass ${BACKEND_URL}`，filter 只替換自訂變數
- [ ] 前端只打相對路徑 `/api/...`
- [ ] DB 用 Railway Postgres plugin（雲）或 compose `db`（本機）
- [ ] 各 service 環境變數設好，跨 service 用 `${{Service.VAR}}` 或 `*.railway.internal`
- [ ] 只有前端（必要時加 backend）`Generate Domain` 對外
- [ ] `vite base` 在 Railway/容器是 `/`，別帶 GitHub Pages 的 `/<repo>/`
- [ ] secret（JWT/DB 密碼）不進 git，用平台變數
```
