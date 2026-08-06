# Deploy bằng Jenkins + kết nối GitHub

Pipeline nằm ở [`Jenkinsfile`](../Jenkinsfile) (gốc repo). File này hướng dẫn
cài Jenkins, nối nó với GitHub repo `lenovibk/mimo-story`, và cấu hình để mỗi
lần push code là tự động build & deploy 3 service: `app` (mimokids), `admin`,
`server` (xem [`docker-compose.yml`](../docker-compose.yml)).

## 0. Yêu cầu trên máy chủ chạy Jenkins

- Docker + Docker Compose v2 (`docker compose`, không phải `docker-compose`).
- User chạy Jenkins (thường là `jenkins`) phải nằm trong group `docker`:
  ```bash
  sudo usermod -aG docker jenkins
  sudo systemctl restart jenkins
  ```
- Plugin Jenkins cần cài (Manage Jenkins → Plugins):
  - **Git** (thường có sẵn)
  - **GitHub** (github-plugin) — để nhận webhook và hiện trạng thái build trên PR
  - **Pipeline** (thường có sẵn)
  - **Credentials Binding**

## 1. Tạo GitHub credentials cho Jenkins

Repo hiện là public trên GitHub (`https://github.com/lenovibk/mimo-story`),
nên Jenkins chỉ cần quyền đọc để checkout. Nhưng vẫn nên tạo Personal Access
Token (PAT) để tránh bị giới hạn rate-limit và để nhận webhook an toàn.

1. Vào GitHub → **Settings** (tài khoản, không phải repo) → **Developer
   settings** → **Personal access tokens** → **Fine-grained tokens** →
   **Generate new token**.
2. Chọn:
   - Repository access: **Only select repositories** → chọn `mimo-story`.
   - Permissions: **Contents: Read-only**, **Metadata: Read-only** (thêm
     **Webhooks: Read and write** nếu muốn Jenkins tự tạo webhook qua plugin).
3. Copy token (chỉ hiện 1 lần).

Trong Jenkins:

1. **Manage Jenkins → Credentials → System → Global credentials → Add
   Credentials**.
2. Kind: **Username with password** (username = username GitHub của bạn,
   password = PAT vừa tạo) hoặc **Secret text** nếu dùng GitHub App/plugin
   kiểu khác.
3. Đặt ID dễ nhớ, ví dụ `github-mimo-story`.

## 2. Tạo Job trong Jenkins

Cách đơn giản nhất là **Pipeline job** trỏ thẳng tới `Jenkinsfile` trong repo
(không cần copy nội dung pipeline vào UI Jenkins):

1. Jenkins → **New Item** → đặt tên (`mimokids-deploy`) → chọn **Pipeline** → OK.
2. Trong phần **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/lenovibk/mimo-story.git`
   - Credentials: chọn credential vừa tạo ở bước 1.
   - Branch: `*/main` (đổi thành branch bạn muốn deploy, ví dụ `*/youtube`
     nếu đang thử nghiệm).
   - Script Path: `Jenkinsfile` (mặc định).
3. Save.

Chạy thử bằng nút **Build Now** để kiểm tra pipeline chạy được trước khi nối
webhook.

> Muốn build tự động cho mọi branch/PR thay vì 1 branch cố định thì dùng
> **Multibranch Pipeline** thay vì **Pipeline** ở bước trên — Jenkins sẽ tự
> quét các branch có `Jenkinsfile` và tạo job con cho từng branch.

## 3. Nối webhook GitHub → Jenkins (build tự động khi push)

Jenkins cần một địa chỉ mà GitHub gọi tới được (public URL hoặc domain trỏ về
máy chủ Jenkins). Nếu Jenkins chạy trong mạng nội bộ không có IP public, xem
mục "Không có domain public" bên dưới.

### Cách A — GitHub plugin tự tạo webhook

1. **Manage Jenkins → System → GitHub** → **Add GitHub Server**.
2. Đặt tên, API URL mặc định (`https://api.github.com`), chọn credential
   dạng token có quyền `Webhooks: Read and write` (bước 1).
