# AWS Lightsail Deployment

Production host for ziweiai-web on a single Amazon Lightsail instance.

## Instance

- Provider: Amazon Lightsail (Singapore, ap-southeast-1)
- OS: Ubuntu 24.04.4 LTS, OS Only blueprint
- Plan: 2 vCPU / 1.9 GB RAM / 58 GB disk
- Static IPv4: `54.255.81.117` (attached static IP, does not change on stop/start)
- IPv6: enabled
- 2 GB swap added (`/swapfile`, in `/etc/fstab`) to avoid OOM during build on 1.9 GB RAM

## Firewall (IPv4 + IPv6)

| Application | Protocol | Port | Source | Purpose |
|---|---|---|---|---|
| SSH | TCP | 22 | Any | shell access |
| HTTP | TCP | 80 | Any | Caddy (HTTP + ACME redirect) |
| HTTPS | TCP | 443 | Any | Caddy TLS for web + api + cliproxy |
| Custom | TCP | 3000 | Any | temporary direct API access for IP-based testing |

Note: port 3000 is no longer needed publicly — the API is now reached over 443
via Caddy reverse-proxy. Remove this firewall rule in the Lightsail console.

Note: the cliproxy container exposes several additional host ports publicly
(8086, 1456, 54746, 51122, 11452) via its docker-compose port mappings. These
are not used by the web/api stack. If you do not need external access to them,
remove the corresponding Lightsail firewall rules to reduce attack surface.

## Current live state (domain + HTTPS)

