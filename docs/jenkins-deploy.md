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

## 4. Chuẩn bị secrets qua Jenkins web UI (server/.env, server/.env.production)

`server/.env`/`server/.env.production` chứa secret (JWT, mật khẩu DB, SMTP...)
nên cố tình không nằm trong git, và pipeline cũng không tự sinh ra chúng.
Thay vì phải SSH vào máy chủ để tạo file tay, cách khuyến khích là lưu nội
dung 2 file này vào **Jenkins Credentials** (loại **Secret file**) qua giao
diện web — Jenkinsfile ([xem stage `Load env secrets`](../Jenkinsfile)) sẽ tự
ghi chúng ra `server/.env`/`server/.env.production` trong workspace ngay
trước khi build. Không cần plugin thêm, "Secret file" là loại credential có
sẵn trong Jenkins core.

### Bước 1 — Soạn nội dung file `.env` thật trên máy của bạn

Trên máy cá nhân (không phải máy chủ Jenkins), tạo file tạm dựa trên
[`server/.env.example`](../server/.env.example) và điền giá trị thật:

```bash
cp server/.env.example /tmp/mimokids-server.env
# sửa các giá trị thật (JWT_SECRET, DATABASE_URL, SMTP...) trong file này

cp server/.env.example /tmp/mimokids-server-production.env
# sửa các giá trị thật cho production
```

(2 file này chỉ dùng để upload lên Jenkins ở bước 2, xoá đi sau khi upload
xong nếu muốn — không cần giữ lại và không commit vào git.)

### Bước 2 — Upload lên Jenkins qua web UI

1. Mở **Manage Jenkins → Credentials**.
2. Chọn store **System → Global credentials (unrestricted)** → **Add
   Credentials** (nút ở góc trên bên phải hoặc menu trái "Add Credentials").
3. Điền:
   - **Kind**: `Secret file`
   - **File**: bấm **Choose File**, chọn `/tmp/mimokids-server.env` vừa tạo
     ở Bước 1.
   - **ID**: `mimokids-server-env` (đúng ID pipeline đang đọc, xem
     [`Jenkinsfile`](../Jenkinsfile))
   - **Description**: `MimoKids server/.env (dev/staging)`
4. Bấm **Create**.
5. Lặp lại bước 2–4 cho file production:
   - **File**: `/tmp/mimokids-server-production.env`
   - **ID**: `mimokids-server-env-production`
   - **Description**: `MimoKids server/.env.production`

Sau khi tạo xong, trang Credentials sẽ hiện 2 dòng `mimokids-server-env` và
`mimokids-server-env-production` với loại **Secret file** — nội dung file
được Jenkins mã hoá lưu trữ, không ai xem lại được qua UI (chỉ có thể thay
thế bằng file mới nếu cần đổi secret sau này, bằng cách **Update** credential
đó).

### Bước 3 — Không cần chỉnh gì thêm trong job

Job Pipeline đã trỏ tới `Jenkinsfile` trong repo (mục 2), và Jenkinsfile đã
có sẵn stage `Load env secrets` đọc đúng 2 ID credential ở trên — không cần
cấu hình gì thêm trong job. Chạy **Build Now** hoặc **Build with Parameters**
là đủ.

> Đổi secret sau này (ví dụ xoay `JWT_SECRET`): vào lại
> **Manage Jenkins → Credentials**, bấm vào credential tương ứng →
> **Update** → chọn file `.env` mới → **Save**. Lần build tiếp theo sẽ dùng
> nội dung mới.

Xem chi tiết từng biến trong [`server/.env.example`](../server/.env.example).

## 5. Chạy deploy

- Push code lên branch đã cấu hình (hoặc mở PR nếu dùng Multibranch) →
  webhook kích hoạt Jenkins tự build.
- Hoặc vào Jenkins job → **Build with Parameters** → chọn `ENVIRONMENT`
  (`production`/`staging`) → **Build**.

Pipeline sẽ:
1. Checkout code từ GitHub.
2. Ghi `server/.env`/`server/.env.production` ra workspace từ Jenkins Credentials.
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

