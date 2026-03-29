# Quick Start Guide

## Prerequisites
- Node.js (v16+)
- MySQL Server or AWS RDS MySQL
- npm or yarn

## Local Development (Using Local MySQL First)

### Step 1: Database Setup

If using local MySQL:
```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE grocery_db;
USE grocery_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id ON items(user_id);
CREATE INDEX idx_email ON users(email);
```

### Step 2: Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=grocery_db
JWT_SECRET=dev-secret-key-change-in-production
```

Install and run:
```bash
npm install
npm run dev
```

Backend should now be running on `http://localhost:5000`

### Step 3: Frontend Setup

In a new terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend should now be running on `http://localhost:3000`

## Testing the Application

1. **Open** `http://localhost:3000` in your browser
2. **Register** with email and password
3. **Login** with your credentials
4. **Add Items** with name, price, and quantity
5. **View Items** in the grid
6. **Edit Items** by clicking the Edit button
7. **Delete Items** by clicking the Delete button
8. **Logout** using the button in the header

## API Testing with curl

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Save the token from the response.

### Add Item
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Apples", "price": 5.99, "quantity": 10}'
```

### Get Items
```bash
curl -X GET http://localhost:5000/api/items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Item (id=1)
```bash
curl -X DELETE http://localhost:5000/api/items/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## AWS RDS Migration (When ready for deployment)

Update backend `.env`:
```
DB_HOST=your-rds-endpoint.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-rds-password
DB_NAME=grocery_db
```

Run the schema.sql on your AWS RDS:
```bash
mysql -h your-rds-endpoint.us-east-1.rds.amazonaws.com -u admin -p grocery_db < database/schema.sql
```

## Troubleshooting

### Port already in use
- Backend (5000): `lsof -i :5000` and `kill -9 <PID>`
- Frontend (3000): `lsof -i :3000` and `kill -9 <PID>`

### Can't connect to database
- Check MySQL is running
- Verify credentials in `.env`
- Check database exists and tables are created

### CORS errors
- Ensure backend is running on port 5000
- Check frontend `.env` has correct API_URL

### JWT errors
- Make sure token is passed in Authorization header
- Token format: `Bearer eyJhbGciOiJIUzI1NiIs...`
