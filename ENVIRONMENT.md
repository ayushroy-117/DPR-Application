# DPR Generator - Environment Setup

## Backend Environment Variables (.env)

Copy `.env.example` to `.env` and configure:

```bash
# Database Connection
MONGODB_URI=mongodb://localhost:27017/dpr-db
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dpr-db?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-very-long-secret-key-minimum-32-characters-recommended
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
# For production: NODE_ENV=production
```

## Environment Variable Descriptions

### MONGODB_URI
- **Purpose**: Connection string to MongoDB database
- **Local**: `mongodb://localhost:27017/dpr-db`
- **Atlas Cloud**: `mongodb+srv://user:password@cluster.mongodb.net/dpr-db`
- **Required**: Yes

### JWT_SECRET
- **Purpose**: Secret key for signing JWT tokens
- **Requirements**: 
  - Minimum 32 characters
  - Use strong random characters
  - Change for each environment
- **Required**: Yes
- **Example**: `your-super-secret-jwt-key-minimum-32-chars-change-this`

### JWT_EXPIRE
- **Purpose**: Token expiration time
- **Format**: `7d` (7 days), `24h` (24 hours), `1y` (1 year)
- **Default**: `7d`
- **Required**: Yes

### PORT
- **Purpose**: Port number for backend server
- **Default**: 5000
- **Range**: 1024-65535
- **Required**: No

### NODE_ENV
- **Purpose**: Environment mode
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Required**: No

## Generating JWT_SECRET

### Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using OpenSSL
```bash
openssl rand -hex 32
```

### Using Python
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Development vs Production

### Development (.env)
```
MONGODB_URI=mongodb://localhost:27017/dpr-db
JWT_SECRET=dev-secret-key-change-before-production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### Production (.env.production)
```
MONGODB_URI=mongodb+srv://prod-user:secure-password@prod-cluster.mongodb.net/dpr-db
JWT_SECRET=generate-strong-secret-key-32-chars-minimum
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
```

## Security Best Practices

1. **Never commit .env file** to version control
2. **Use .gitignore** to exclude environment files
3. **Rotate JWT_SECRET** periodically
4. **Use strong passwords** for database users
5. **Enable HTTPS** in production
6. **Whitelist IPs** in MongoDB Atlas
7. **Use environment variables** for all secrets
8. **Different secrets** for each environment
9. **Store secrets** in vault/secrets manager (production)
10. **Audit access** to environment variables

## Variables Reference

| Variable | Type | Required | Default | Example |
|----------|------|----------|---------|---------|
| MONGODB_URI | String | Yes | - | mongodb://localhost:27017/dpr-db |
| JWT_SECRET | String | Yes | - | abc123def456ghi789jkl012mno345pqr |
| JWT_EXPIRE | String | Yes | 7d | 7d, 24h, 1y |
| PORT | Number | No | 5000 | 5000, 8000 |
| NODE_ENV | String | No | development | development, production, test |

## Troubleshooting

### Connection String Errors
- Check MongoDB is running
- Verify credentials if using Atlas
- Whitelist IP in MongoDB Atlas
- Test connection: `mongo "<uri>"`

### JWT Token Issues
- Ensure JWT_SECRET is set
- Verify token format in requests
- Check token expiration
- Encode secret properly (no special chars in bash)

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Accessing Variables in Code

```javascript
// Use process.env in Node.js
const mongoUrl = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const port = process.env.PORT || 5000;
```

## Default Values

Some variables have defaults if not set:
```javascript
PORT: process.env.PORT || 5000
NODE_ENV: process.env.NODE_ENV || 'development'
```

## Example Complete .env File

```
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/dpr-db

# Authentication
JWT_SECRET=aF9dK2mL5pQ8sT1uV4wX7yZ0bC3eG6hJ9kM2nP5sT8vW1yZ4cF7iJ0lM3oPqRuTwXyZa

# Server
PORT=5000
NODE_ENV=development

# Optional
NODE_SKIP_PLATFORM_CHECK=true
```

## Production Deployment

For production, use your hosting platform's secrets management:

### Vercel
- Go to Project Settings > Environment Variables
- Add variables for production

### Heroku
```bash
heroku config:set MONGODB_URI=<uri>
heroku config:set JWT_SECRET=<secret>
```

### AWS
- Use AWS Secrets Manager or Parameter Store

### Azure
- Use Azure Key Vault

### Google Cloud
- Use Secret Manager

## Monitoring

```javascript
// Log which env is being used
console.log(`Running in ${process.env.NODE_ENV} mode`);

// Validate required variables
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}
```

## Updates & Changes

- Version: 2024.01
- Last Updated: February 7, 2026
