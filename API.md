# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except /auth) require JWT token in header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### 1. Sign Up
**Endpoint**: `POST /auth/signup`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Errors**:
- 400: User already exists
- 500: Server error

---

### 2. Login
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Errors**:
- 400: User not found or Invalid password
- 500: Server error

---

## Project Endpoints

### 1. Create Project
**Endpoint**: `POST /projects`

**Request Body**:
```json
{
  "basicInfo": {
    "businessName": "ABC Manufacturing",
    "promoterName": "John Doe",
    "address": "123 Business Street",
    "phone": "9876543210",
    "businessType": "Manufacturing",
    "schemeName": "Mudra",
    "employmentCount": 5
  },
  "projectCost": {
    "furniture": 100000,
    "electrification": 50000,
    "machinery": 500000,
    "preliminaryExpenses": 50000,
    "otherCosts": 100000
  },
  "workingCapital": {
    "stockValue": 100000,
    "receivables": 50000,
    "workingExpenses": 100000,
    "payables": 50000
  },
  "meansOfFinance": {
    "marginPercentage": 20,
    "termLoanPercentage": 80,
    "wcLoanPercentage": 100
  },
  "revenueProjection": {
    "model": "monthly",
    "monthlySales": 100000,
    "growthPercentage": 5
  },
  "expenseProjection": {
    "salary": 30000,
    "electricity": 5000,
    "rawMaterials": 40000,
    "transport": 5000,
    "miscellaneous": 5000,
    "escalationPercentage": 3
  },
  "loanDetails": {
    "loanAmount": 480000,
    "interestRate": 12,
    "tenureMonths": 60,
    "moratoriumMonths": 0
  }
}
```

**Response** (201 Created):
```json
{
  "message": "Project created",
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "status": "draft",
    "basicInfo": {...},
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. Get All Projects
**Endpoint**: `GET /projects`

**Query Parameters**: None

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "basicInfo": {
      "businessName": "ABC Manufacturing"
    },
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### 3. Get Single Project
**Endpoint**: `GET /projects/:id`

**Parameters**:
- `id` (string): Project ID

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "basicInfo": {...},
  "projectCost": {...},
  "workingCapital": {...},
  "meansOfFinance": {...},
  "revenueProjection": {...},
  "expenseProjection": {...},
  "loanDetails": {...},
  "financialData": {...},
  "status": "draft",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors**:
- 404: Project not found
- 401: Unauthorized

---

### 4. Update Project
**Endpoint**: `PUT /projects/:id`

**Parameters**:
- `id` (string): Project ID

**Request Body**: (Any fields to update)
```json
{
  "basicInfo": {
    "businessName": "Updated Business Name"
  },
  "status": "submitted"
}
```

**Response** (200 OK):
```json
{
  "message": "Project updated",
  "project": {...}
}
```

---

### 5. Delete Project
**Endpoint**: `DELETE /projects/:id`

**Parameters**:
- `id` (string): Project ID

**Response** (200 OK):
```json
{
  "message": "Project deleted"
}
```

---

### 6. Calculate Financials
**Endpoint**: `POST /projects/:id/calculate`

**Parameters**:
- `id` (string): Project ID

**Description**: Calculates all financial metrics based on project data

**Response** (200 OK):
```json
{
  "message": "Financials calculated",
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "projectCost": {
      "fixedCapital": 700000,
      "totalProjectCost": 800000
    },
    "meansOfFinance": {
      "bankLoan": 640000,
      "promoterContribution": 160000
    },
    "financialData": {
      "profitStatements": [
        {
          "year": 1,
          "revenue": 1200000,
          "expenses": 600000,
          "netProfit": 600000
        }
      ],
      "ratios": {
        "dscr": 2.5,
        "debtEquity": 1.2,
        "interestCoverage": 3.8
      }
    },
    "loanDetails": {
      "emiAmount": 12000,
      "emiSchedule": [...]
    }
  }
}
```

---

## PDF Endpoints

### Generate PDF DPR
**Endpoint**: `GET /pdf/generate/:id`

**Parameters**:
- `id` (string): Project ID

**Response**: PDF file stream

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="DPR_BusinessName.pdf"
```

**Usage**:
```javascript
// Frontend example
const response = await fetch('/api/pdf/generate/507f1f77bcf86cd799439011', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const blob = await response.blob()
const url = window.URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'DPR_Report.pdf'
a.click()
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Project not found"
}
```

### 500 Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Request/Response Examples

### Example: Create and Calculate Project

**Step 1: Create Project**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"basicInfo": {...}, "projectCost": {...}}'
```

**Step 2: Calculate Financials**
```bash
curl -X POST http://localhost:5000/api/projects/507f1f77bcf86cd799439011/calculate \
  -H "Authorization: Bearer <token>"
```

**Step 3: Download PDF**
```bash
curl -X GET http://localhost:5000/api/pdf/generate/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>" \
  -o report.pdf
```

---

## Rate Limiting
Currently no rate limiting is implemented. Consider adding:
- 100 requests per 15 minutes per user
- 1000 requests per hour per IP

---

## API Versions
- Current: v1 (implied)
- All endpoints are at `/api/` root

---

## Pagination
Not currently implemented. Consider adding for:
- GET /projects (with limit, offset, sort)
- Future: analytical data exports

---

## Field Validation Rules

### Project Cost Fields
- All numeric fields must be >= 0
- At least one cost must be > 0

### Finance Percentages
- marginPercentage: 0-100
- termLoanPercentage: 0-100
- wcLoanPercentage: 0-100
- Sum should equal 100% (validation optional)

### EMI Calculation
- tenureMonths: 12-360 (1-30 years)
- interestRate: 0-20 (% p.a.)
- moratoriumMonths: 0-60 (0-5 years)

### Revenue Models
- dailySales required if model = 'daily'
- monthlySales required if model = 'monthly'
- production & productPrice required if model = 'production'

---

## Future API Enhancements

- [ ] Batch project creation
- [ ] Project templates
- [ ] Export to Excel
- [ ] Email PDF delivery
- [ ] Webhook notifications
- [ ] API keys for external integrations
- [ ] GraphQL endpoint
- [ ] Real-time collaboration
