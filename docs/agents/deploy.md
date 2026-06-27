# Deploy / Production

> Read this when: asked to deploy, redeploy, ship to production, or SSH into the
> prod host.

Single AWS Lightsail instance (Ubuntu 24.04, Singapore, IP `54.255.81.117`).
**Read `docs/deploy/aws-lightsail.md` before deploying.**

- Web: `https://tuvi.monet.uno` (Caddy → static SPA `apps/web/build/`)
- API: `https://api.tuvi.monet.uno` (Caddy → `localhost:3000`); health: `/health` → 200
- DNS: Cloudflare `monet.uno`, `A` records → static IP, grey cloud (ACME HTTP-01)
- SSH: `ssh -i docs/deploy/LightsailDefaultKey-ap-southeast-1.pem ubuntu@54.255.81.117`
- Redeploy: `cd ~/ziweiai-web && git pull && pnpm install && pnpm turbo build && pm2 restart ziwei-api && sudo systemctl reload caddy`
- `PUBLIC_*` baked at build time → rebuild on change. `API_CORS_ORIGINS` must match web origin.

Confirm with user before deploying. Never commit `.env` or SSH keys.
