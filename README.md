# Finance Dashboard Backend

A backend system built with Node.js, Express, and MongoDB for managing financial records across different user roles. This project covers the core pieces of a finance dashboard — user management, transaction tracking, access control, and analytics.

---

## What this does

Different people in an organization need different levels of access to financial data. A viewer should be able to see records, an analyst should be able to dig into summaries and trends, and an admin should have full control. This backend handles all of that with clean role-based middleware and JWT authentication.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose)
- **Auth**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Other**: bcryptjs, cors, morgan, express-rate-limit

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd finance-backend
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=pick_something_strong_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Run the server

```bash
# development (with auto-restart)
npm run dev

# production
npm start
```

Server starts on `http://localhost:5000`

---

## Project Structure

```
src/
├── config/
│   └── db.js                      # MongoDB connection
├── models/
│   ├── User.js                    # User schema with role + status
│   └── Transaction.js             # Financial record schema (with soft delete)
├── middleware/
│   ├── auth.js                    # JWT verification
│   └── roleCheck.js               # Role-based access control
├── controllers/
│   ├── auth.controller.js         # Register, login, profile
│   ├── user.controller.js         # Admin user management
│   ├── transaction.controller.js  # CRUD + filtering
│   └── dashboard.controller.js    # Aggregated analytics
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── transaction.routes.js
│   └── dashboard.routes.js
├── utils/
│   └── errorHandler.js            # Centralized error handling
└── app.js                         # Entry point
```

---

## Roles and Permissions

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| View transactions             | ✅     | ✅      | ✅    |
| Create/Update/Delete records  | ❌     | ❌      | ✅    |
| Access dashboard analytics    | ❌     | ✅      | ✅    |
| Manage users                  | ❌     | ❌      | ✅    |

The role check middleware uses a level system (`viewer = 1`, `analyst = 2`, `admin = 3`) so access rules are easy to reason about and extend later.

---

## API Reference

All protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth

#### Register

```bash
curl --location 'http://localhost:5000/api/auth/register' \
--header 'Content-Type: application/json' \
--data '{
  "name": "Disha Dewangan",
  "email": "disha@example.com",
  "password": "securepass123"
}'
```

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "661f1c2e4f1a2b3c4d5e6f70",
    "name": "Disha Dewangan",
    "email": "disha@example.com",
    "role": "viewer",
    "status": "active"
  }
}
```

#### Login

```bash
curl --location 'http://localhost:5000/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{
  "email": "disha@example.com",
  "password": "securepass123"
}'
```

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Profile

```bash
curl --location 'http://localhost:5000/api/auth/me' \
--header 'Authorization: Bearer <token>'
```

```json
{
  "success": true,
  "user": {
    "_id": "661f1c2e4f1a2b3c4d5e6f70",
    "name": "Disha Dewangan",
    "email": "disha@example.com",
    "role": "admin",
    "status": "active"
  }
}
```

---

### Users (Admin Only)

#### List Users

```bash
curl --location 'http://localhost:5000/api/users?role=analyst&page=1&limit=10' \
--header 'Authorization: Bearer <token>'
```

```json
{
  "success": true,
  "total": 2,
  "page": 1,
  "pages": 1,
  "users": [
    {
      "_id": "661f1c2e4f1a2b3c4d5e6f71",
      "name": "Raj Sharma",
      "email": "raj@example.com",
      "role": "analyst",
      "status": "active"
    }
  ]
}
```

**Query params**: `role`, `status`, `page`, `limit`

#### Create User

```bash
curl --location 'http://localhost:5000/api/users' \
--header 'Authorization: Bearer <token>' \
--header 'Content-Type: application/json' \
--data '{
  "name": "Priya Mehta",
  "email": "priya@example.com",
  "password": "pass1234",
  "role": "analyst"
}'
```

#### Update User

```bash
curl --location --request PATCH 'http://localhost:5000/api/users/661f1c2e4f1a2b3c4d5e6f71' \
--header 'Authorization: Bearer <token>' \
--header 'Content-Type: application/json' \
--data '{
  "role": "admin",
  "status": "inactive"
}'
```

#### Delete User

```bash
curl --location --request DELETE 'http://localhost:5000/api/users/661f1c2e4f1a2b3c4d5e6f71' \
--header 'Authorization: Bearer <token>'
```

---

### Transactions

#### List Transactions

```bash
curl --location 'http://localhost:5000/api/transactions?type=income&startDate=2026-01-01&endDate=2026-04-01&page=1&limit=5' \
--header 'Authorization: Bearer <token>'
```

```json
{
  "success": true,
  "total": 3,
  "page": 1,
  "pages": 1,
  "transactions": [
    {
      "_id": "662a1b3c4d5e6f7a8b9c0d01",
      "amount": 50000,
      "type": "income",
      "category": "Salary",
      "date": "2026-03-01T00:00:00.000Z",
      "notes": "March salary credit",
      "isDeleted": false
    }
  ]
}
```

**Query params**: `type`, `category`, `startDate`, `endDate`, `search`, `page`, `limit`, `sortBy`, `order`

#### Create Transaction

```bash
curl --location 'http://localhost:5000/api/transactions' \
--header 'Authorization: Bearer <token>' \
--header 'Content-Type: application/json' \
--data '{
  "amount": 15000,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-01",
  "notes": "Monthly salary credit"
}'
```

```json
{
  "success": true,
  "transaction": {
    "_id": "662a1b3c4d5e6f7a8b9c0d02",
    "amount": 15000,
    "type": "income",
    "category": "Salary",
    "date": "2026-04-01T00:00:00.000Z",
    "notes": "Monthly salary credit",
    "isDeleted": false,
    "createdAt": "2026-04-01T10:23:00.000Z"
  }
}
```

#### Update Transaction

```bash
curl --location --request PATCH 'http://localhost:5000/api/transactions/662a1b3c4d5e6f7a8b9c0d02' \
--header 'Authorization: Bearer <token>' \
--header 'Content-Type: application/json' \
--data '{
  "amount": 16000,
  "notes": "Updated salary amount"
}'
```

#### Delete Transaction (Soft Delete)

```bash
curl --location --request DELETE 'http://localhost:5000/api/transactions/662a1b3c4d5e6f7a8b9c0d02' \
--header 'Authorization: Bearer <token>'
```

```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

