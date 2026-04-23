# MongoDB Connection Error - Fix Guide

## Error Analysis
```
❌ MongoDB connection error: querySrv ECONNREFUSED _mongodb._tcp.cluster0.eudohx7.mongodb.net
```

This error occurs when MongoDB can't resolve the DNS name for your Atlas cluster.

## Common Causes & Solutions

### Solution 1: Update MongoDB Connection String (RECOMMENDED)

The `.env` file has outdated credentials. Update it:

```bash
# Step 1: Go to MongoDB Atlas Dashboard
# URL: https://cloud.mongodb.com/v2/

# Step 2: Click on "Connect" on your cluster
# Step 3: Select "Drivers" → "Node.js"
# Step 4: Copy the connection string

# Step 5: Update your .env file with:
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority
```

**Replace:**
- `YOUR_USERNAME` - MongoDB Atlas database user
- `YOUR_PASSWORD` - Database user password (URL encode if special chars: `@` → `%40`)
- `YOUR_CLUSTER` - Your cluster name (e.g., `cluster0.abc123`)
- `YOUR_DATABASE` - Database name (e.g., `dpr-db`)

### Solution 2: Configure Network Access in MongoDB Atlas

If you've updated the connection string but still get errors:

1. **Go to MongoDB Atlas Dashboard** → https://cloud.mongodb.com
2. **Select your project** and cluster
3. **Click "Network Access"** (left sidebar)
4. **Add IP Address**:
   - Click **"Add IP Address"**
   - Add current machine IP: `127.0.0.1` (for local) 
   - Or allow all: `0.0.0.0/0` (NOT RECOMMENDED for production)
   - Click **"Confirm"**

### Solution 3: Verify Database User Exists

1. **Go to MongoDB Atlas Dashboard** → Select your cluster
2. **Click "Database Access"** (left sidebar)
3. **Verify the user exists** that matches your connection string
4. If missing, **create a new database user**:
   - Click **"Add New Database User"**
   - Set username & password
   - Select roles: **`readWrite@admin`** or custom
   - Click **"Add User"**

### Solution 4: Use Local MongoDB (Alternative)

If MongoDB Atlas is causing issues, use local MongoDB:

```bash
# 1. Install MongoDB Community: https://www.mongodb.com/try/download/community
# 2. Start MongoDB:
#    macOS: brew services start mongodb-community
#    Windows: mongod
#    Linux: sudo systemctl start mongod

# 3. Update .env file:
MONGODB_URI=mongodb://localhost:27017/dpr-db
```

### Solution 5: Check Connection String Format

Verify your connection string format:

```
✅ CORRECT FORMATS:
- mongodb://localhost:27017/dpr-db (local)
- mongodb+srv://user:pass@cluster.mongodb.net/dbname (Atlas)

❌ COMMON MISTAKES:
- Missing database name: mongodb+srv://...mongodb.net/ (ADD /dbname)
- Unencoded special chars: password with @ should be %40
- Missing credentials: mongodb+srv://@cluster.mongodb.net/
- Typo in cluster name: cluster0.abc123xyz (verify exact name)
```

### Solution 6: Handle Special Characters in Password

If your MongoDB password contains special characters:

```
Original password: P@ssw0rd!#
URL encoded:       P%40ssw0rd%21%23

Use in connection string:
mongodb+srv://user:P%40ssw0rd%21%23@cluster.mongodb.net/dpr-db
```

## How to Identify Your Connection String

### From MongoDB Atlas Dashboard:
1. Log in to https://cloud.mongodb.com
2. Click **Clusters** → Select your cluster
3. Click **"Connect"** button
4. Choose **"Drivers"** tab
5. Select **Node.js** from dropdown
6. Copy the connection string shown
7. Replace `<username>`, `<password>`, `<dbname>`

## Testing Your Connection

After updating `.env`:

```bash
# 1. Navigate to backend
cd backend

# 2. Clear old sessions (optional)
rm -rf node_modules
npm install

# 3. Start server
npm run dev

# Expected success output:
# Server running on port 5000
# ✅ MongoDB connected successfully
```

## Current Configuration

**Current `.env`**:
```
MONGODB_URI=mongodb+srv://dprgenerator:7bZf8WBBEhsuqmgM@cluster0.ulvblfh.mongodb.net/?appName=Cluster0
```

**Error shows trying to connect to**:
```
cluster0.eudohx7.mongodb.net (from .env.example)
```

**Action Required**: Update `.env` with the correct credentials or use `.env.example` if that's the active cluster.

## Quick Fix Steps

1. **Open `.env`** file in your backend directory
2. **Get current connection string** from MongoDB Atlas Console
3. **Update `MONGODB_URI`** with current credentials
4. **Save** the file
5. **Restart** your backend server
6. **Check output** - you should see `✅ MongoDB connected successfully`

## Still Having Issues?

Run this diagnostic command:

```bash
# In backend directory
node -e "
require('dotenv').config();
const uri = process.env.MONGODB_URI;
console.log('Connection String:', uri ? uri.substring(0, 50) + '...' : 'NOT SET');
console.log('Cluster:', uri ? uri.match(/cluster\d[^.]*/) : 'NOT FOUND');
"
```

This shows what connection string your app is actually using.
