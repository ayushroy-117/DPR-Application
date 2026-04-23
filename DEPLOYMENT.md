# Deployment Guide

## Local Development Setup

### Quick Start (MacOS/Linux)

```bash
# 1. Clone and setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev

# 2. In another terminal, setup frontend
cd frontend
npm install
npm run dev

# 3. Open browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Quick Start (Windows PowerShell)

```powershell
# 1. Backend
cd backend
npm install
Copy-Item .env.example .env
# Edit .env with MongoDB URI
npm run dev

# 2. Frontend (new terminal/window)
cd frontend
npm install
npm run dev
```

---

## Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend - Vercel Deployment

1. **Prepare Frontend**
```bash
cd frontend
npm run build
```

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Import GitHub repository
   - Select `frontend` as root directory
   - Add environment variables (if needed)
   - Deploy

3. **Update Backend URL**
   - In Vercel project settings, add environment variables:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

#### Backend - Railway Deployment

1. **Prepare Backend**
```bash
cd backend
# Ensure package.json has start script
# "start": "node server.js"
```

2. **Deploy to Railway**
   - Go to https://railway.app
   - Create new project
   - Connect GitHub repository
   - Select `backend` directory
   - Add environment variables:
     ```
     MONGODB_URI=<your-mongodb-uri>
     JWT_SECRET=<strong-secret-key>
     PORT=5000
     NODE_ENV=production
     ```
   - Deploy

3. **Get Backend URL**
   - Railway provides domain like: `your-app.railway.app`
   - Update frontend to use this URL

---

### Option 2: Heroku (Full Stack)

#### Backend on Heroku

1. **Install Heroku CLI**
```bash
# Mac
brew install heroku/brew/heroku

# Windows (via npm)
npm install -g heroku
```

2. **Deploy Backend**
```bash
cd backend
heroku login
heroku create your-dpr-api
git push heroku main

# Add environment variables
heroku config:set MONGODB_URI=<uri> JWT_SECRET=<secret>
```

3. **Get Backend URL**
```
https://your-dpr-api.herokuapp.com
```

#### Frontend on Netlify

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Deploy to Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

### Option 3: Docker Containerization

#### Dockerfile for Backend

```dockerfile
# backend/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### Dockerfile for Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DB: dpr-db
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/dpr-db
      JWT_SECRET: your-secret
      NODE_ENV: production
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: http://localhost:5000/api

volumes:
  mongodb_data:
```

**Deploy with Docker Compose**:
```bash
docker-compose up -d
```

---

### Option 4: AWS Deployment

#### Frontend to S3 + CloudFront

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Upload to S3**
```bash
aws s3 sync dist/ s3://your-bucket-name
```

3. **Setup CloudFront** for CDN distribution

#### Backend to EC2

1. **Launch EC2 Instance**
   - Choose Node.js AMI
   - Open ports 5000 (for backend)

2. **SSH into instance**
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

3. **Setup Backend**
```bash
git clone your-repo
cd backend
npm install
npm start
```

4. **Use PM2 for process management**
```bash
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

---

### Option 5: Google Cloud / Azure

#### Google Cloud Run

1. **Build and Push Container**
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/dpr-api
```

2. **Deploy**
```bash
gcloud run deploy dpr-api \
  --image gcr.io/PROJECT-ID/dpr-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars MONGODB_URI=<uri>,JWT_SECRET=<secret>
```

#### Azure App Service

1. **Create App Service**
```bash
az group create -n dpr-rg -l eastus
az appservice plan create -n dprplan -g dpr-rg --sku B1
az webapp create -n dpr-api -g dpr-rg --plan dprplan
```

2. **Deploy Code**
```bash
az webapp deployment source config-zip -n dpr-api -g dpr-rg -url <zip-url>
```

---

## Database Deployment

### MongoDB Atlas (Recommended)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up free account

2. **Create Cluster**
   - Choose free tier
   - Select region
   - Create database user
   - Whitelist IP addresses

3. **Get Connection String**
```
mongodb+srv://username:password@cluster.mongodb.net/dpr-db?retryWrites=true&w=majority
```

4. **Update Environment Variable**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dpr-db
```