## 7. `app/public/stories` không nằm trong git — deploy bằng cách nào?

`app/public/stories` (~370MB+ webm/webp, xem
[story-pipeline.md](story-pipeline.md)) cố tình **không** được commit lên
GitHub: quá nặng cho một git repo, và một phần media gốc có bản quyền (xem
comment trong [`.gitignore`](../.gitignore) — "not ours to redistribute").
Nghĩa là khi Jenkins checkout code từ GitHub, thư mục này **sẽ không tồn
tại** trong workspace, và nếu build image kiểu `COPY . .` như cũ thì app
build ra sẽ thiếu hết video/ảnh truyện.

Cách xử lý: **không** để `app/public/stories` phụ thuộc vào git/Docker image
nữa — tách nó ra thành một thư mục riêng trên máy chủ, mount vào container
lúc chạy (giống cách `server_uploads` đã tách khỏi image server). Cụ thể:

- [`docker-compose.yml`](../docker-compose.yml) mount
  `${STORIES_HOST_DIR:-/srv/mimokids/stories}` (thư mục thật trên máy chủ)
  vào `/usr/share/nginx/html/stories` trong container `mimokids`, đè lên bất
  cứ thứ gì Vite build ra ở đường dẫn đó (build ra rỗng cũng không sao).
- File thật được đưa lên `/srv/mimokids/stories` trên máy chủ **độc lập với
  Jenkins**, bằng script [`scripts/sync-stories.sh`](../scripts/sync-stories.sh)
  (rsync qua SSH) chạy từ máy đang có đủ `app/public/stories` (máy dev, hoặc
  máy vừa generate truyện mới theo story-pipeline.md).

### Lần đầu setup trên máy chủ

```bash
ssh deploy@may-chu "mkdir -p /srv/mimokids/stories"
```

(Nếu muốn dùng đường dẫn khác, đặt biến môi trường `STORIES_HOST_DIR` trước
khi chạy `docker compose`/Jenkins trên máy chủ đó — không cần sửa
`docker-compose.yml`.)

### Mỗi khi thêm truyện mới

Từ máy đang có đủ `app/public/stories/storyNNN/` mới generate xong:

```bash
DEPLOY_HOST=deploy@may-chu ./scripts/sync-stories.sh
```

Script rsync thẳng lên `/srv/mimokids/stories` trên máy chủ. Vì đây là bind
mount (không phải copy vào image), file mới có hiệu lực ngay — **không cần**
build lại hay restart container `mimokids`. Việc này tách hoàn toàn khỏi
pipeline Jenkins/GitHub ở các mục 1–6: push code lên GitHub để Jenkins deploy
code (giao diện, logic, API...), còn media truyện thì rsync thẳng lên máy chủ
theo hướng này.

> Muốn để media đi qua đúng pipeline Jenkins thay vì rsync tay riêng, có thể
> thêm 1 stage `sh 'rsync ...'` gọi kịch bản trên ngay trong Jenkinsfile, với
> điều kiện Jenkins agent SSH được tới nơi lưu trữ media gốc — không làm sẵn
> ở đây vì kho lưu trữ đó (máy dev cá nhân) thường không phải là thứ Jenkins
> agent truy cập được.

### Deploy thủ công bằng `deploy.sh`/`deploy.prod.sh` trên chính máy đang có `app/public/stories`

Nếu bạn build/chạy trực tiếp trên máy đã có sẵn đầy đủ
`app/public/stories` (ví dụ máy dev, không qua Jenkins), khỏi cần rsync —
trỏ thẳng `STORIES_HOST_DIR` vào thư mục đó khi chạy compose:

```bash
STORIES_HOST_DIR="$(pwd)/app/public/stories" ./deploy.sh
```

Nếu không set biến này, mặc định là `/srv/mimokids/stories` — Docker sẽ tự
tạo thư mục đó **rỗng** nếu chưa tồn tại (bind mount không báo lỗi khi thư
mục nguồn chưa có), khiến app chạy lên nhưng thiếu hết video/ảnh truyện. Nhớ
tạo/đồng bộ thư mục đó trước khi deploy lần đầu trên một máy chủ mới.
