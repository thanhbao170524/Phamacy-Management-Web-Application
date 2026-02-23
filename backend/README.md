# PharmaT Backend API

Backend API for PharmaT pharmacy management system.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MySQL >= 8.0

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Run development server:

```bash
npm run dev
```

## 📚 API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Medicines

- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Inventory

- `GET /api/inventory` - Get all inventory records
- `POST /api/inventory` - Create inventory record

### Sales

- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale

### Staff

- `GET /api/staff` - Get all staff

### Members

- `GET /api/members` - Get all members
- `POST /api/members` - Create member

## 🛠️ Tech Stack

- Node.js + Express
- TypeScript
- MySQL
- JWT for authentication
- bcryptjs for password hashing
