# DPR Generator - Full Stack Application

A comprehensive web application for generating professional Detailed Project Reports (DPR) and Loan Feasibility Reports in PDF format. Designed to replicate government loan project reports such as Mudra, Swabalamban, and other lending scheme requirements.

## Features

### Core Functionality
- ✓ User Authentication (Login/Signup with JWT)
- ✓ Multi-step Project Input Form (7 steps)
- ✓ Comprehensive Financial Calculations
- ✓ Professional PDF DPR Generation
- ✓ Financial Projections (5 years)
- ✓ EMI Schedule Generation
- ✓ Financial Ratios Calculation (DSCR, Debt-Equity, etc.)
- ✓ Interactive Charts and Visualizations
- ✓ Project Management Dashboard

### Project Input Sections
1. **Basic Information** - Business & promoter details
2. **Project Cost** - Fixed capital and equipment costs
3. **Working Capital** - Current assets and liabilities
4. **Means of Finance** - Loan structure and margin
5. **Revenue Projection** - 3 models (daily/monthly/production-based)
6. **Expense Projection** - Operating expenses with growth rates
7. **Loan Details** - Amount, tenure, interest rate, moratorium

### PDF Report Contents
- Cover Page
- Project at a Glance (Summary)
- Promoter Details
- Project Cost Statement
- Working Capital Computation
- Means of Finance
- Revenue Projections (5 years)
- Expense Statement
- Profitability Statement
- Financial Ratios Analysis
- EMI Schedule
- Feasibility Conclusion

## Tech Stack

### Frontend
- **Framework**: React 18.2 + Vite
- **Styling**: TailwindCSS
- **Forms**: React Hook Form
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **PDF Generation**: pdfmake
- **Env Management**: dotenv

## Project Structure

```
DPR-Generator/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── models/
│   │   ├── User.js
│   │   └── Project.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── pdfController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── pdfRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── services/
│   │   ├── financialCalculations.js
│   │   └── pdfService.js
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProjectForm.jsx
│   │   │   ├── ProjectList.jsx
│   │   │   └── ProjectView.jsx
│   │   ├── components/
│   │   │   └── Navigation.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── README.md
├── shared/
│   └── [shared utilities if needed]
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure .env variables**
```
MONGODB_URI=
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

5. **Start MongoDB** (if running locally)
```bash
# Windows
mongod

# macOS (if installed via Homebrew)
brew services start mongodb-community
```

6. **Start backend server**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
```
POST /api/auth/signup
POST /api/auth/login
```

### Projects
```
POST   /api/projects                    - Create new project
GET    /api/projects                    - Get all user projects
GET    /api/projects/:id                - Get single project
PUT    /api/projects/:id                - Update project
DELETE /api/projects/:id                - Delete project
POST   /api/projects/:id/calculate      - Calculate financials
```

### PDF Generation
```
GET /api/pdf/generate/:id              - Generate PDF DPR
```

## Financial Calculations

### Key Formulas Implemented

**Project Cost**
```
Fixed Capital = Furniture + Electrification + Machinery + Preliminary Expenses
Total Project Cost = Fixed Capital + Other Costs
```

**Working Capital**
```
Current Assets = Stock + Receivables + Working Expenses
Total WC = Current Assets - Payables
Own Contribution = Total WC × Margin %
WC Loan = Total WC - Own Contribution
```

**Means of Finance**
```
Total Requirement = Project Cost + Working Capital
Promoter Contribution = Total Requirement × Margin %
Bank Loan = Total Requirement - Promoter Contribution
```

**EMI Calculation (Amortization)**
```
EMI = (P × r × (1+r)^n) / ((1+r)^n - 1)
Where:
  P = Loan Principal
  r = Monthly Interest Rate
  n = Number of Months
```

