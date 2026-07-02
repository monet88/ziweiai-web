# VPS Deploy Guide — `monet.uno` shared host

> **Mục đích:** Tài liệu này nằm **trên VPS** (`/home/ubuntu/DEPLOY.md`) để bất kỳ
> agent nào SSH vào cũng nắm ngay kiến trúc, cách deploy/redeploy docker & web app,
> cách dùng HTTPS, và tình trạng hiện tại. Không track vào git repo — đây là tài liệu
> runtime của server. Khi đổi kiến trúc, hãy cập nhật file này ngay trên VPS.
>
> **Cập nhật lần cuối:** 2026-07-02

## Host

- AWS Lightsail, Singapore (ap-southeast-1), Ubuntu 24.04, 2 vCPU / 1.9 GB RAM / 58 GB
- Static IPv4: `54.255.81.117` (không đổi khi stop/start)
- 2 GB swap (`/swapfile`) để tránh OOM khi build
- Đăng nhập: `ssh -i <key.pem> ubuntu@54.255.81.117` (key nằm ở repo `docs/deploy/`)

## Nguyên tắc cốt lõi (đọc trước khi làm gì)

1. **Caddy là edge công cộng duy nhất trên 443.** Mọi container/app phải bind `127.0.0.1`,
   Caddy reverse-proxy domain vào. **KHÔNG BAO GIỜ** bind container lên `0.0.0.0:443`
   (hoặc `0.0.0.0:80`) — sẽ giành port với Caddy và làm sập toàn bộ site.
