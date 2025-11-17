<!-- @format -->

# 🚀 Quick Start Guide - FSM System

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git installed

## Step-by-Step Setup

### 1. Clone and Install

```powershell
# Clone the repository
git clone <repository-url>
cd outside-Project-backend

# Install dependencies
npm install
```

### 2. Database Setup

```powershell
# Create PostgreSQL database
# Open PostgreSQL and run:
# CREATE DATABASE fsm_db;

# Or use psql command:
psql -U postgres -c "CREATE DATABASE fsm_db;"
```

### 3. Environment Configuration

```powershell
# Copy the example environment file
Copy-Item .env.example .env

# Edit .env file and update DATABASE_URL
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/fsm_db"
```

### 4. Run Database Migrations

```powershell
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Seed the database with sample data
npm run prisma:seed
```

### 5. Create Uploads Directory

```powershell
New-Item -ItemType Directory -Force -Path uploads
```

### 6. Start the Server

```powershell
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on **http://localhost:3000**

## 🧪 Test the API

### Quick Test with curl or Postman

1. **Check server status:**

   ```powershell
   curl http://localhost:3000
   ```

   Should return: `{"status":"FSM backend running"}`

2. **Login as Admin:**

   ```powershell
   curl -X POST http://localhost:3000/api/auth/login `
     -H "Content-Type: application/json" `
     -d '{"phone":"1111111111","password":"admin123"}'
   ```

   Copy the `token` from the response.

3. **Get Dashboard Stats:**
   ```powershell
   curl http://localhost:3000/api/admin/dashboard `
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## 📝 Default Test Accounts

After seeding, use these credentials:

| Role          | Phone      | Password      | Description                    |
| ------------- | ---------- | ------------- | ------------------------------ |
| Admin         | 1111111111 | admin123      | Full system access             |
| Dispatcher    | 2222222222 | dispatcher123 | Manage WOs and assignments     |
| Call Center   | 3333333333 | callcenter123 | Create SRs                     |
| Internal Tech | 4444444444 | tech123       | Complete jobs (5% bonus)       |
| Freelancer    | 5555555555 | freelancer123 | Complete jobs (20% commission) |
| Customer      | 9999999999 | customer123   | Create service requests        |

## 🔄 Common Workflows

### Customer Flow

1. Customer creates SR (no login required)
2. Receives SR number
3. Waits for technician assignment

### Dispatcher Flow

1. Login as Dispatcher (2222222222 / dispatcher123)
2. View all SRs: `GET /api/sr`
3. Convert SR to WO: `POST /api/wos/from-sr/{srId}`
4. Assign technician: `PATCH /api/wos/{id}/assign`
5. Monitor progress on dashboard

### Technician Flow

1. Login as Technician (5555555555 / freelancer123)
2. View dashboard: `GET /api/commissions/dashboard`
3. Accept WO: `POST /api/wos/{id}/respond`
4. Start job (GPS): `POST /api/wos/{id}/start`
5. Complete job: `POST /api/wos/{id}/complete`
6. Upload payment proof: `POST /api/payments`
7. View earnings: `GET /api/commissions/my-commissions`

### Admin Flow

1. Login as Admin (1111111111 / admin123)
2. View dashboard: `GET /api/admin/dashboard`
3. Verify payments: `PATCH /api/payments/{id}/verify`
4. Review payout requests: `GET /api/commissions/payout-requests`
5. Generate reports: `GET /api/reports/financial`

## 🛠️ Useful Commands

```powershell
# View database in browser
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Re-seed database
npm run prisma:seed

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name your_migration_name
```

## 🐛 Troubleshooting

### Database Connection Error

```
Error: Can't reach database server
```

**Solution:** Ensure PostgreSQL is running and DATABASE_URL in .env is correct.

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Change PORT in .env or kill the process using port 3000.

### Prisma Client Error

```
Error: @prisma/client did not initialize yet
```

**Solution:** Run `npx prisma generate`

### Migration Error

```
Error: Migration failed
```

**Solution:** Reset database with `npx prisma migrate reset` and try again.

## 📚 Next Steps

1. **Read Full Documentation:** Check `README.md` and `API_DOCUMENTATION.md`
2. **Explore API:** Use Postman or similar tool to test endpoints
3. **View Database:** Run `npx prisma studio` to see data
4. **Customize:** Modify categories, services, commission rates as needed

## 🔗 Important Files

- `prisma/schema.prisma` - Database schema
- `src/app.js` - Express app configuration
- `src/routes/` - API route definitions
- `src/services/` - Business logic
- `.env` - Environment configuration

## 💡 Tips

- Always use the correct role when testing endpoints
- Check the terminal for helpful logs and OTP codes (in development)
- Use Prisma Studio to view and edit data visually
- Keep the API Documentation handy for reference

## 🆘 Need Help?

- Check the error messages in the terminal
- Review the API Documentation for correct request formats
- Ensure you're using the right authentication token for your role
- Verify your database connection and migrations are up to date

---

Happy coding! 🎉