### Self-Hosted MongoDB

1. **On Linux Server**
```bash
# Install MongoDB
sudo apt-get install mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Access MongoDB
mongo
> use dpr-db
> db.createCollection("users")
```

2. **Update Connection String**
```
MONGODB_URI=mongodb://your-server-ip:27017/dpr-db
```

---

## Environment Variables Checklist

### Development (.env)
```
MONGODB_URI=mongodb://localhost:27017/dpr-db
JWT_SECRET=dev-secret-key-change-this
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### Production (.env.production)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dpr-db
JWT_SECRET=production-secret-key-min-32-chars-long
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
```

---

## CI/CD Pipeline Example (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm install
      
      - name: Run tests
        run: cd backend && npm test || true
      
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g railway
          railway up

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Build
        run: cd frontend && npm run build
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          vercel --prod
```

---

## Performance Optimization

### Frontend Optimization

1. **Image Optimization**
```bash
# Use next-image or custom lazy loading
npm install next-image
```

2. **Code Splitting** (already done by Vite)

3. **Caching Headers** (in vercel.json)
```json
{
  "headers": [{
    "source": "/dist/assets/(.*)",
    "headers": [{
      "key": "Cache-Control",
      "value": "max-age=31536000"
    }]
  }]
}
```

### Backend Optimization

1. **Database Indexes** (already created)

2. **Caching** (add Redis later)
```bash
npm install redis
```

3. **Compression**
```javascript
import compression from 'compression'
app.use(compression())
```

---

## SSL/TLS Certificate

### Free Certificate with Let's Encrypt

```bash
# Use Certbot
sudo certbot certonly --standalone -d yourdomain.com
sudo certbot renew --dry-run
```

### Platforms with Built-in SSL
- Vercel: Automatic
- Railway: Automatic
- Heroku: Automatic
- AWS CloudFront: Supports SSL
- Netlify: Automatic

---

## Monitoring & Logging

### Backend Monitoring

```javascript
// Add monitoring to server.js
import morgan from 'morgan'
app.use(morgan('combined'))

// Log errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})
```

### Services
- **Sentry**: Error tracking
- **New Relic**: Performance monitoring
- **LogRocket**: User behavior logging
- **Datadog**: Infrastructure monitoring

---

## Backup Strategy

### MongoDB Backup

```bash
# Scheduled backup
0 2 * * * mongodump --db dpr-db --out /backups/$(date +\%Y-\%m-\%d)

# Restore
mongorestore --db dpr-db /backups/2024-01-15
```

### Cloud Backups
- MongoDB Atlas: Automatic backups included
- AWS: Use S3 for file backups
- Google Cloud: Cloud Storage

---

## Scaling Considerations

1. **Horizontal Scaling**
   - Run multiple backend instances
   - Use load balancer (AWS ELB, Google LB)
   - Session management with Redis

2. **Vertical Scaling**
   - Increase server resources
   - Optimize database queries

3. **Database Scaling**
   - MongoDB sharding
   - Read replicas

---

## Troubleshooting Deployment

### Common Issues

1. **CORS Errors**
```javascript
// Update backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
```

2. **MongoDB Connection Issues**
```bash
# Check connection string
# Verify whitelist in MongoDB Atlas
# Test with: mongo <connection-string>
```

3. **Environment Variables Not Loading**
```bash
# Restart application after adding env vars
# Verify in platform: Settings > Environment Variables
```

4. **Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Production Checklist

- [ ] Database backups configured
- [ ] Environment variables set correctly
- [ ] SSL/TLS certificates configured
- [ ] Error monitoring enabled (Sentry)
- [ ] Logging configured
- [ ] CORS origins updated
- [ ] Database indexes created
- [ ] Admin user created
- [ ] Firewalls configured
- [ ] Rate limiting enabled (if needed)
- [ ] CDN configured for static assets
- [ ] DNS records pointing correctly
- [ ] Auto-scaling configured
- [ ] Disaster recovery plan documented
