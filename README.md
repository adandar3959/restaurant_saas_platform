# Restaurant SaaS Platform

A multi-tenant SaaS backend for restaurants. Every restaurant's data is fully isolated by `restaurantId` — Restaurant A never sees Restaurant B's data.


## Getting Started

```bash
npm install
npm run dev
```

---

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Bearer token)
- **Validation:** express-validator

---

## Roles

| Role         | Who they are                                      |
|--------------|---------------------------------------------------|
| `SuperAdmin` | Platform owner — manages all restaurants          |
| `Admin`      | Restaurant owner — manages their own restaurant   |
| `Manager`    | Manages staff, orders, inventory, reservations    |
| `Chef`       | Kitchen display access only                       |
| `Waiter`     | Takes and manages dine-in orders                  |
| `Driver`     | Handles deliveries, updates own location          |
| `Customer`   | Places orders, writes reviews, earns loyalty pts  |

---

## Modules & Features

### 1. Core SaaS & Multi-Tenancy
- SuperAdmin manages all restaurants on the platform
- Subscription plans: `Free`, `Pro`, `Enterprise`
- Each plan unlocks different feature flags (inventory, KDS, loyalty, etc.)
- Billing invoices tracked per restaurant
- Soft-delete for all tenant data

### 2. Restaurant Identity
- Full branding: logo, banner, primary/secondary colors, font
- Custom domain support per restaurant
- Business hours per day with open/close times
- Multi-branch support (a restaurant can have child branches)
- Auto-generated URL slug from restaurant name

### 3. User & Staff Management (RBAC)
- Single User collection handles all roles
- JWT authentication with refresh token support
- Password hashing with bcryptjs
- Email verification + password reset flow (tokens stored)
- Soft-delete users, ban accounts
- Staff assigned to prep stations

### 4. Menu & Catalog
- Categories with time-based visibility (e.g. Breakfast 09:00–12:00)
- Menu items with cost price for profit margin tracking
- Modifier groups with min/max selections (e.g. Choose Size — required)
- Dietary tags: Vegan, Gluten-Free, Spicy, etc.
- Allergen labels: Peanuts, Dairy, Gluten, etc.
- Nutritional info: calories, protein, carbs, fat
- Quick availability toggle (out-of-stock)
- Featured item flag for storefront highlights

### 5. Order Processing & POS
- Supports Dine-In, Takeaway, and Delivery order types
- Auto-calculates subtotal, tax, delivery fee, tip, and total
- Price and item name snapshotted at time of order (never changes)
- Coupon/discount applied at order level
- Scheduled orders (order now, deliver later)
- Status timestamps recorded for every lifecycle change
- Loyalty points earned and redeemed per order
- Guest orders supported (no account required)
- Order source tracked: Web, App, POS, QR

### 6. Kitchen Display System (KDS)
- Kitchen ticket auto-created when an order is placed
- Tickets show only prep info — no pricing
- Per-item status tracking within a ticket
- Rush priority flag
- Prep stations route items to the right kitchen area (Grill, Bar, Fryer)
- Void tickets with reason

### 7. Tables & Reservations
- Floor plan with section, X/Y position, and shape per table
- Real-time table status: Available, Occupied, Reserved, NeedsCleaning
- QR code per table for table-side ordering
- Reservations for logged-in customers or walk-in guests
- Confirmation codes and reminder tracking
- Assigned host/manager per reservation

### 8. Inventory & Recipes
- Ingredient stock tracking with unit of measurement
- Low-stock alerts when stock drops below threshold
- Recipes map exact ingredient quantities to menu items
- Stock auto-deducted when a purchase order is marked Received
- Supplier management with payment terms
- Purchase orders with partial delivery support and auto PO numbering

### 9. Delivery & Dispatch
- Delivery zones by radius (km) or GeoJSON polygon
- Dynamic delivery fees and minimum order amounts per zone
- Driver profiles linked to User accounts
- Real-time driver GPS location updates
- Third-party driver integration support (DoorDash, Uber)
- Dispatch tracking with pickup/delivery timestamps
- Proof of delivery photo URL

### 10. CRM, Marketing & Loyalty
- Customer reviews with food, service, and delivery sub-ratings
- Admin can respond publicly to reviews
- Flag reviews for moderation
- Coupons: Percentage, Fixed Amount, Free Delivery, BuyXGetY
- Coupon conditions: min order, max discount cap, per-user limits
- Loyalty points ledger (every earn/redeem recorded)
- Customer tiers: Bronze, Silver, Gold, Platinum
- Total spend and order count tracked per customer