2. **Mọi domain dùng ACME tự động** (Let's Encrypt qua Caddy). DNS phải là **grey cloud
   (DNS only)** trên Cloudflare để ACME HTTP-01 challenge tới Caddy được. Đừng orange-cloud.
3. **Container serve HTTP plain nội bộ**, Caddy terminate TLS. Không bật TLS kép trong
   container khi đã qua Caddy proxy.
4. **Không commit `.env` hay SSH key.** Secret nằm trong `.env` ở repo root (web/api)
   và trong `config.yaml`/`auths/` của từng container — không track git.
5. **VPS 1.9 GB RAM:** đừng build Go/Node nặng trực tiếp trên VPS nếu có thể build ở
   máy khác rồi ship image. Build Node (`pnpm turbo build`) có thể OOM — có swap đỡ.

## Tình trạng hiện tại (5 domain, tất cả HTTP 200 + Let's Encrypt)

| Domain | Upstream | Loại |
|---|---|---|
| `https://tuvi.monet.uno` | static SPA `~/ziweiai-web/apps/web/build` | web (SvelteKit adapter-static) |
| `https://api.tuvi.monet.uno` | `localhost:3000` (pm2 `ziwei-api`) | API (NestJS) |
| `https://cliproxy.monet.uno` | `127.0.0.1:8333` — container `cli-proxy-api-origin` | docker |
| `https://kiro-go.monet.uno` | `127.0.0.1:8090` — container `kiro-go` | docker |
| `https://cli-kiro.monet.uno` | `127.0.0.1:8317` — container `cli-kiro-proxy` | docker |

Verify nhanh:
```bash
for d in tuvi.monet.uno api.tuvi.monet.uno/health cliproxy.monet.uno kiro-go.monet.uno cli-kiro.monet.uno; do
  echo "$d -> $(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 https://$d)"
done
```

## Kiến trúc

```
Internet ──443──> Caddy (Let's Encrypt ACME, /etc/caddy/Caddyfile)
                     ├── tuvi.monet.uno        → file_server ~/ziweiai-web/apps/web/build
                     ├── api.tuvi.monet.uno    → reverse_proxy localhost:3000 (pm2)
                     ├── cliproxy.monet.uno    → reverse_proxy 127.0.0.1:8333 (docker)
                     ├── kiro-go.monet.uno     → reverse_proxy 127.0.0.1:8090 (docker)
                     └── cli-kiro.monet.uno    → reverse_proxy 127.0.0.1:8317 (docker)
```

- **Web/API:** repo `~/ziweiai-web`, API chạy qua pm2 (`ziwei-api`), tự boot qua
  systemd `pm2-ubuntu.service`. Web là static build do Caddy serve.
- **3 Docker container:** đều `restart: unless-stopped`, đều bind `127.0.0.1`.
- **Supabase:** cloud, không có DB trên VPS.

## /etc/caddy/Caddyfile (current)

```
tuvi.monet.uno {
    root * /home/ubuntu/ziweiai-web/apps/web/build
    encode gzip
    try_files {path} /index.html
    file_server
}

api.tuvi.monet.uno {
    reverse_proxy localhost:3000
}

cliproxy.monet.uno {
    reverse_proxy 127.0.0.1:8333
    encode zstd gzip
}

kiro-go.monet.uno {
    reverse_proxy 127.0.0.1:8090
}

cli-kiro.monet.uno {
    reverse_proxy 127.0.0.1:8317
}
```

Sau khi sửa: `sudo caddy fmt --overwrite --config /etc/caddy/Caddyfile && sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && sudo systemctl reload caddy`.

## Các dịch vụ & cách deploy/redeploy

### 1) Web + API (ziweiai-web) — Node/pnpm + pm2

```bash
cd ~/ziweiai-web
git pull
pnpm install
pnpm rebuild esbuild        # Vite cần native binary; pnpm block postinstall
pnpm turbo build
pm2 restart ziwei-api
sudo systemctl reload caddy # chỉ khi Caddyfile đổi
```

Lưu ý:
- `PUBLIC_*` env được **bake vào JS lúc build** — đổi `PUBLIC_*` thì phải rebuild.
- `API_CORS_ORIGINS` phải khớp origin web (`https://tuvi.monet.uno`).
- Built API entry: `apps/api/dist/apps/api/src/main.js`; pm2 chạy với
  `--cwd ~/ziweiai-web/apps/api` để env walk-up thấy root `.env`.
- `.env` ở repo root (scp lên, không commit).

pm2:
```bash
pm2 list
pm2 logs ziwei-api --lines 50
pm2 restart ziwei-api
pm2 save && pm2 startup   # lần đầu thiết lập auto-boot
```

### 2) Docker containers (3 cái) — tất cả bind 127.0.0.1

Bảng tổng quan:

| Container | Compose dir | Image | Host port | Domain |
|---|---|---|---|---|
| `cli-proxy-api-origin` | `~/cliproxy/` | `eceasy/cli-proxy-api:latest` | `127.0.0.1:8333` | `cliproxy.monet.uno` |
| `kiro-go` | `~/kiro-go/` | `kiro-go:vps-good` (prebuilt) | `127.0.0.1:8090` | `kiro-go.monet.uno` |
| `cli-kiro-proxy` | `~/cli-kiro-proxy/` | `cli-proxy-api:kiro-good` (prebuilt) | `127.0.0.1:8317` | `cli-kiro.monet.uno` |

Lệnh chung:
```bash
sudo docker ps -a                              # xem tất cả
sudo docker logs --tail 50 <container>         # log
sudo docker compose -f <file> up -d            # recreate (trong dir tương ứng)
sudo docker compose -f <file> down             # stop + xóa container
```

Recreate từng cái:
```bash
cd ~/cliproxy       && sudo docker compose up -d                          # cliproxy
cd ~/kiro-go        && sudo docker compose -f docker-compose.vps.yml up -d # kiro-go
cd ~/cli-kiro-proxy && sudo docker compose -f docker-compose.vps.yml up -d # cli-kiro-proxy
```

### 3) Thêm một Docker app mới

1. Tạo dir `~/<app>/` với `docker-compose.yml`. Bind port `127.0.0.1:<port>:<cport>`.
   **Không** bind `0.0.0.0:443` hay `0.0.0.0:80`. Tắt TLS trong container nếu có.
2. `cd ~/<app> && sudo docker compose up -d`.
3. Tạo A record trên Cloudflare: `<sub>.monet.uno → 54.255.81.117`, **grey cloud**.
4. Thêm block vào `/etc/caddy/Caddyfile`:
   ```
   <sub>.monet.uno {
       reverse_proxy 127.0.0.1:<port>
   }
   ```
5. `sudo caddy fmt --overwrite --config /etc/caddy/Caddyfile && sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && sudo systemctl reload caddy`
6. Caddy tự obtain cert Let's Encrypt. Verify: `curl -sk -o /dev/null -w '%{http_code}' https://<sub>.monet.uno` → 200.
7. Cập nhật bảng "Tình trạng hiện tại" ở trên trong file này.

## HTTPS / TLS

- Caddy tự xin cert Let's Encrypt qua ACME HTTP-01 cho mỗi domain trong Caddyfile.
- Cần: DNS grey cloud + port 80/443 mở public (Lightsail firewall).
- Cert tự renew. Không cần cron hay `certbot`.
- **Đã bỏ** Cloudflare Origin Certificate + Authenticated Origin Pulls (trước đây cho
  cliproxy). Giờ toàn bộ dùng cert công cộng + auth ở tầng app của từng dịch vụ.

## DNS (Cloudflare zone `monet.uno`)

5 A record, đều grey cloud (DNS only):
`tuvi`, `api.tuvi`, `cliproxy`, `kiro-go`, `cli-kiro` → `54.255.81.117`.

## Firewall (Lightsail console)

| Port | Mục đích |
|---|---|
| 22 | SSH |
| 80 | Caddy HTTP + ACME redirect |
| 443 | Caddy HTTPS (tất cả domain) |

- Port 3000 công cộng **không cần** nữa (API qua 443). Có thể bỏ rule.
- Các port công cộng khác do container expose (8086, 1456, 54746, 51122, 11452) —
  nếu không cần truy cập ngoài thì bỏ bớt rule cho giảm attack surface.

## Troubleshooting

**Site nào trả 502/504:** Caddy chạy nhưng upstream chết.
```bash
sudo systemctl is-active caddy
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:<upstream-port>/   # test trực tiếp
sudo docker ps | grep <container>
sudo docker logs --tail 50 <container>
pm2 list
```

**Site trả lỗi cert / SSL:** có thể cert chưa issue hoặc DNS orange-cloud.
```bash
echo | openssl s_client -connect 127.0.0.1:443 -servername <domain> | openssl x509 -noout -issuer -dates
sudo journalctl -u caddy --no-pager -n 100 | grep -iE 'obtain|challenge|error|<domain>'
```

**Caddy không start / port 443 bị chiếm:** thường do container bind `0.0.0.0:443`.
```bash
sudo ss -tlnp | grep ':443'
# nếu là docker-proxy → sửa compose bind 127.0.0.1 rồi docker compose up -d
sudo systemctl restart caddy
```

**Web chết sau khi deploy docker:** gần như chắc chắn container mới đã bind 443
hoặc ghi đè Caddyfile. Kiểm tra `sudo ss -tlnp | grep ':443'` và
`sudo cat /etc/caddy/Caddyfile` — khôi phục về 5 block ở trên.

## Cập nhật tài liệu này

File này là chân lý runtime trên VPS. Khi đổi kiến trúc (thêm/xóa domain, container,
port), **cập nhật file này ngay trên VPS** (`/home/ubuntu/DEPLOY.md`) và cập nhật
ngày ở đầu file. Repo `docs/deploy/aws-lightsail.md` là bản mirror (track git) —
cập nhật cả hai.
