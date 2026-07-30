# Deploying AppPassport to an Ionos VPS

AppPassport is a standard Next.js 14 app running in Node's production server
(`next start`). Any Linux VPS with Node 20+ works; below is an Ubuntu/Debian
setup with **nginx** as a reverse proxy, **PM2** to keep the process alive, and
**Let's Encrypt** for HTTPS on `passport.traveltechnician.info`.

## 0. DNS

Point an **A record** for `passport.traveltechnician.info` at your Ionos VPS's
public IP before requesting a certificate.

## 1. Server prerequisites

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

## 2. Get the code

```bash
sudo mkdir -p /var/www/apppassport && sudo chown "$USER" /var/www/apppassport
git clone https://github.com/jamesshortall/passport.git /var/www/apppassport
cd /var/www/apppassport
git checkout claude/apppassport-travel-app-4hlbc2   # or main once merged
```

## 3. Environment

Create `/var/www/apppassport/.env.local` (never commit it):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xkaeaupdopopjbhrxzsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
NEXT_PUBLIC_SITE_URL=https://passport.traveltechnician.info
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # server-only; used by admin actions
```

> Next.js inlines `NEXT_PUBLIC_*` at **build time** — always build *after*
> writing `.env.local`, and rebuild if you change them.

## 4. Build & run

```bash
npm ci
npm run build
pm2 start npm --name apppassport -- start   # runs `next start` on port 3000
pm2 save
pm2 startup    # follow the printed command so it restarts on reboot
```

The app now listens on `http://127.0.0.1:3000`.

## 5. nginx reverse proxy

`/etc/nginx/sites-available/apppassport`:

```nginx
server {
    listen 80;
    server_name passport.traveltechnician.info;

    # Serve country thumbnails straight from disk (populated by the "prebuild"
    # step, scripts/sync-thumbs.mjs) instead of proxying to Node. Same-origin +
    # local disk + long cache = fast browse grid. A missing file 404s and the
    # app falls back to the Supabase URL automatically.
    location /country-heroes/ {
        root       /var/www/apppassport/public;
        expires    30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Allow large upstream response headers. The /auth/callback redirect
        # sets the full Supabase session cookies; with the default buffer nginx
        # rejects it as "upstream sent too big header" and returns 502.
        proxy_buffer_size       16k;
        proxy_buffers           8 16k;
        proxy_busy_buffers_size 32k;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/apppassport /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 6. HTTPS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d passport.traveltechnician.info
```

Certbot rewrites the nginx config for TLS and sets up auto-renewal.

## 7. Deploying updates

```bash
cd /var/www/apppassport
git pull
npm ci
npm run build
pm2 reload apppassport
```

## Supabase Auth redirect URLs

In the Supabase dashboard → Authentication → URL Configuration, set:
- **Site URL:** `https://passport.traveltechnician.info`
- **Redirect URLs:** `https://passport.traveltechnician.info/auth/callback`

(Google OAuth also needs this callback in the Google Cloud console.)

## Edge Functions & scheduled digests

Edge functions still deploy to Supabase (not the VPS):

```bash
supabase functions deploy draft-country
supabase functions deploy notify-approval
supabase functions deploy digest-favorites
supabase secrets set OPENAI_API_KEY=... RESEND_API_KEY=... RESEND_FROM="AppPassport <hello@traveltechnician.info>"
```

Schedule `digest-favorites` daily/weekly via Supabase scheduled functions.
