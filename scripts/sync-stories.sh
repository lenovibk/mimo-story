#!/usr/bin/env bash
# Đồng bộ app/public/stories/ (không nằm trong git) lên máy chủ deploy.
#
# app/public/stories chứa media đã transcode (webm/webp) cho từng truyện —
# xem docs/story-pipeline.md. Thư mục này cố tình KHÔNG commit vào git (dung
# lượng lớn + một phần nguồn gốc là media có bản quyền, xem .gitignore), nên
# Jenkins checkout code từ GitHub sẽ không có nó. docker-compose.yml mount
# thư mục này từ máy chủ (STORIES_HOST_DIR, mặc định /srv/mimokids/stories)
# đè vào container `mimokids` lúc chạy — script này chỉ lo việc đưa file lên
# đúng chỗ đó.
#
# Dùng: chạy từ máy có sẵn đầy đủ app/public/stories (máy dev, hoặc máy đã
# generate truyện theo docs/story-pipeline.md), MỖI KHI thêm truyện mới.
#
# Cấu hình qua biến môi trường (hoặc sửa default bên dưới):
#   DEPLOY_HOST        user@host để SSH tới máy chủ (bắt buộc)
#   STORIES_REMOTE_DIR  đường dẫn trên máy chủ (mặc định /srv/mimokids/stories,
#                        phải khớp STORIES_HOST_DIR trong docker-compose.yml)
#
# Ví dụ:
#   DEPLOY_HOST=deploy@mimokids.app ./scripts/sync-stories.sh
#   DEPLOY_HOST=deploy@1.2.3.4 STORIES_REMOTE_DIR=/data/stories ./scripts/sync-stories.sh

set -euo pipefail
cd "$(dirname "$0")/.."

: "${DEPLOY_HOST:?Cần đặt DEPLOY_HOST, ví dụ: DEPLOY_HOST=deploy@mimokids.app ./scripts/sync-stories.sh}"
STORIES_REMOTE_DIR="${STORIES_REMOTE_DIR:-/srv/mimokids/stories}"

if [ ! -d app/public/stories ]; then
    echo "Không tìm thấy app/public/stories ở máy này." >&2
    exit 1
fi

# Tạo thư mục đích trên máy chủ nếu chưa có.
ssh "$DEPLOY_HOST" "mkdir -p '$STORIES_REMOTE_DIR'"

# --delete: xoá trên máy chủ những gì đã xoá ở local (giữ 2 bên khớp nhau).
# Bỏ --delete nếu chỉ muốn thêm truyện mới, không muốn dọn truyện cũ.
rsync -avz --delete --progress \
    app/public/stories/ \
    "$DEPLOY_HOST:$STORIES_REMOTE_DIR/"

echo "Đã đồng bộ app/public/stories -> $DEPLOY_HOST:$STORIES_REMOTE_DIR"
echo "Nếu container mimokids đang chạy với volume mount readonly, không cần restart —"
echo "file mới sẽ có ngay (mount là bind trực tiếp thư mục)."
