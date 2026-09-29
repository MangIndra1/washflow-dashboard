// ─── BRANCHES ────────────────────────────────────────────────────────────────
export const branches = [
  { id: 'b1', name: 'Downtown Branch', address: '123 Main Street, Downtown', phone: '+1 555-0100', manager: 'Sarah Johnson', managerId: 'e1', status: 'active', openTime: '08:00', closeTime: '20:00', dailyOrders: 45, weeklyRevenue: 3200, monthlyRevenue: 12400, rating: 4.8, totalCustomers: 234 },
  { id: 'b2', name: 'Mall Branch', address: '456 Shopping Center Ave, Midtown', phone: '+1 555-0200', manager: 'Mike Chen', managerId: 'e5', status: 'active', openTime: '09:00', closeTime: '21:00', dailyOrders: 67, weeklyRevenue: 4700, monthlyRevenue: 18900, rating: 4.6, totalCustomers: 456 },
  { id: 'b3', name: 'Suburb Branch', address: '789 Residential Rd, Westside', phone: '+1 555-0300', manager: 'Emma Wilson', managerId: 'e9', status: 'active', openTime: '08:00', closeTime: '18:00', dailyOrders: 32, weeklyRevenue: 2100, monthlyRevenue: 8700, rating: 4.9, totalCustomers: 187 },
  { id: 'b4', name: 'Airport Branch', address: 'Terminal 2, Airport Road', phone: '+1 555-0400', manager: 'Carlos Rodriguez', managerId: 'e12', status: 'maintenance', openTime: '06:00', closeTime: '22:00', dailyOrders: 28, weeklyRevenue: 1800, monthlyRevenue: 7200, rating: 4.3, totalCustomers: 98 },
];

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
export const employees = [
  { id: 'e1', name: 'Sarah Johnson', email: 'sarah@cleanwave.app', phone: '+1 555-0101', role: 'Branch Manager', branchId: 'b1', branchName: 'Downtown', status: 'active', ordersHandled: 234, commissionRate: 5, totalCommission: 620, joinDate: '2024-01-15', avatar: 'SJ' },
  { id: 'e2', name: 'David Park', email: 'david@cleanwave.app', phone: '+1 555-0102', role: 'Senior Operator', branchId: 'b1', branchName: 'Downtown', status: 'active', ordersHandled: 189, commissionRate: 4, totalCommission: 480, joinDate: '2024-03-01', avatar: 'DP' },
  { id: 'e3', name: 'Lisa Torres', email: 'lisa@cleanwave.app', phone: '+1 555-0103', role: 'Operator', branchId: 'b1', branchName: 'Downtown', status: 'active', ordersHandled: 145, commissionRate: 3, totalCommission: 350, joinDate: '2024-06-15', avatar: 'LT' },
  { id: 'e4', name: 'James Kim', email: 'james@cleanwave.app', phone: '+1 555-0104', role: 'Operator', branchId: 'b1', branchName: 'Downtown', status: 'inactive', ordersHandled: 67, commissionRate: 3, totalCommission: 120, joinDate: '2024-09-01', avatar: 'JK' },
  { id: 'e5', name: 'Mike Chen', email: 'mike@cleanwave.app', phone: '+1 555-0201', role: 'Branch Manager', branchId: 'b2', branchName: 'Mall', status: 'active', ordersHandled: 312, commissionRate: 5, totalCommission: 945, joinDate: '2023-11-01', avatar: 'MC' },
  { id: 'e6', name: 'Priya Sharma', email: 'priya@cleanwave.app', phone: '+1 555-0202', role: 'Senior Operator', branchId: 'b2', branchName: 'Mall', status: 'active', ordersHandled: 278, commissionRate: 4, totalCommission: 720, joinDate: '2024-01-20', avatar: 'PS' },
  { id: 'e7', name: 'Tom Wilson', email: 'tom@cleanwave.app', phone: '+1 555-0203', role: 'Operator', branchId: 'b2', branchName: 'Mall', status: 'active', ordersHandled: 198, commissionRate: 3, totalCommission: 450, joinDate: '2024-04-01', avatar: 'TW' },
  { id: 'e8', name: 'Ana Garcia', email: 'ana@cleanwave.app', phone: '+1 555-0204', role: 'Operator', branchId: 'b2', branchName: 'Mall', status: 'active', ordersHandled: 167, commissionRate: 3, totalCommission: 380, joinDate: '2024-05-15', avatar: 'AG' },
  { id: 'e9', name: 'Emma Wilson', email: 'emma@cleanwave.app', phone: '+1 555-0301', role: 'Branch Manager', branchId: 'b3', branchName: 'Suburb', status: 'active', ordersHandled: 198, commissionRate: 5, totalCommission: 435, joinDate: '2024-02-01', avatar: 'EW' },
  { id: 'e10', name: 'Ryan Lee', email: 'ryan@cleanwave.app', phone: '+1 555-0302', role: 'Operator', branchId: 'b3', branchName: 'Suburb', status: 'active', ordersHandled: 134, commissionRate: 3, totalCommission: 290, joinDate: '2024-07-01', avatar: 'RL' },
  { id: 'e11', name: 'Nina Patel', email: 'nina@cleanwave.app', phone: '+1 555-0303', role: 'Operator', branchId: 'b3', branchName: 'Suburb', status: 'active', ordersHandled: 112, commissionRate: 3, totalCommission: 240, joinDate: '2024-08-15', avatar: 'NP' },
  { id: 'e12', name: 'Carlos Rodriguez', email: 'carlos@cleanwave.app', phone: '+1 555-0401', role: 'Branch Manager', branchId: 'b4', branchName: 'Airport', status: 'active', ordersHandled: 156, commissionRate: 5, totalCommission: 360, joinDate: '2024-03-15', avatar: 'CR' },
  { id: 'e13', name: 'Zoe Martin', email: 'zoe@cleanwave.app', phone: '+1 555-0402', role: 'Operator', branchId: 'b4', branchName: 'Airport', status: 'active', ordersHandled: 98, commissionRate: 3, totalCommission: 210, joinDate: '2024-10-01', avatar: 'ZM' },
];

