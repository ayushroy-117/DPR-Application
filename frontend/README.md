# DPR Frontend - React + Vite

Modern, responsive frontend for the Detailed Project Report generation application.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Frontend will run on http://localhost:3000

### 3. Build for Production
```bash
npm run build
```

## Features

- Multi-step form wizard for project creation
- Real-time financial calculations
- Interactive charts and visualizations
- PDF download functionality
- Project list with status tracking
- Responsive design with Tailwind CSS
- Form validation with React Hook Form
- JWT authentication

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   └── Navigation.jsx
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ProjectForm.jsx    # Multi-step form
│   │   ├── ProjectList.jsx
│   │   └── ProjectView.jsx
│   ├── services/          # API services
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css          # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Dependencies

- react: UI library
- react-router-dom: Routing
- axios: API calls
- react-hook-form: Form management
- tailwindcss: Styling
- recharts: Charts and graphs
- lucide-react: Icons

## Page Components

- **Login**: User authentication
- **Signup**: New user registration
- **Dashboard**: Overview and quick actions
- **ProjectForm**: 7-step wizard for project creation
- **ProjectList**: View all projects with actions
- **ProjectView**: Detailed project view with charts and financials