3. Bấm **Test connection** để xác nhận OK.
4. Trong job Pipeline vừa tạo → **Configure** → **Build Triggers** → tick
   **GitHub hook trigger for GITScm polling**.
5. Jenkins sẽ tự thêm webhook vào repo GitHub khi build chạy lần đầu (hoặc
   bấm nút re-register webhook trong cấu hình GitHub server ở bước 1).

### Cách B — Tự thêm webhook thủ công (không cần token quyền ghi)

1. GitHub repo → **Settings → Webhooks → Add webhook**.
2. Payload URL: `https://<domain-jenkins>/github-webhook/`
   (chú ý dấu `/` cuối).
3. Content type: `application/json`.
4. Secret: để trống hoặc đặt secret rồi cấu hình khớp trong Jenkins GitHub
   server settings (khuyến khích đặt secret nếu Jenkins có domain public).
5. Which events: **Just the push event** (hoặc thêm **Pull requests** nếu
   dùng Multibranch Pipeline).
6. Add webhook. GitHub sẽ hiện dấu tích xanh nếu Jenkins phản hồi 200 khi
   GitHub gửi ping.
7. Trong job Jenkins → **Configure** → **Build Triggers** → tick
   **GitHub hook trigger for GITScm polling**.

### Không có domain public cho Jenkins

Nếu máy chủ Jenkins không có IP/domain public để GitHub gọi webhook tới, có
2 lựa chọn:

- **Poll SCM**: trong job → Build Triggers → tick **Poll SCM**, đặt lịch ví
  dụ `H/5 * * * *` (kiểm tra GitHub mỗi 5 phút xem có commit mới không). Đơn
  giản, không cần webhook, nhưng không tức thời.
- **Tunnel tạm** (ví dụ `ngrok`, `cloudflared tunnel`) để expose Jenkins ra
  ngoài tạm thời rồi dùng Cách A/B như trên — chỉ nên dùng cho môi trường
  test, không khuyến khích cho production.

## 4. Chuẩn bị secrets trên máy chủ (server/.env, server/.env.production)

Pipeline **không** tạo các file `.env` — chúng chứa secret (JWT, mật khẩu DB,
SMTP...) nên cố tình không nằm trong git. Trước khi chạy build lần đầu, tạo
sẵn trên máy chủ nơi Jenkins/Docker chạy:

```bash
cd /path/to/mimo-story   # workspace mà Jenkins checkout code vào
cp server/.env.example server/.env
# sửa các giá trị thật trong server/.env

# nếu deploy production (docker-compose.prod.yml overlay server/.env.production)
cp server/.env.example server/.env.production
# sửa các giá trị thật cho production
```

Xem chi tiết từng biến trong [`server/.env.example`](../server/.env.example).

## 5. Chạy deploy

- Push code lên branch đã cấu hình (hoặc mở PR nếu dùng Multibranch) →
  webhook kích hoạt Jenkins tự build.
- Hoặc vào Jenkins job → **Build with Parameters** → chọn `ENVIRONMENT`
  (`production`/`staging`) → **Build**.

Pipeline sẽ:
1. Checkout code từ GitHub.
2. Kiểm tra `server/.env`/`server/.env.production` đã tồn tại trên máy chủ.
3. `docker compose build --pull` cho 3 service.
4. `docker compose up -d --force-recreate` để thay container mới.
5. `docker image prune -f` dọn image cũ.

Migration DB (`prisma migrate deploy`) đã được chạy tự động khi container
`server` khởi động, xem [`server/Dockerfile`](../server/Dockerfile).

## 6. Kiểm tra sau deploy

```bash
docker compose ps
docker compose logs -f server   # xem log migrate + API khởi động
```

- App: cổng `8986`
- Admin: cổng `8987`
- Server API: cổng `8988`

(Cổng lấy từ [`docker-compose.yml`](../docker-compose.yml); nếu máy chủ dùng
reverse proxy/nginx riêng để map domain → các cổng này thì cấu hình đó nằm
ngoài phạm vi file này.)
