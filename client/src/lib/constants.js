// ─── App-wide Constants ────────────────────────────────────────────────────

export const API_BASE = 'http://localhost:5000/api/v1';

// ── Roles ──────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN:       'Admin',
  MANAGER:     'Manager',
  CHEF:        'Chef',
  WAITER:      'Waiter',
  DRIVER:      'Driver',
  CUSTOMER:    'Customer',
};

// ── Order statuses ─────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING:          'Pending',
  ACCEPTED:         'Accepted',
  PREPARING:        'Preparing',
  READY:            'Ready',
  OUT_FOR_DELIVERY: 'OutForDelivery',
  COMPLETED:        'Completed',
  CANCELLED:        'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  Pending:         { bg: 'rgba(99,102,241,0.15)',  color: '#818CF8' },
  Accepted:        { bg: 'rgba(16,185,129,0.15)',  color: '#34D399' },
  Preparing:       { bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D' },
  Ready:           { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  OutForDelivery:  { bg: 'rgba(168,85,247,0.15)', color: '#C084FC' },
  Completed:       { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
  Cancelled:       { bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
};

// ── Order types ────────────────────────────────────────────────────────────
export const ORDER_TYPES = ['Dine-In', 'Takeaway', 'Delivery'];

// ── Table statuses ─────────────────────────────────────────────────────────
export const TABLE_STATUS = {
  AVAILABLE:      'Available',
  OCCUPIED:       'Occupied',
  RESERVED:       'Reserved',
  NEEDS_CLEANING: 'NeedsCleaning',
  INACTIVE:       'Inactive',
};

export const TABLE_STATUS_COLORS = {
  Available:     '#10B981',
  Occupied:      '#EF4444',
  Reserved:      '#F59E0B',
  NeedsCleaning: '#6366F1',
  Inactive:      '#6B7280',
};

// ── Kitchen ticket statuses ────────────────────────────────────────────────
export const TICKET_STATUS = ['Open', 'InProgress', 'Completed', 'Voided'];
export const ITEM_STATUS   = ['Pending', 'Preparing', 'Ready', 'Served'];

// ── Subscription plans ─────────────────────────────────────────────────────
export const PLAN_TYPES = ['Free', 'Pro', 'Enterprise'];

// ── Payment statuses ───────────────────────────────────────────────────────
export const PAYMENT_STATUS = ['Unpaid', 'Paid', 'Refunded', 'PartialRefund'];

// ── Payment methods ────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ['Cash', 'CreditCard', 'Wallet', 'Stripe', 'PayPal'];

// ── Units of measurement ───────────────────────────────────────────────────
export const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'oz', 'lb', 'cup', 'tbsp', 'tsp'];

// ── Dispatch statuses ──────────────────────────────────────────────────────
export const DISPATCH_STATUS = ['Assigned', 'PickedUp', 'InTransit', 'Delivered', 'Failed', 'Returned'];

// ── Vehicle types ──────────────────────────────────────────────────────────
export const VEHICLE_TYPES = ['Bike', 'Scooter', 'Car', 'Van', 'Bicycle'];

// ── Staff roles (creatable by admin) ──────────────────────────────────────
export const STAFF_ROLES = ['Manager', 'Chef', 'Waiter', 'Driver'];

// ── Admin sidebar nav items ────────────────────────────────────────────────
export const ADMIN_NAV = [
  { key: 'dashboard',  label: 'Dashboard',   icon: 'LayoutDashboard', path: '' },
  { key: 'orders',     label: 'Orders',      icon: 'ShoppingBag',     path: '/orders' },
  { key: 'menu',       label: 'Menu',        icon: 'UtensilsCrossed', path: '/menu' },
  { key: 'tables',     label: 'Tables',      icon: 'Armchair',        path: '/tables' },
  { key: 'staff',      label: 'Staff',       icon: 'Users',           path: '/staff' },
  { key: 'inventory',  label: 'Inventory',   icon: 'Package',         path: '/inventory' },
  { key: 'delivery',   label: 'Delivery',    icon: 'Truck',           path: '/delivery' },
  { key: 'crm',        label: 'CRM',         icon: 'Heart',           path: '/crm' },
  { key: 'settings',   label: 'Settings',    icon: 'Settings',        path: '/settings' },
];
