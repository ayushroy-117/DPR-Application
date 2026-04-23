# Database Schema Documentation

## MongoDB Collections & Schemas

### 1. Users Collection

**Collection Name**: `users`

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,        // unique, indexed
  password: String,     // bcrypt hashed
  role: String,         // enum: ['user', 'admin'], default: 'user'
  createdAt: Date,      // default: Date.now()
}
```

**Indexes**:
- `email` (unique)
- `createdAt` (for sorting)

**Methods**:
- `comparePassword(enteredPassword)` - Verify password

---

### 2. Projects Collection

**Collection Name**: `projects`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // ref: User, required
  status: String,                   // enum: ['draft', 'submitted', 'approved', 'rejected']
  
  // Basic Information
  basicInfo: {
    businessName: String,
    promoterName: String,
    address: String,
    phone: String,
    businessType: String,
    schemeName: String,
    employmentCount: Number
  },

  // Project Cost
  projectCost: {
    furniture: Number,
    electrification: Number,
    machinery: Number,
    preliminaryExpenses: Number,
    otherCosts: Number,
    fixedCapital: Number,           // auto-calculated
    totalProjectCost: Number         // auto-calculated
  },

  // Working Capital
  workingCapital: {
    stockValue: Number,
    receivables: Number,
    workingExpenses: Number,
    payables: Number,
    totalWC: Number,                // auto-calculated
    ownContribution: Number,        // auto-calculated
    wcLoan: Number                  // auto-calculated
  },

  // Means of Finance
  meansOfFinance: {
    marginPercentage: Number,
    termLoanPercentage: Number,
    wcLoanPercentage: Number,
    bankLoan: Number,               // auto-calculated
    promoterContribution: Number    // auto-calculated
  },

  // Revenue Projection
  revenueProjection: {
    model: String,                  // enum: ['daily', 'monthly', 'production']
    dailySales: Number,
    monthlySales: Number,
    production: Number,
    productPrice: Number,
    growthPercentage: Number,
    yearlyProjections: [{
      year: Number,
      revenue: Number
    }]
  },

  // Expense Projection
  expenseProjection: {
    salary: Number,
    electricity: Number,
    rawMaterials: Number,
    transport: Number,
    miscellaneous: Number,
    escalationPercentage: Number,
    yearlyProjections: [{
      year: Number,
      totalExpense: Number
    }]
  },

  // Loan Details
  loanDetails: {
    loanAmount: Number,
    interestRate: Number,
    tenureMonths: Number,
    moratoriumMonths: Number,
    emiAmount: Number,              // auto-calculated
    emiSchedule: [{
      month: Number,
      principal: Number,
      interest: Number,
      emi: Number,
      outstandingBalance: Number
    }]
  },

  // Financial Calculations
  financialData: {
    profitStatements: [{
      year: Number,
      revenue: Number,
      directCost: Number,
      grossProfit: Number,
      expenses: Number,
      interest: Number,
      depreciation: Number,
      netProfit: Number
    }],
    
    ratios: {
      dscr: Number,                 // Debt Service Coverage Ratio
      currentRatio: Number,
      quickRatio: Number,
      debtEquity: Number,
      interestCoverage: Number
    },
    
    cashflows: [{
      year: Number,
      operatingCashflow: Number,
      investingCashflow: Number,
      financingCashflow: Number,
      netCashflow: Number
    }],
    
    balanceSheet: [{
      year: Number,
      assets: Number,
      liabilities: Number,
      equity: Number
    }]
  },

  createdAt: Date,                  // default: Date.now()
  updatedAt: Date                   // default: Date.now()
}
```

**Indexes**:
- `userId` (for finding user's projects)
- `status` (for filtering by status)
- `createdAt` (for sorting)
- Compound: `userId` + `createdAt`

---

## Relationships

```
User (1) -------- (Many) Projects
  |
  └─── Projects contain embedded documents
         - basicInfo
         - projectCost
         - workingCapital
         - meansOfFinance
         - revenueProjection
         - expenseProjection
         - loanDetails
         - financialData
```

## Data Types Reference

| Type | Example | Usage |
|------|---------|-------|
| String | "ABC Manufacturing" | Text data |
| Number | 500000 | Currency, percentages, counts |
| Date | 2024-01-15T10:30:00Z | Timestamps |
| Boolean | true/false | Status indicators |
| ObjectId | 507f1f77bcf86cd799439011 | References between collections |
| Array | [{...}] | Collections of similar objects |
| Object | {field: value} | Nested data structures |

## Query Examples

### Find user's projects
```javascript
db.projects.find({ userId: ObjectId("...") })
```

### Find projects by status
```javascript
db.projects.find({ status: "approved" })
```

### Get project with specific calculations
```javascript
db.projects.findOne({
  _id: ObjectId("..."),
  $project: {
    basicInfo: 1,
    financialData.ratios: 1,
    loanDetails.emiAmount: 1
  }
})
```

### Update project status
```javascript
db.projects.updateOne(
  { _id: ObjectId("...") },
  { $set: { status: "approved", updatedAt: new Date() } }
)
```

### Aggregate projects by status
```javascript
db.projects.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

## Database Setup Instructions

### 1. Local MongoDB

**Install MongoDB**:
- Download from https://www.mongodb.com/try/download/community
- Follow installation guide for your OS

**Start MongoDB**:
```bash
# Windows
mongod

# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Create Database**:
```bash
mongo
> use dpr-db
> db.createCollection("users")
> db.createCollection("projects")
```

### 2. MongoDB Atlas (Cloud)

```bash
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and sign in
3. Create new cluster
4. Set up database user (username/password)
5. Get connection string
6. Add to .env: MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dpr-db
```

## Backup & Migration

### Backup MongoDB
```bash
# Local backup
mongodump --db dpr-db --out ./backup

# Restore
mongorestore --db dpr-db ./backup/dpr-db
```

### Export to JSON
```bash
mongoexport --db dpr-db --collection projects --out projects.json

# Import
mongoimport --db dpr-db --collection projects --file projects.json
```

## Performance Optimization

### Index Creation
```javascript
// Users indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ createdAt: -1 })

// Projects indexes
db.projects.createIndex({ userId: 1, createdAt: -1 })
db.projects.createIndex({ status: 1 })
db.projects.createIndex({ "basicInfo.businessName": "text" })
```

### Query Optimization
- Always use indexed fields in filters
- Use projection to limit returned fields
- Batch operations when possible
- Archive old projects if database grows large

## Constraints & Validation

### User Collection
- Email must be unique and valid format
- Password minimum 6 characters
- Role must be 'user' or 'admin'

### Project Collection
- userId is required and must reference valid user
- Percentage fields (0-100)
- Numeric fields must be non-negative
- Status must be from enum

## Data Retention Policy

- Keep user accounts indefinitely
- Archive projects older than 5 years
- Delete incomplete projects after 30 days of inactivity
- Maintain audit logs for admin operations
