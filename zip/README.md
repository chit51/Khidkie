# Admin Panel + Quotation Storage

## What you get
- **User side**: `quotation-calculator.html` now has a **Save Quote** button that stores the generated quotation in MongoDB.
- **Admin side**: `admin.html` lets admin:
  - **Add products**
  - **Enable/Disable products**
  - **View saved quotations** (list + full JSON details)

## Setup
1. Create `.env` (copy from `.env.example`) and set:
   - `MONGO_URI`
   - `ADMIN_PASSWORD`
   - `ADMIN_TOKEN_SECRET`
2. Install and run:

```bash
npm install
npm start
```

## URLs
- **Quotation page**: `http://localhost:5000/quotation-calculator.html`
- **Admin panel**: `http://localhost:5000/admin.html`

