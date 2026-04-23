# Quick Start Guide

Get the DPR Generator application up and running in 10 minutes.

## System Requirements

- **Node.js**: v14 or higher
- **npm**: v6 or higher
- **MongoDB**: Local or Atlas account
- **Git**: For cloning (optional)

---

## 1. Setup MongoDB

### Option A: Local MongoDB

Download and install from: https://www.mongodb.com/try/download/community

**Start MongoDB**:
```bash
# macOS
brew services start mongodb-community

# Windows
mongod

# Linux
sudo systemctl start mongod
```

### Option B: MongoDB Atlas (Cloud - Recommended)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Create database user (username + password)
4. Get connection string (looks like: `mongodb+srv://...`)

---

## 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env
# Windows:
# copy .env.example .env

# Edit .env file with your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/dpr-db
# or if using Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dpr-db

# Start backend server
npm run dev
```

**Expected**: Backend running on `http://localhost:5000`

```
Server running on port 5000
MongoDB connected
```

---

## 3. Setup Frontend (New Terminal)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

**Expected**: Frontend running on `http://localhost:3000`

```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:3000/
```

---

## 4. Access Application

Open your browser and go to: **http://localhost:3000**

---

## 5. Create Test Account

1. Click **Sign Up**
2. Fill in details:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
3. Click **Sign Up**

---

## 6. Create a Test Project

1. Click **Create New Project**
2. Fill 7-step form with sample data:

**Step 1 - Basic Info**:
- Business Name: `Sample Business`
- Promoter Name: `John Doe`
- Address: `123 Main Street`
- Phone: `9876543210`
- Business Type: `Manufacturing`
- Scheme: `Mudra`
- Employees: `5`

**Step 2 - Project Cost**:
- Furniture: `₹100,000`
- Electrification: `₹50,000`
- Machinery: `₹500,000`
- Preliminary: `₹50,000`
- Other: `₹100,000`

**Step 3 - Working Capital**:
- Stock: `₹100,000`
- Receivables: `₹50,000`
- Expenses: `₹100,000`
- Payables: `₹50,000`

**Step 4 - Finance**:
- Margin: `20`
- Term Loan: `80`
- WC Loan: `100`

**Step 5 - Revenue**:
- Model: `Monthly Sales`
- Monthly Sales: `₹100,000`
- Growth: `5`

**Step 6 - Expenses**:
- Salary: `₹30,000`
- Electricity: `₹5,000`
- Raw Materials: `₹40,000`
- Transport: `₹5,000`
- Misc: `₹5,000`
- Escalation: `3`

**Step 7 - Loan**:
- Amount: `₹640,000`
- Interest: `12`
- Tenure: `60`
- Moratorium: `0`

3. Click **Create Project**
4. View in Projects list

---

## 7. Generate PDF Report

1. Go to **Projects** list
2. Click **Download PDF** button for your project
3. PDF will download to your computer

---

## 8. Explore Features

### Dashboard
- Overview of all projects
- Quick action buttons
- Getting started guide

### Projects List
- View all your projects
- Status: Draft, Submitted, Approved, Rejected
- Actions: View, Edit, Download PDF, Delete

### Project Details
- **Summary Tab**: Quick financial overview
- **Financials Tab**: Profitability statements
- **Charts Tab**: Visual representations
- **EMI Tab**: Loan repayment schedule

---

## 10-Minute Checklist

- [ ] MongoDB running
- [ ] Backend started on port 5000
- [ ] Frontend started on port 3000
- [ ] Open http://localhost:3000
- [ ] Create account
- [ ] Create project with sample data
- [ ] View project details
- [ ] Download PDF report

---

## Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB connection failed
```
**Solution**: 
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- If using Atlas, check whitelist IP

### Frontend Can't Connect to Backend
```
Error: Failed to fetch from API
```
**Solution**:
- Check backend is running on port 5000
- Check CORS is enabled in backend
- Update proxy in vite.config.js

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**:
```bash
# Kill process on port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## Useful API Endpoints to Test

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create Project (Replace token)
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Get All Projects
```bash
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Next Steps

1. **Customize Data**: Modify project inputs for your needs
2. **Deploy**: Follow DEPLOYMENT.md for production setup
3. **Enhance**: Add more features from the roadmap
4. **Database**: Switch to MongoDB Atlas for production
5. **Styling**: Customize colors and branding

---

## Useful Commands

```bash
# Backend
npm run dev          # Start with auto-reload
npm start            # Start production
npm test             # Run tests (if configured)

# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

---

## File Locations

- **Frontend**: `frontend/` → Frontend React app
- **Backend**: `backend/` → Node.js + Express API
- **Database**: `localhost:27017` or MongoDB Atlas
- **Frontend Assets**: `frontend/src/`
- **Backend Routes**: `backend/routes/`
- **Database Models**: `backend/models/`

---

## Documentation

For detailed information:
- **API Docs**: See [API.md](./API.md)
- **Database Schema**: See [DATABASE.md](./DATABASE.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Main README**: See [README.md](./README.md)

---

## Support

If you encounter any issues:
1. Check troubleshooting section above
2. Review error messages in browser console (F12)
3. Check backend logs in terminal
4. Review documentation files
5. Create GitHub issue with details

---

## Security Note

⚠️ **IMPORTANT**: 
- Change JWT_SECRET in .env to a strong, random value
- Don't commit .env file (use .env.example)
- Use HTTPS in production
- Keep dependencies updated: `npm update`

---

**Happy DPR Generating! 🚀**