- Web: `https://tuvi.monet.uno/` -> HTTP 200 (Caddy serves static SPA, auto Let's Encrypt cert)
- API: `https://api.tuvi.monet.uno/health` -> HTTP 200 (Caddy reverse-proxies localhost:3000)
- CLI Proxy (origin): `https://cliproxy.monet.uno/` -> HTTP 200 (Caddy reverse-proxies
  `127.0.0.1:8333`, the `cli-proxy-api-origin` Docker container; auto Let's Encrypt cert)
- Kiro-Go: `https://kiro-go.monet.uno/` -> HTTP 200 (Caddy reverse-proxies `127.0.0.1:8090`,
  the `kiro-go` Docker container)
- CLI Kiro Proxy: `https://cli-kiro.monet.uno/` -> HTTP 200 (Caddy reverse-proxies
  `127.0.0.1:8317`, the `cli-kiro-proxy` Docker container)
- DNS: Cloudflare zone `monet.uno`, five `A` records (`tuvi`, `api.tuvi`, `cliproxy`,
  `kiro-go`, `cli-kiro`) -> `54.255.81.117`, DNS only (grey cloud, required so Caddy can
  complete the ACME HTTP-01 challenge). Do NOT orange-cloud these records or ACME HTTP-01
  may break.
- CORS: API allows origin `https://tuvi.monet.uno` (preflight 204 verified)
- API runs under pm2 as `ziwei-api`, auto-boots via systemd (`pm2-ubuntu.service`)
- Three Docker containers (`cli-proxy-api-origin`, `kiro-go`, `cli-kiro-proxy`), all
  `restart: unless-stopped`, all bound to `127.0.0.1` only — Caddy is the sole public
  edge on 443 for every domain.
- TODO: remove the public firewall rule for TCP 3000 in the Lightsail console — the
  API is now reached over 443 via Caddy, direct `:3000` exposure is no longer needed.

> Architecture note: Caddy is the single public TLS edge (Let's Encrypt ACME for all
> five domains). Every container binds `127.0.0.1` and speaks HTTP plain; Caddy
> terminates TLS and reverse-proxies to it. The previous Cloudflare Origin Certificate
> + Authenticated Origin Pulls setup (for cliproxy) has been removed — all sites now
> rely on public Let's Encrypt certs plus each app's own auth layer.

## Topology

- `apps/web`: static SPA (adapter-static) built to `apps/web/build/`, served by Caddy.
- `apps/api`: NestJS Node server on port 3000 (`API_PORT`), run under pm2.
- `cli-proxy-api-origin`: Docker container (`eceasy/cli-proxy-api:latest`) running CLI
  Proxy API, bound to `127.0.0.1:8333` (HTTP plain). Caddy reverse-proxies
  `cliproxy.monet.uno` to it. Compose dir: `~/cliproxy/`.
- `kiro-go`: Docker container (`kiro-go:vps-good`, prebuilt Go binary) bound to
  `127.0.0.1:8090` (container listens 8080). Caddy reverse-proxies `kiro-go.monet.uno`
  to it. Compose dir: `~/kiro-go/`.
- `cli-kiro-proxy`: Docker container (`cli-proxy-api:kiro-good`, prebuilt CLIProxyAPI)
  bound to `127.0.0.1:8317`. Caddy reverse-proxies `cli-kiro.monet.uno` to it. Compose
  dir: `~/cli-kiro-proxy/`.
- Supabase: cloud (no DB on this box).

## Env

Single `.env` at repo root (svelte config `env.dir: ../..` reads PUBLIC_* from
root). API reads the same file via walk-up. The local repo `.env` (real secrets,
not git-tracked) was uploaded via scp. Required keys:

- Web (baked into JS at build): `PUBLIC_API_BASE_URL`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
- API (secret): `API_PORT`, `API_CORS_ORIGINS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, plus one AI key (`DEEPSEEK_API_KEY` / `OPENAI_COMPAT_API_KEY` / `GEMINI_API_KEY`)

`API_CORS_ORIGINS` must contain the exact web origin or the browser blocks
requests. Current: `PUBLIC_API_BASE_URL=https://api.tuvi.monet.uno`,
`API_CORS_ORIGINS=https://tuvi.monet.uno`.

## Provision (run on the instance)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm i -g pnpm@10.17.1 pm2
# Caddy (auto HTTPS)
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

## Build + run

```bash
cd ~/ziweiai-web
pnpm install
# pnpm blocks esbuild's postinstall by default; Vite needs its native binary:
pnpm rebuild esbuild
pnpm turbo build
# Built API entry is apps/api/dist/apps/api/src/main.js; run with cwd=apps/api
# so env walk-up finds the root .env.
pm2 start dist/apps/api/src/main.js --name ziwei-api --cwd ~/ziweiai-web/apps/api
pm2 save && pm2 startup
```

## Web serving (current: Caddy + HTTPS)

`/etc/caddy/Caddyfile`:

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

All five sites use Caddy's automatic HTTPS (Let's Encrypt via ACME HTTP-01). DNS
records must be grey cloud (DNS only) so the ACME challenge reaches Caddy directly.

Caddy runs as the `caddy` user, so `/home/ubuntu` needs `chmod o+x` for it to
traverse into the build dir. `sudo systemctl restart caddy` after edits.

### Docker containers (all bind `127.0.0.1`, Caddy is the public edge)

| Container | Compose dir | Image | Host port | Public domain |
|---|---|---|---|---|
| `cli-proxy-api-origin` | `~/cliproxy/` | `eceasy/cli-proxy-api:latest` | `127.0.0.1:8333` | `cliproxy.monet.uno` |
| `kiro-go` | `~/kiro-go/` | `kiro-go:vps-good` (prebuilt) | `127.0.0.1:8090` | `kiro-go.monet.uno` |
| `cli-kiro-proxy` | `~/cli-kiro-proxy/` | `cli-proxy-api:kiro-good` (prebuilt) | `127.0.0.1:8317` | `cli-kiro.monet.uno` |

Do NOT bind any container to `0.0.0.0:443` (or `0.0.0.0:80`) — that conflicts with
Caddy and takes down every site. The `cli-proxy-api-origin` container's `config.yaml`
has `tls.enable: false` so it speaks HTTP plain; the kiro-go / cli-kiro-proxy
containers also serve HTTP plain on their loopback ports. Caddy terminates TLS for
all public domains.

Recreate after compose/config changes (run in the relevant dir):

```bash
cd ~/cliproxy       && sudo docker compose up -d
cd ~/kiro-go        && sudo docker compose -f docker-compose.vps.yml up -d
cd ~/cli-kiro-proxy && sudo docker compose -f docker-compose.vps.yml up -d
```

## Update flow

```bash
# Web + API (ziweiai-web)
cd ~/ziweiai-web && git pull && pnpm install && pnpm turbo build && pm2 restart ziwei-api && sudo systemctl reload caddy

# CLI Proxy origin (cliproxy) — only when the image or config.yaml changes
cd ~/cliproxy && sudo docker compose up -d   # pulls latest image (pull_policy: always) and recreates

# kiro-go — only when the prebuilt image or config changes
cd ~/kiro-go && sudo docker compose -f docker-compose.vps.yml up -d

# cli-kiro-proxy — only when the prebuilt image or config changes
cd ~/cli-kiro-proxy && sudo docker compose -f docker-compose.vps.yml up -d
```

Web is static: after `pnpm turbo build` the new `apps/web/build/` is served by
Caddy immediately (reload only needed if the Caddyfile changed). If any
`PUBLIC_*` env changed you must rebuild for it to take effect (those values are
baked into the JS at build time, not read at runtime).

Never bind any container to `0.0.0.0:443` or stop Caddy to "make room" for it —
that takes down every site. Caddy owns 443; all containers bind localhost only.
