<!-- @format -->

# 🚀 Deployment Guide - FSM System

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificate ready
- [ ] Domain name configured
- [ ] Monitoring tools set up

## Deployment Options

### Option 1: VPS (DigitalOcean, Linode, AWS EC2)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE fsm_db;
CREATE USER fsm_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE fsm_db TO fsm_user;
\q
```

#### 3. Application Setup

```bash
# Clone repository
git clone <your-repo-url>
cd outside-Project-backend

# Install dependencies
npm install --production

# Set up environment
nano .env
# Add production DATABASE_URL and other configs

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Seed initial data (optional)
npm run prisma:seed

# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

#### 4. Start with PM2

```bash
# Start application
pm2 start src/server.js --name fsm-backend

# Set up auto-restart on system reboot
pm2 startup
pm2 save

# Monitor logs
pm2 logs fsm-backend
```

#### 5. Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/fsm-backend
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fsm-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

### Option 2: Heroku

#### 1. Prepare Application

```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create fsm-backend-prod
```

#### 2. Add PostgreSQL

```bash
# Add Heroku Postgres
heroku addons:create heroku-postgresql:mini

# Database URL is automatically set
```

#### 3. Configure Environment

```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-key
```

#### 4. Deploy

```bash
# Add Procfile
echo "web: node src/server.js" > Procfile

# Commit and push
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

---

### Option 3: Docker

#### 1. Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "src/server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: fsm_db
      POSTGRES_USER: fsm_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://fsm_user:secure_password@postgres:5432/fsm_db
      JWT_SECRET: your-super-secret-key
      NODE_ENV: production
    depends_on:
      - postgres
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
```

#### 3. Deploy

```bash
# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed data
docker-compose exec app npm run prisma:seed
```

---

## Production Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Security
JWT_SECRET="generate-strong-random-string-here"
NODE_ENV="production"

# Server
PORT=3000

# CORS (optional)
ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"

# SMS Provider (optional)
SMS_API_KEY="your-sms-api-key"
SMS_API_SECRET="your-sms-api-secret"

# Push Notifications (optional)
FIREBASE_SERVER_KEY="your-firebase-key"
```

## Security Best Practices

### 1. Secure Environment Variables

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Database Security

- Use strong passwords
- Enable SSL for database connections
- Regular backups
- Limit network access

### 3. Application Security

- Keep dependencies updated: `npm audit fix`
- Use rate limiting
- Enable CORS properly
- Validate all inputs
- Use HTTPS only

### 4. Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Backup Strategy

### Database Backup

```bash
# Manual backup
pg_dump -U fsm_user -d fsm_db > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 2 * * * pg_dump -U fsm_user -d fsm_db > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Restore Database

```bash
psql -U fsm_user -d fsm_db < backup_20251117.sql
```

## Scaling Considerations

### Vertical Scaling

- Increase server RAM/CPU
- Optimize database queries
- Enable database connection pooling

### Horizontal Scaling

- Use load balancer (Nginx, HAProxy)
- Multiple application instances with PM2 cluster mode
- Database read replicas
- Redis for caching

### PM2 Cluster Mode

```bash
pm2 start src/server.js -i max --name fsm-backend
```

## Monitoring & Logs

### Application Logs

```bash
# View PM2 logs
pm2 logs fsm-backend

# View specific lines
pm2 logs fsm-backend --lines 100

# Clear logs
pm2 flush
```

### Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Troubleshooting Production Issues

### High Memory Usage

```bash
# Check PM2 memory
pm2 monit

# Restart if needed
pm2 restart fsm-backend
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### Application Crashes

```bash
# Check PM2 logs
pm2 logs fsm-backend --err

# Check system logs
journalctl -u fsm-backend
```

## Health Check Endpoint

Add to your application:

```javascript
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

## Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/fsm-backend
            git pull
            npm install
            npx prisma migrate deploy
            pm2 restart fsm-backend
```

## Performance Optimization

1. **Enable gzip compression**
2. **Use CDN for static files**
3. **Database indexing**
4. **Query optimization**
5. **Caching with Redis**
6. **Connection pooling**

## Post-Deployment

- [ ] Test all critical endpoints
- [ ] Verify database migrations
- [ ] Check logs for errors
- [ ] Test authentication flow
- [ ] Verify file uploads work
- [ ] Test notifications
- [ ] Monitor performance
- [ ] Set up alerts

---

## Support & Maintenance

### Regular Tasks

- Monitor error logs daily
- Review performance metrics weekly
- Update dependencies monthly
- Database backup verification weekly
- Security audit quarterly

### Emergency Contacts

- System Admin: [contact]
- Database Admin: [contact]
- DevOps: [contact]

---

**Note:** Always test deployment in a staging environment before pushing to production!
