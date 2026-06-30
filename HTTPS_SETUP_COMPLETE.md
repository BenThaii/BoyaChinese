# HTTPS Setup Complete ✓

## Status
HTTPS has been successfully configured on your EC2 instance with a self-signed certificate.

## Access URLs
- **HTTP:**  `http://13.212.235.9` → Automatically redirects to HTTPS
- **HTTPS:** `https://13.212.235.9` (with self-signed certificate warning)

## Configuration Details

### Certificate Information
- **Type:** Self-signed X.509 certificate
- **Duration:** Valid for 365 days (until June 29, 2027)
- **Location on EC2:**
  - Certificate: `/etc/nginx/ssl/certificate.crt`
  - Private Key: `/etc/nginx/ssl/private.key`

### Nginx Configuration
- Port 80 (HTTP) configured to redirect all traffic to HTTPS
- Port 443 (HTTPS/HTTP2) configured with SSL/TLS
- All API routes proxied to backend on port 3000 with correct headers
- Frontend served with caching headers

### SSL/TLS Security
- Protocols: TLSv1.2, TLSv1.3 (modern standards)
- Ciphers: HIGH:!aNULL:!MD5 (strong encryption)
- HSTS Header: `max-age=31536000; includeSubDomains` (forces HTTPS for 1 year)

### What Works
✓ All HTTP requests redirect to HTTPS  
✓ Frontend loads over HTTPS  
✓ API calls work over HTTPS  
✓ Login functionality works  
✓ Admin panel accessible  
✓ Phrases and vocabulary endpoints work  

### Browser Warning
⚠️ **Expected:** Browsers will show a security warning when accessing the site.

This is normal and safe because the certificate is self-signed (not signed by a Certificate Authority). You can:
1. Click "Advanced" → "Proceed to site" (Chrome/Edge)
2. Click "Accept Risk and Continue" (Firefox)
3. Or add a security exception in your browser

### Upgrade Path
To eliminate the browser warning and get a trusted certificate, you can upgrade to Let's Encrypt:

1. **Get a domain name** (~$1-5/year from Namecheap, GoDaddy, etc.)
2. **Point DNS to your EC2 IP:** `13.212.235.9`
3. **Install Certbot** on EC2:
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```
4. **Generate Let's Encrypt certificate:**
   ```bash
   sudo certbot certonly --nginx -d yourdomain.com
   ```
5. **Update Nginx config** to use the Let's Encrypt certificate

### Maintenance
- Certificate renewal: Manual renewal needed before June 29, 2027
- To renew before expiry, re-run the certificate generation command on EC2:
  ```bash
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/private.key \
    -out /etc/nginx/ssl/certificate.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=chinese-learning-app"
  ```

### Commands on EC2
```bash
# View SSL certificate details
sudo openssl x509 -in /etc/nginx/ssl/certificate.crt -text -noout

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx (after config changes)
sudo systemctl reload nginx
```

## Next Steps
1. ✓ Test the site at `https://13.212.235.9` - you should see the self-signed cert warning
2. Optional: Get a domain name and upgrade to Let's Encrypt for a trusted certificate
3. Share the HTTPS link with users (they can bypass the browser warning)

---
**Setup Date:** June 30, 2026  
**Setup Method:** Self-signed certificate with Nginx reverse proxy  
**Backend:** Running on localhost:3000  
**Frontend:** Served from `/var/www/chinese-learning-app/packages/frontend/dist/`
