# Finance Dashboard Backend

A backend system built with Node.js, Express, and MongoDB for managing financial records across different user roles. This project covers the core pieces of a finance dashboard — user management, transaction tracking, access control, and analytics.

---

## What this does

The idea here is simple: different people in an organization need different levels of access to financial data. A viewer should be able to see records, an analyst should be able to dig into summaries and trends, and an admin should have full control. This backend handles all of that with clean role-based middleware and JWT authentication.

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

Copy the example env file and fill in your values:

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
│   └── db.js                  # MongoDB connection
├── models/
│   ├── User.js                # User schema with role + status
│   └── Transaction.js         # Financial record schema (with soft delete)
├── middleware/
│   ├── auth.js                # JWT verification
│   └── roleCheck.js           # Role-based access control
├── controllers/
│   ├── auth.controller.js     # Register, login, profile
│   ├── user.controller.js     # Admin user management
│   ├── transaction.controller.js  # CRUD + filtering
│   └── dashboard.controller.js    # Aggregated analytics
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── transaction.routes.js
│   └── dashboard.routes.js
├── utils/
│   └── errorHandler.js        # Centralized error handling
└── app.js                     # Entry point
```

---

## Roles and Permissions

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| View transactions             | ✅     | ✅      | ✅    |
| Create/Update/Delete records  | ❌     | ❌      | ✅    |
| Access dashboard analytics    | ❌     | ✅      | ✅    |
| Manage users                  | ❌     | ❌      | ✅    |

The role check middleware uses a level system (viewer = 1, analyst = 2, admin = 3) so access rules are easy to reason about and extend later.

---

## API Reference

### Auth

| Method | Endpoint         | Description               | Auth Required |
|--------|------------------|---------------------------|---------------|
| POST   | /api/auth/register | Create a new account     | No            |
| POST   | /api/auth/login    | Login and get token      | No            |
| GET    | /api/auth/me       | Get current user profile | Yes           |

**Register**
```json
POST /api/auth/register
{
  "name": "Disha Dewangan",
  "email": "disha@example.com",
  "password": "securepass123"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "disha@example.com",
  "password": "securepass123"
}
```

Response includes a `token` field. Pass it as:
```
Authorization: Bearer <token>
```

---

### Users (Admin Only)

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | /api/users       | List all users (paginated)|
| GET    | /api/users/:id   | Get a single user        |
| POST   | /api/users       | Create a user            |
| PATCH  | /api/users/:id   | Update role/status/name  |
| DELETE | /api/users/:id   | Delete a user            |

**Query params for GET /api/users**:
- `role` — filter by role (viewer, analyst, admin)
- `status` — filter by status (active, inactive)
- `page`, `limit` — pagination

---

### Transactions

| Method | Endpoint               | Description                    | Roles         |
|--------|------------------------|--------------------------------|---------------|
| GET    | /api/transactions      | List transactions (paginated)  | All           |
| GET    | /api/transactions/:id  | Get a single transaction       | All           |
| POST   | /api/transactions      | Create a transaction           | Admin only    |
| PATCH  | /api/transactions/:id  | Update a transaction           | Admin only    |
| DELETE | /api/transactions/:id  | Soft delete a transaction      | Admin only    |

**Query params for GET /api/transactions**:
- `type` — income or expense
- `category` — partial match, case-insensitive
- `startDate`, `endDate` — ISO 8601 date range
- `search` — search in notes field
- `page`, `limit` — pagination
- `sortBy` — field to sort by (default: date)
- `order` — asc or desc (default: desc)

**Create Transaction**
```json
POST /api/transactions
{
  "amount": 15000,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-01",
  "notes": "Monthly salary credit"
}
```

---

### Dashboard Analytics (Analyst + Admin)

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | /api/dashboard/summary     | Total income, expenses, net balance, recent activity |
| GET    | /api/dashboard/categories  | Breakdown by category                |
| GET    | /api/dashboard/trends      | Monthly income vs expense for a year |
| GET    | /api/dashboard/weekly      | Last 7 days breakdown                |

**GET /api/dashboard/summary** returns:
```json
{
  "summary": {
    "totalIncome": 75000,
    "totalExpenses": 32000,
    "netBalance": 43000,
    "incomeCount": 5,
    "expenseCount": 12,
    "recentActivity": [...]
  }
}
```

**GET /api/dashboard/trends?year=2026** returns monthly data:
```json
{
  "year": 2026,
  "trends": [
    { "month": 1, "income": 25000, "expense": 8000 },
    { "month": 2, "income": 20000, "expense": 11000 }
  ]
}
```

---

## Error Responses

All error responses follow a consistent format:
```json
{
  "success": false,
  "message": "Descriptive error message here"
}
```

Common status codes used:
- `400` — Bad request / validation failed
- `401` — Unauthenticated
- `403` — Access forbidden (wrong role)
- `404` — Resource not found
- `409` — Conflict (e.g. email already exists)
- `500` — Internal server error

---

## Assumptions Made

1. **Self-registration defaults to "viewer"** — Anyone can register, but they get the lowest access level. Admins must manually upgrade roles via the user management API.
2. **Soft deletes for transactions** — Deleted transactions aren't actually removed from the database. They're flagged with `isDeleted: true` and a `deletedAt` timestamp. This is intentional — financial records should be auditable.
3. **Admins can't demote themselves** — A safeguard to prevent accidentally losing admin access to the system.
4. **No email verification** — Kept out of scope for simplicity. In a real system, you'd want to confirm email before activating an account.
5. **Categories are free-form strings** — Rather than a fixed enum, categories are flexible text. This makes the system adaptable without needing a migration every time a new category is needed.

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
Using numeric levels (`viewer = 1, analyst = 2, admin = 3`) makes the middleware much cleaner. When you call `authorize("analyst")`, it automatically allows analysts *and* admins. You don't have to list every valid role every time.

**Why soft delete?**
Financial data is sensitive. Hard-deleting records makes auditing impossible. Soft deletes let the system keep the data while hiding it from normal queries. If needed later, records can be recovered.

**Why separate the dashboard from transactions?**
Dashboard endpoints use MongoDB aggregations which are conceptually different from CRUD. Keeping them in a separate controller and route group makes the codebase easier to navigate and maintains a cleaner separation of concerns.

---

## Health Check

```
GET /health
→ { "success": true, "message": "Server is up and running" }
```
