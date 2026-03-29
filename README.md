# Simple Grocery Store Application

A lightweight, simple grocery store application built with Node.js backend and React frontend.

## Features

- **User Authentication**: Sign up and login with email/password
- **Grocery Items Management**: Add, view, edit, and delete grocery items
- **Simple UI**: Clean and minimal user interface
- **JWT Authentication**: Secure token-based authentication

## Project Structure

```
grocery-app/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection pool
│   ├── controllers/
│   │   ├── authController.js    # Auth logic (login, register)
│   │   └── itemsController.js   # Items CRUD operations
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── models/
│   │   ├── User.js              # User model operations
│   │   └── Item.js              # Item model operations
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   └── items.js             # Items endpoints
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auth.jsx         # Login/Register page
│   │   │   ├── Auth.css
│   │   │   ├── Home.jsx         # Grocery items page
│   │   │   └── Home.css
│   │   ├── api.js               # API helper functions
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
└── database/
    └── schema.sql               # MySQL database schema
```

## Getting Started

### 1. Database Setup

Create the MySQL database using the schema:

```bash
mysql -h your-rds-endpoint -u admin -p < database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env

# Update .env with your AWS RDS credentials
# DB_HOST=your-rds-endpoint.aws.com
# DB_USER=admin
# DB_PASSWORD=your-password
# DB_NAME=grocery_db
# JWT_SECRET=your-jwt-secret

npm install
npm start        # Production
npm run dev      # Development (with nodemon)
```

Server runs on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env

npm install
npm run dev      # Development
npm run build    # Production build
```

Frontend runs on: `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Grocery Items
- `GET /api/items` - Get all items (requires token)
- `POST /api/items` - Add new item (requires token)
- `PUT /api/items/:id` - Update item (requires token)
- `DELETE /api/items/:id` - Delete item (requires token)

### Health Check
- `GET /api/health` - Health check endpoint

## Request/Response Examples

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Response:
```json
{
  "message": "User registered",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": 1
}
```

### Add Item
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Apples", "price": 5.99, "quantity": 10}'
```

## Environment Variables

### Backend (.env)
```
PORT=5000
DB_HOST=your-rds-endpoint.aws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=grocery_db
JWT_SECRET=your-jwt-secret-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Notes

- All sensitive data (secrets, passwords) will be stored in AWS Secrets Manager during deployment
- Docker images will be stored as private repositories on Docker Hub
- The application will be deployed on EKS cluster (setup later)
- Database uses AWS RDS MySQL
- Authentication uses JWT tokens with 24-hour expiration

## Simple Structure

- No complex validation libraries
- No unnecessary dependencies
- Clean, minimal code structure
- Easy to extend and modify
- Ready for containerization and K8s deployment