**Financial Ratios**
```
DSCR = (Net Profit + Interest + Depreciation) / EMI Payment
Current Ratio = Current Assets / Current Liabilities
Quick Ratio = (Current Assets - Inventory) / Current Liabilities
Debt-Equity Ratio = Total Debt / Total Equity
Interest Coverage Ratio = EBIT / Interest Expense
```

**Profitability**
```
Gross Profit = Revenue - Direct Cost
Net Profit = Gross Profit - Indirect Expenses - Interest - Depreciation
```

## Usage Workflow

### 1. **User Registration**
- Sign up with name, email, and password
- Password is securely hashed with bcrypt

### 2. **Create Project**
- Fill 7-step form with business and financial details
- System auto-calculates all financial metrics
- Data is saved to MongoDB

### 3. **View & Manage Projects**
- View all projects in dashboard
- Edit project details
- See financial projections and ratios
- Download PDF DPR

### 4. **Generate PDF**
- Click "Download PDF" to generate professional DPR
- PDF contains all financial statements and ratios
- Ready for bank submission

## Sample Data

To test the application, you can use these sample values:

**Basic Information:**
- Business Name: ABC Manufacturing
- Promoter Name: John Doe
- Address: 123 Business Street
- Phone: 9876543210
- Business Type: Manufacturing
- Scheme: Mudra

**Project Cost:**
- Machinery: ₹500,000
- Furniture: ₹100,000
- Electrification: ₹50,000

**Working Capital:**
- Stock Value: ₹100,000
- Receivables: ₹50,000
- Working Expenses: ₹100,000
- Payables: ₹50,000

**Finance:**
- Margin: 20%
- Bank Loan: 80%

**Revenue (Monthly Model):**
- Monthly Sales: ₹100,000
- Growth Rate: 5% per annum

**Expenses:**
- Salary: ₹30,000/month
- Electricity: ₹5,000/month
- Raw Materials: ₹40,000/month
- Transport: ₹5,000/month

**Loan:**
- Loan Amount: ₹480,000
- Interest Rate: 12% p.a.
- Tenure: 60 months

## Development

### Frontend - Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend - Available Scripts

```bash
npm start   # Start server (production)
npm run dev # Start server (development with nodemon)
```

## Database Schema

### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user | admin),
  createdAt: Date
}
```

### Project Schema
See `backend/models/Project.js` for complete schema with embedded documents for:
- basicInfo
- projectCost
- workingCapital
- meansOfFinance
- revenueProjection
- expenseProjection
- loanDetails
- financialData

## Security Features

- JWT token-based authentication
- Bcrypt password hashing
- Request validation
- Protected routes (authMiddleware)
- Role-based access control (adminMiddleware)
- CORS enabled for frontend-backend communication

## Error Handling

- Comprehensive error messages
- Form validation feedback
- API error responses
- User-friendly error displays

## Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist/ folder
```

### Backend (Heroku/Railway/Render)
```bash
# Push to git repository
# Configure environment variables
# Deploy
```

### Database (MongoDB Atlas)
```
1. Create MongoDB Atlas cluster
2. Update MONGODB_URI in .env
3. Deploy backend
```

## Common Issues & Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network access in MongoDB Atlas

### CORS Errors
- Check proxy configuration in vite.config.js
- Verify CORS is enabled in backend

### PDF Generation Issues
- Ensure pdfmake is installed
- Check project data completeness
- Verify fonts are available

## Future Enhancements

- [ ] Admin dashboard for project approval
- [ ] Excel export functionality
- [ ] Multi-language support
- [ ] Advanced chart types
- [ ] Email notifications
- [ ] Batch PDF generation
- [ ] Project templates
- [ ] Real-time collaboration
- [ ] Mobile app version

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License

## Support

For issues or questions, please create an issue in the repository.

## Disclaimer

This application generates DPRs for reference purposes. Always verify calculations and customize reports as per specific lender requirements. The DSCR, ratios, and financial projections are calculated based on provided inputs and standard financial formulas.