### Dashboard Analytics (Analyst + Admin)

#### Summary

```bash
curl --location 'http://localhost:5000/api/dashboard/summary' \
--header 'Authorization: Bearer <token>'
```

```json
{
  "success": true,
  "summary": {
    "totalIncome": 75000,
    "totalExpenses": 32000,
    "netBalance": 43000,
    "incomeCount": 5,
    "expenseCount": 12,
    "recentActivity": [
      {
        "_id": "662a1b3c4d5e6f7a8b9c0d01",
        "amount": 50000,
        "type": "income",
        "category": "Salary",
        "date": "2026-03-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Category Breakdown

```bash
curl --location 'http://localhost:5000/api/dashboard/categories' \
--header 'Authorization: Bearer <token>'
```

```json
{
  "success": true,
  "breakdown": [
    { "category": "Salary", "type": "income", "total": 75000, "count": 3 },
    { "category": "Rent", "type": "expense", "total": 18000, "count": 3 },
    { "category": "Groceries", "type": "expense", "total": 8500, "count": 6 }
  ]
}
```

#### Monthly Trends

```bash
curl --location 'http://localhost:5000/api/dashboard/trends?year=2026' \
--header 'Authorization: Bearer <token>'
```

```json
{
  "success": true,
  "year": 2026,
  "trends": [
    { "month": 1, "income": 25000, "expense": 8000 },
    { "month": 2, "income": 20000, "expense": 11000 },
    { "month": 3, "income": 30000, "expense": 13000 }
  ]
}
```

#### Weekly Breakdown

```bash
curl --location 'http://localhost:5000/api/dashboard/weekly' \
--header 'Authorization: Bearer <token>'
```

```json
{
  "success": true,
  "weekly": [
    { "date": "2026-03-31", "income": 0, "expense": 1200 },
    { "date": "2026-04-01", "income": 15000, "expense": 0 },
    { "date": "2026-04-02", "income": 0, "expense": 450 }
  ]
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Descriptive error message here"
}
```

| Status | Meaning                                  |
|--------|------------------------------------------|
| 400    | Bad request / validation failed          |
| 401    | Unauthenticated (missing/invalid token)  |
| 403    | Forbidden (insufficient role)            |
| 404    | Resource not found                       |
| 409    | Conflict (e.g. email already exists)     |
| 500    | Internal server error                    |

---

## Assumptions Made

1. **Self-registration defaults to "viewer"** — Anyone can register but gets the lowest access level. Admins must manually upgrade roles via the user management API.
2. **Soft deletes for transactions** — Deleted transactions are flagged with `isDeleted: true` and a `deletedAt` timestamp rather than removed. Financial records should remain auditable.
3. **Admins can't demote themselves** — A safeguard to prevent accidentally losing admin access to the system.
4. **No email verification** — Kept out of scope for simplicity. A production system would confirm email before activating an account.
5. **Categories are free-form strings** — Flexible text rather than a fixed enum, making the system adaptable without requiring schema migrations.

---

## Optional Features Included

- ✅ JWT-based authentication
- ✅ Pagination on all listing endpoints
- ✅ Search support (notes field)
- ✅ Soft delete for transactions
- ✅ Rate limiting (100 req / 15 min per IP)
- ✅ Centralized error handling

---

## Design Decisions

**Why role levels instead of a flat enum check?**
Using numeric levels (`viewer = 1`, `analyst = 2`, `admin = 3`) makes middleware much cleaner. Calling `authorize("analyst")` automatically allows analysts *and* admins — no need to list every valid role every time.

**Why soft delete?**
Financial data is sensitive. Hard-deleting records makes auditing impossible. Soft deletes keep the data while hiding it from normal queries, and allow recovery if needed.

**Why separate the dashboard from transactions?**
Dashboard endpoints use MongoDB aggregation pipelines which are conceptually different from CRUD. A separate controller and route group keeps the codebase easier to navigate and maintains cleaner separation of concerns.

---

## Health Check

```bash
curl --location 'http://localhost:5000/health'
```

```json
{ "success": true, "message": "Server is up and running" }
```

---

## Conclusion

This project covers the full scope of a finance dashboard backend — user and role management, financial record CRUD, aggregated analytics, and role-based access control — all wired together with JWT authentication and clean middleware.

The focus throughout was on correctness and clarity over complexity. Role levels keep access logic simple and extendable. Soft deletes keep financial data auditable. Separating dashboard aggregations from transaction CRUD keeps the codebase easy to navigate. Reasonable assumptions were documented rather than avoided.

The system is designed to be a solid, maintainable foundation that a frontend dashboard can plug into directly — and one that a backend developer can extend without having to untangle messy logic.
