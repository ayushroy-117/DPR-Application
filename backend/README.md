# DPR Backend - Node.js + Express + MongoDB

This is the backend service for the Detailed Project Report (DPR) generation application.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:
```
MONGODB_URI=mongodb://localhost:27017/dpr-db
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### 3. Start MongoDB
Ensure MongoDB is running on your system (default: localhost:27017)

### 4. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on http://localhost:5000

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/login` - Login user

### Projects
- POST `/api/projects` - Create project
- GET `/api/projects` - Get all user projects
- GET `/api/projects/:id` - Get single project
- PUT `/api/projects/:id` - Update project
- DELETE `/api/projects/:id` - Delete project
- POST `/api/projects/:id/calculate` - Calculate all financials

### PDF Generation
- GET `/api/pdf/generate/:id` - Generate PDF DPR

## Project Structure

```
backend/
├── server.js              # Main server file
├── models/                # MongoDB schemas
│   ├── User.js
│   └── Project.js
├── routes/                # API routes
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   └── pdfRoutes.js
├── controllers/           # Route handlers
│   ├── authController.js
│   ├── projectController.js
│   └── pdfController.js
├── middleware/            # Custom middleware
│   └── auth.js
├── services/              # Business logic
│   ├── financialCalculations.js
│   └── pdfService.js
└── package.json
```

## Key Features

- JWT Authentication
- Financial calculations (DSCR, ratios, EMI schedule)
- PDF generation with pdfmake
- MongoDB data persistence
- Role-based access control (Admin/User)

## Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- bcryptjs: Password hashing
- jsonwebtoken: JWT authentication
- pdfmake: PDF generation
- cors: Cross-origin requests
- dotenv: Environment configuration