// ─── SERVICES ─────────────────────────────────────────────────────────────────
export const services = [
  { id: 's1', name: 'Wash & Fold', category: 'Regular', price: 3.50, priceUnit: 'per kg', estimatedTime: '24 hours', color: 'blue', description: 'Complete wash, dry, and fold service', isActive: true, ordersThisMonth: 420 },
  { id: 's2', name: 'Dry Cleaning', category: 'Premium', price: 12.00, priceUnit: 'per piece', estimatedTime: '48 hours', color: 'purple', description: 'Professional dry cleaning for delicate garments', isActive: true, ordersThisMonth: 185 },
  { id: 's3', name: 'Express Wash', category: 'Express', price: 6.00, priceUnit: 'per kg', estimatedTime: '4 hours', color: 'orange', description: 'Same-day express washing service', isActive: true, ordersThisMonth: 230 },
  { id: 's4', name: 'Ironing Only', category: 'Regular', price: 2.50, priceUnit: 'per piece', estimatedTime: '12 hours', color: 'green', description: 'Professional ironing and pressing service', isActive: true, ordersThisMonth: 310 },
  { id: 's5', name: 'Comforter & Blanket', category: 'Specialty', price: 18.00, priceUnit: 'per piece', estimatedTime: '48 hours', color: 'teal', description: 'Large item washing for comforters and blankets', isActive: true, ordersThisMonth: 78 },
  { id: 's6', name: 'Leather Cleaning', category: 'Specialty', price: 25.00, priceUnit: 'per piece', estimatedTime: '72 hours', color: 'amber', description: 'Expert leather garment care and conditioning', isActive: true, ordersThisMonth: 42 },
  { id: 's7', name: 'Shoe Cleaning', category: 'Specialty', price: 8.00, priceUnit: 'per pair', estimatedTime: '24 hours', color: 'red', description: 'Professional shoe cleaning and restoration', isActive: true, ordersThisMonth: 65 },
  { id: 's8', name: 'Curtain Wash', category: 'Specialty', price: 22.00, priceUnit: 'per set', estimatedTime: '48 hours', color: 'indigo', description: 'Complete curtain washing and pressing', isActive: false, ordersThisMonth: 0 },
];

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export type OrderStatus = 'received' | 'washing' | 'drying' | 'ironing' | 'ready' | 'completed';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export const orders = [
  { id: 'ORD-2026-0001', customerId: 'c1', customerName: 'Alice Brown', phone: '555-0101', serviceId: 's1', serviceName: 'Wash & Fold', weight: 5.2, quantity: null, status: 'completed' as OrderStatus, branch: 'Downtown', branchId: 'b1', employeeId: 'e2', employeeName: 'David Park', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 18.20, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0002', customerId: 'c2', customerName: 'Bob Martinez', phone: '555-0102', serviceId: 's2', serviceName: 'Dry Cleaning', weight: null, quantity: 3, status: 'ready' as OrderStatus, branch: 'Downtown', branchId: 'b1', employeeId: 'e3', employeeName: 'Lisa Torres', createdAt: '2026-02-27', dueDate: '2026-03-01', total: 36.00, paymentStatus: 'unpaid' as PaymentStatus, notes: 'Handle with care' },
  { id: 'ORD-2026-0003', customerId: 'c3', customerName: 'Carol Davis', phone: '555-0103', serviceId: 's3', serviceName: 'Express Wash', weight: 3.8, quantity: null, status: 'ironing' as OrderStatus, branch: 'Mall', branchId: 'b2', employeeId: 'e6', employeeName: 'Priya Sharma', createdAt: '2026-02-27', dueDate: '2026-02-27', total: 22.80, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0004', customerId: 'c4', customerName: 'Daniel Wilson', phone: '555-0104', serviceId: 's4', serviceName: 'Ironing Only', weight: null, quantity: 8, status: 'washing' as OrderStatus, branch: 'Mall', branchId: 'b2', employeeId: 'e7', employeeName: 'Tom Wilson', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 20.00, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0005', customerId: 'c5', customerName: 'Eve Johnson', phone: '555-0105', serviceId: 's5', serviceName: 'Comforter & Blanket', weight: null, quantity: 2, status: 'drying' as OrderStatus, branch: 'Suburb', branchId: 'b3', employeeId: 'e10', employeeName: 'Ryan Lee', createdAt: '2026-02-26', dueDate: '2026-02-28', total: 36.00, paymentStatus: 'unpaid' as PaymentStatus, notes: 'King size comforters' },
  { id: 'ORD-2026-0006', customerId: 'c6', customerName: 'Frank Lee', phone: '555-0106', serviceId: 's1', serviceName: 'Wash & Fold', weight: 7.5, quantity: null, status: 'received' as OrderStatus, branch: 'Downtown', branchId: 'b1', employeeId: 'e2', employeeName: 'David Park', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 26.25, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0007', customerId: 'c7', customerName: 'Grace Kim', phone: '555-0107', serviceId: 's2', serviceName: 'Dry Cleaning', weight: null, quantity: 5, status: 'received' as OrderStatus, branch: 'Mall', branchId: 'b2', employeeId: 'e6', employeeName: 'Priya Sharma', createdAt: '2026-02-27', dueDate: '2026-03-01', total: 60.00, paymentStatus: 'paid' as PaymentStatus, notes: 'Wedding dress — handle extremely carefully' },
  { id: 'ORD-2026-0008', customerId: 'c8', customerName: 'Henry Nguyen', phone: '555-0108', serviceId: 's3', serviceName: 'Express Wash', weight: 4.2, quantity: null, status: 'washing' as OrderStatus, branch: 'Downtown', branchId: 'b1', employeeId: 'e3', employeeName: 'Lisa Torres', createdAt: '2026-02-27', dueDate: '2026-02-27', total: 25.20, paymentStatus: 'paid' as PaymentStatus, notes: 'Needed by 5pm' },
  { id: 'ORD-2026-0009', customerId: 'c9', customerName: 'Iris Chen', phone: '555-0109', serviceId: 's6', serviceName: 'Leather Cleaning', weight: null, quantity: 2, status: 'drying' as OrderStatus, branch: 'Mall', branchId: 'b2', employeeId: 'e7', employeeName: 'Tom Wilson', createdAt: '2026-02-25', dueDate: '2026-02-28', total: 50.00, paymentStatus: 'unpaid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0010', customerId: 'c10', customerName: 'Jake Thompson', phone: '555-0110', serviceId: 's7', serviceName: 'Shoe Cleaning', weight: null, quantity: 3, status: 'ready' as OrderStatus, branch: 'Suburb', branchId: 'b3', employeeId: 'e11', employeeName: 'Nina Patel', createdAt: '2026-02-26', dueDate: '2026-02-27', total: 24.00, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0011', customerId: 'c1', customerName: 'Alice Brown', phone: '555-0101', serviceId: 's1', serviceName: 'Wash & Fold', weight: 4.5, quantity: null, status: 'completed' as OrderStatus, branch: 'Downtown', branchId: 'b1', employeeId: 'e2', employeeName: 'David Park', createdAt: '2026-02-24', dueDate: '2026-02-25', total: 15.75, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0012', customerId: 'c11', customerName: 'Kate Brown', phone: '555-0111', serviceId: 's4', serviceName: 'Ironing Only', weight: null, quantity: 12, status: 'ironing' as OrderStatus, branch: 'Airport', branchId: 'b4', employeeId: 'e13', employeeName: 'Zoe Martin', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 30.00, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0013', customerId: 'c6', customerName: 'Frank Lee', phone: '555-0106', serviceId: 's3', serviceName: 'Express Wash', weight: 2.9, quantity: null, status: 'completed' as OrderStatus, branch: 'Downtown', branchId: 'b1', employeeId: 'e2', employeeName: 'David Park', createdAt: '2026-02-27', dueDate: '2026-02-27', total: 17.40, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0014', customerId: 'c7', customerName: 'Grace Kim', phone: '555-0107', serviceId: 's5', serviceName: 'Comforter & Blanket', weight: null, quantity: 1, status: 'washing' as OrderStatus, branch: 'Mall', branchId: 'b2', employeeId: 'e8', employeeName: 'Ana Garcia', createdAt: '2026-02-27', dueDate: '2026-03-01', total: 18.00, paymentStatus: 'partial' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0015', customerId: 'c3', customerName: 'Carol Davis', phone: '555-0103', serviceId: 's1', serviceName: 'Wash & Fold', weight: 6.0, quantity: null, status: 'drying' as OrderStatus, branch: 'Mall', branchId: 'b2', employeeId: 'e6', employeeName: 'Priya Sharma', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 21.00, paymentStatus: 'paid' as PaymentStatus, notes: '' },
];

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export const customers = [
  { id: 'c1', name: 'Alice Brown', phone: '555-0101', email: 'alice.brown@email.com', address: '10 Maple Street', totalOrders: 12, totalSpent: 234.50, loyaltyPoints: 2345, membershipTier: 'Gold', lastVisit: '2026-02-27', joinDate: '2024-08-01', preferredBranch: 'Downtown' },
  { id: 'c2', name: 'Bob Martinez', phone: '555-0102', email: 'bob.m@email.com', address: '25 Oak Avenue', totalOrders: 5, totalSpent: 95.00, loyaltyPoints: 950, membershipTier: 'Silver', lastVisit: '2026-02-27', joinDate: '2025-01-15', preferredBranch: 'Downtown' },
  { id: 'c3', name: 'Carol Davis', phone: '555-0103', email: 'carol.d@email.com', address: '45 Pine Road', totalOrders: 8, totalSpent: 156.20, loyaltyPoints: 1562, membershipTier: 'Silver', lastVisit: '2026-02-27', joinDate: '2024-11-01', preferredBranch: 'Mall' },
  { id: 'c4', name: 'Daniel Wilson', phone: '555-0104', email: 'daniel.w@email.com', address: '67 Elm Street', totalOrders: 3, totalSpent: 54.00, loyaltyPoints: 540, membershipTier: 'Bronze', lastVisit: '2026-02-27', joinDate: '2025-09-01', preferredBranch: 'Mall' },
  { id: 'c5', name: 'Eve Johnson', phone: '555-0105', email: 'eve.j@email.com', address: '89 Cedar Lane', totalOrders: 6, totalSpent: 210.00, loyaltyPoints: 2100, membershipTier: 'Gold', lastVisit: '2026-02-26', joinDate: '2024-06-01', preferredBranch: 'Suburb' },
  { id: 'c6', name: 'Frank Lee', phone: '555-0106', email: 'frank.l@email.com', address: '102 Birch Blvd', totalOrders: 15, totalSpent: 312.50, loyaltyPoints: 3125, membershipTier: 'Platinum', lastVisit: '2026-02-27', joinDate: '2024-02-01', preferredBranch: 'Downtown' },
  { id: 'c7', name: 'Grace Kim', phone: '555-0107', email: 'grace.k@email.com', address: '200 Walnut Way', totalOrders: 9, totalSpent: 423.00, loyaltyPoints: 4230, membershipTier: 'Platinum', lastVisit: '2026-02-27', joinDate: '2024-04-01', preferredBranch: 'Mall' },
  { id: 'c8', name: 'Henry Nguyen', phone: '555-0108', email: 'henry.n@email.com', address: '315 Ash Court', totalOrders: 4, totalSpent: 78.00, loyaltyPoints: 780, membershipTier: 'Bronze', lastVisit: '2026-02-27', joinDate: '2025-06-01', preferredBranch: 'Downtown' },
  { id: 'c9', name: 'Iris Chen', phone: '555-0109', email: 'iris.c@email.com', address: '420 Cypress Drive', totalOrders: 7, totalSpent: 287.00, loyaltyPoints: 2870, membershipTier: 'Gold', lastVisit: '2026-02-25', joinDate: '2024-09-01', preferredBranch: 'Mall' },
  { id: 'c10', name: 'Jake Thompson', phone: '555-0110', email: 'jake.t@email.com', address: '515 Magnolia Ave', totalOrders: 2, totalSpent: 32.00, loyaltyPoints: 320, membershipTier: 'Bronze', lastVisit: '2026-02-26', joinDate: '2026-01-15', preferredBranch: 'Suburb' },
  { id: 'c11', name: 'Kate Brown', phone: '555-0111', email: 'kate.b@email.com', address: '600 Rose Street', totalOrders: 11, totalSpent: 198.50, loyaltyPoints: 1985, membershipTier: 'Silver', lastVisit: '2026-02-27', joinDate: '2024-07-01', preferredBranch: 'Airport' },
];

// ─── INVENTORY ────────────────────────────────────────────────────────────────
export const inventory = [
  { id: 'inv1', name: 'Laundry Detergent Powder', category: 'Chemicals', unit: 'kg', currentStock: 45, minStock: 20, reorderPoint: 30, unitCost: 2.50, supplier: 'CleanCo Supplies', lastRestocked: '2026-02-20' },
  { id: 'inv2', name: 'Fabric Softener Liquid', category: 'Chemicals', unit: 'liters', currentStock: 18, minStock: 15, reorderPoint: 20, unitCost: 3.80, supplier: 'CleanCo Supplies', lastRestocked: '2026-02-15' },
  { id: 'inv3', name: 'Stain Remover Spray', category: 'Chemicals', unit: 'bottles', currentStock: 12, minStock: 10, reorderPoint: 15, unitCost: 6.50, supplier: 'PureTex Ltd', lastRestocked: '2026-02-18' },
  { id: 'inv4', name: 'Dry Cleaning Solvent', category: 'Chemicals', unit: 'liters', currentStock: 8, minStock: 10, reorderPoint: 15, unitCost: 15.00, supplier: 'ProChem Industries', lastRestocked: '2026-02-10' },
  { id: 'inv5', name: 'Plastic Bags (Small)', category: 'Packaging', unit: 'pieces', currentStock: 500, minStock: 200, reorderPoint: 300, unitCost: 0.15, supplier: 'PackMaster', lastRestocked: '2026-02-25' },
  { id: 'inv6', name: 'Plastic Bags (Large)', category: 'Packaging', unit: 'pieces', currentStock: 230, minStock: 100, reorderPoint: 150, unitCost: 0.25, supplier: 'PackMaster', lastRestocked: '2026-02-25' },
  { id: 'inv7', name: 'Thermal Label Rolls', category: 'Packaging', unit: 'rolls', currentStock: 8, minStock: 5, reorderPoint: 7, unitCost: 12.00, supplier: 'LabelPro', lastRestocked: '2026-02-01' },
  { id: 'inv8', name: 'Wire Hangers', category: 'Equipment', unit: 'pieces', currentStock: 1200, minStock: 500, reorderPoint: 800, unitCost: 0.05, supplier: 'HangerWorld', lastRestocked: '2026-02-22' },
  { id: 'inv9', name: 'Plastic Hangers', category: 'Equipment', unit: 'pieces', currentStock: 345, minStock: 200, reorderPoint: 300, unitCost: 0.35, supplier: 'HangerWorld', lastRestocked: '2026-02-22' },
  { id: 'inv10', name: 'Receipt Paper Rolls', category: 'Office', unit: 'rolls', currentStock: 24, minStock: 10, reorderPoint: 15, unitCost: 3.00, supplier: 'OfficeStar', lastRestocked: '2026-02-15' },
  { id: 'inv11', name: 'Anti-Static Spray', category: 'Chemicals', unit: 'bottles', currentStock: 6, minStock: 8, reorderPoint: 10, unitCost: 9.00, supplier: 'PureTex Ltd', lastRestocked: '2026-01-30' },
  { id: 'inv12', name: 'Leather Conditioner', category: 'Chemicals', unit: 'bottles', currentStock: 15, minStock: 5, reorderPoint: 8, unitCost: 18.00, supplier: 'LeatherCare Pro', lastRestocked: '2026-02-12' },
];

// ─── REVENUE DATA ─────────────────────────────────────────────────────────────
export const revenueData = {
  weekly: [
    { date: 'Feb 21', revenue: 1245, orders: 34 },
    { date: 'Feb 22', revenue: 1380, orders: 41 },
    { date: 'Feb 23', revenue: 980, orders: 28 },
    { date: 'Feb 24', revenue: 1520, orders: 47 },
    { date: 'Feb 25', revenue: 1890, orders: 56 },
    { date: 'Feb 26', revenue: 2100, orders: 63 },
    { date: 'Feb 27', revenue: 1750, orders: 52 },
  ],
  monthly: [
    { month: 'Sep', revenue: 28400, orders: 820 },
    { month: 'Oct', revenue: 31200, orders: 940 },
    { month: 'Nov', revenue: 34600, orders: 1050 },
    { month: 'Dec', revenue: 38900, orders: 1180 },
    { month: 'Jan', revenue: 35200, orders: 1050 },
    { month: 'Feb', revenue: 41800, orders: 1240 },
  ],
};

export const branchPerformance = [
  { branch: 'Downtown', revenue: 12400, orders: 340, customers: 234 },
  { branch: 'Mall', revenue: 18900, orders: 520, customers: 456 },
  { branch: 'Suburb', revenue: 8700, orders: 240, customers: 187 },
  { branch: 'Airport', revenue: 7200, orders: 198, customers: 98 },
];

export const serviceBreakdown = [
  { name: 'Wash & Fold', value: 420, color: '#3B82F6' },
  { name: 'Ironing', value: 310, color: '#10B981' },
  { name: 'Express Wash', value: 230, color: '#F59E0B' },
  { name: 'Dry Cleaning', value: 185, color: '#8B5CF6' },
  { name: 'Specialty', value: 185, color: '#EF4444' },
];

// ─── PROMOTIONS ───────────────────────────────────────────────────────────────
export const promotions = [
  { id: 'p1', name: 'First-Time Customer Discount', type: 'percentage', value: 20, minOrder: 0, usageCount: 45, maxUsage: 100, validFrom: '2026-02-01', validTo: '2026-03-31', status: 'active', code: 'FIRST20' },
  { id: 'p2', name: 'Weekend Special', type: 'percentage', value: 15, minOrder: 20, usageCount: 123, maxUsage: 500, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active', code: 'WEEKEND15' },
  { id: 'p3', name: 'Bulk Wash Discount', type: 'fixed', value: 5, minOrder: 30, usageCount: 67, maxUsage: 200, validFrom: '2026-02-01', validTo: '2026-03-15', status: 'active', code: 'BULK5OFF' },
  { id: 'p4', name: 'Loyalty Member Bonus', type: 'percentage', value: 10, minOrder: 15, usageCount: 234, maxUsage: 1000, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active', code: 'MEMBER10' },
  { id: 'p5', name: 'Valentine Special', type: 'percentage', value: 25, minOrder: 25, usageCount: 89, maxUsage: 100, validFrom: '2026-02-10', validTo: '2026-02-16', status: 'expired', code: 'LOVE25' },
  { id: 'p6', name: 'Summer Refresh', type: 'fixed', value: 8, minOrder: 40, usageCount: 0, maxUsage: 300, validFrom: '2026-06-01', validTo: '2026-08-31', status: 'scheduled', code: 'SUMMER8' },
];

// ─── MEMBERSHIP TIERS ─────────────────────────────────────────────────────────
export const membershipTiers = [
  { id: 'mt1', name: 'Bronze', minPoints: 0, maxPoints: 999, discount: 0, color: '#B45309', members: 234, benefits: ['Basic support', '5% birthday discount'] },
  { id: 'mt2', name: 'Silver', minPoints: 1000, maxPoints: 2499, discount: 5, color: '#64748B', members: 178, benefits: ['5% discount on all orders', 'Priority pickup', '10% birthday discount'] },
  { id: 'mt3', name: 'Gold', minPoints: 2500, maxPoints: 4999, discount: 10, color: '#D97706', members: 89, benefits: ['10% discount on all orders', 'Priority processing', 'Free monthly express wash', '15% birthday discount'] },
  { id: 'mt4', name: 'Platinum', minPoints: 5000, maxPoints: null, discount: 15, color: '#2563EB', members: 34, benefits: ['15% discount on all orders', 'Priority processing', 'Free weekly express wash', 'Dedicated customer service', '20% birthday discount'] },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = [
  { id: 'n1', type: 'overdue', message: 'Order ORD-2026-0003 is overdue for pickup', time: '5 min ago', read: false },
  { id: 'n2', type: 'low_stock', message: 'Dry Cleaning Solvent is below minimum stock level', time: '1 hour ago', read: false },
  { id: 'n3', type: 'new_order', message: 'New order ORD-2026-0015 placed at Mall Branch', time: '2 hours ago', read: false },
  { id: 'n4', type: 'completed', message: 'Order ORD-2026-0011 has been completed', time: '3 hours ago', read: true },
  { id: 'n5', type: 'low_stock', message: 'Anti-Static Spray is below minimum stock level', time: '4 hours ago', read: true },
];
