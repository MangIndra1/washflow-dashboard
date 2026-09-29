// ─── BRANCHES ────────────────────────────────────────────────────────────────
export const branches = [
  { id: 'b1', name: 'Cabang Denpasar', address: 'Jl. Teuku Umar Barat No. 88, Denpasar', phone: '0361 000 101', manager: 'Made Wirawan', managerId: 'e1', status: 'active', openTime: '08:00', closeTime: '20:00', dailyOrders: 45, weeklyRevenue: 6400000, monthlyRevenue: 24800000, rating: 4.8, totalCustomers: 234 },
  { id: 'b2', name: 'Cabang Kuta', address: 'Jl. Raya Kuta No. 12, Kuta, Badung', phone: '0361 000 102', manager: 'Wayan Gede Adnyana', managerId: 'e5', status: 'active', openTime: '09:00', closeTime: '21:00', dailyOrders: 67, weeklyRevenue: 9400000, monthlyRevenue: 37800000, rating: 4.6, totalCustomers: 456 },
  { id: 'b3', name: 'Cabang Jimbaran', address: 'Jl. Raya Uluwatu No. 5, Jimbaran, Badung', phone: '0361 000 103', manager: 'Komang Sinta Maharani', managerId: 'e9', status: 'active', openTime: '08:00', closeTime: '18:00', dailyOrders: 32, weeklyRevenue: 4200000, monthlyRevenue: 17400000, rating: 4.9, totalCustomers: 187 },
  { id: 'b4', name: 'Cabang Ubud', address: 'Jl. Raya Ubud No. 3, Ubud, Gianyar', phone: '0361 000 104', manager: 'Nyoman Suartika', managerId: 'e12', status: 'maintenance', openTime: '06:00', closeTime: '22:00', dailyOrders: 28, weeklyRevenue: 3600000, monthlyRevenue: 14400000, rating: 4.3, totalCustomers: 98 },
];

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
export const employees = [
  { id: 'e1', name: 'Made Wirawan', email: 'made.wirawan@washflow.example.com', phone: '0812-3456-0101', role: 'Manajer Cabang', branchId: 'b1', branchName: 'Denpasar', status: 'active', ordersHandled: 234, commissionRate: 5, totalCommission: 1240000, joinDate: '2024-01-15', avatar: 'MW' },
  { id: 'e2', name: 'Ketut Arya Mahendra', email: 'ketut.arya@washflow.example.com', phone: '0812-3456-0102', role: 'Operator Senior', branchId: 'b1', branchName: 'Denpasar', status: 'active', ordersHandled: 189, commissionRate: 4, totalCommission: 960000, joinDate: '2024-03-01', avatar: 'KM' },
  { id: 'e3', name: 'Putu Ayu Lestari', email: 'putu.ayu@washflow.example.com', phone: '0812-3456-0103', role: 'Operator', branchId: 'b1', branchName: 'Denpasar', status: 'active', ordersHandled: 145, commissionRate: 3, totalCommission: 700000, joinDate: '2024-06-15', avatar: 'PL' },
  { id: 'e4', name: 'Kadek Dwi Putra', email: 'kadek.dwi@washflow.example.com', phone: '0812-3456-0104', role: 'Operator', branchId: 'b1', branchName: 'Denpasar', status: 'inactive', ordersHandled: 67, commissionRate: 3, totalCommission: 240000, joinDate: '2024-09-01', avatar: 'KP' },
  { id: 'e5', name: 'Wayan Gede Adnyana', email: 'wayan.gede@washflow.example.com', phone: '0812-3456-0201', role: 'Manajer Cabang', branchId: 'b2', branchName: 'Kuta', status: 'active', ordersHandled: 312, commissionRate: 5, totalCommission: 1890000, joinDate: '2023-11-01', avatar: 'WA' },
  { id: 'e6', name: 'Ni Luh Mira Sari', email: 'ni.luh.mira@washflow.example.com', phone: '0812-3456-0202', role: 'Operator Senior', branchId: 'b2', branchName: 'Kuta', status: 'active', ordersHandled: 278, commissionRate: 4, totalCommission: 1440000, joinDate: '2024-01-20', avatar: 'NS' },
  { id: 'e7', name: 'Agus Prasetyo', email: 'agus.prasetyo@washflow.example.com', phone: '0812-3456-0203', role: 'Operator', branchId: 'b2', branchName: 'Kuta', status: 'active', ordersHandled: 198, commissionRate: 3, totalCommission: 900000, joinDate: '2024-04-01', avatar: 'AP' },
  { id: 'e8', name: 'Rina Kusuma', email: 'rina.kusuma@washflow.example.com', phone: '0812-3456-0204', role: 'Operator', branchId: 'b2', branchName: 'Kuta', status: 'active', ordersHandled: 167, commissionRate: 3, totalCommission: 760000, joinDate: '2024-05-15', avatar: 'RK' },
  { id: 'e9', name: 'Komang Sinta Maharani', email: 'komang.sinta@washflow.example.com', phone: '0812-3456-0301', role: 'Manajer Cabang', branchId: 'b3', branchName: 'Jimbaran', status: 'active', ordersHandled: 198, commissionRate: 5, totalCommission: 870000, joinDate: '2024-02-01', avatar: 'KM' },
  { id: 'e10', name: 'Yoga Pratama', email: 'yoga.pratama@washflow.example.com', phone: '0812-3456-0302', role: 'Operator', branchId: 'b3', branchName: 'Jimbaran', status: 'active', ordersHandled: 134, commissionRate: 3, totalCommission: 580000, joinDate: '2024-07-01', avatar: 'YP' },
  { id: 'e11', name: 'Ayu Wulandari', email: 'ayu.wulandari@washflow.example.com', phone: '0812-3456-0303', role: 'Operator', branchId: 'b3', branchName: 'Jimbaran', status: 'active', ordersHandled: 112, commissionRate: 3, totalCommission: 480000, joinDate: '2024-08-15', avatar: 'AW' },
  { id: 'e12', name: 'Nyoman Suartika', email: 'nyoman.suartika@washflow.example.com', phone: '0812-3456-0401', role: 'Manajer Cabang', branchId: 'b4', branchName: 'Ubud', status: 'active', ordersHandled: 156, commissionRate: 5, totalCommission: 720000, joinDate: '2024-03-15', avatar: 'NS' },
  { id: 'e13', name: 'Eka Puspita', email: 'eka.puspita@washflow.example.com', phone: '0812-3456-0402', role: 'Operator', branchId: 'b4', branchName: 'Ubud', status: 'active', ordersHandled: 98, commissionRate: 3, totalCommission: 420000, joinDate: '2024-10-01', avatar: 'EP' },
];

// ─── SERVICES ─────────────────────────────────────────────────────────────────
export const services = [
  { id: 's1', name: 'Cuci Kiloan Reguler', category: 'Reguler', price: 7000, priceUnit: 'per kg', estimatedTime: '24 jam', color: 'blue', description: 'Cuci, kering, dan lipat, selesai dalam 2 hari', isActive: true, ordersThisMonth: 420 },
  { id: 's2', name: 'Dry Cleaning', category: 'Premium', price: 25000, priceUnit: 'per pcs', estimatedTime: '48 jam', color: 'purple', description: 'Perawatan khusus untuk jas, gaun, dan pakaian berbahan halus', isActive: true, ordersThisMonth: 185 },
  { id: 's3', name: 'Cuci Kiloan Express', category: 'Express', price: 12000, priceUnit: 'per kg', estimatedTime: '6 jam', color: 'orange', description: 'Cuci express, selesai di hari yang sama', isActive: true, ordersThisMonth: 230 },
  { id: 's4', name: 'Setrika Saja', category: 'Reguler', price: 5000, priceUnit: 'per kg', estimatedTime: '24 jam', color: 'green', description: 'Setrika dan lipat rapi tanpa cuci', isActive: true, ordersThisMonth: 310 },
  { id: 's5', name: 'Bed Cover & Selimut', category: 'Khusus', price: 35000, priceUnit: 'per pcs', estimatedTime: '48 jam', color: 'teal', description: 'Cuci bed cover, selimut, dan sprei ukuran besar', isActive: true, ordersThisMonth: 78 },
  { id: 's6', name: 'Cuci Jaket Kulit', category: 'Khusus', price: 60000, priceUnit: 'per pcs', estimatedTime: '72 jam', color: 'amber', description: 'Perawatan dan pelembap khusus jaket dan produk kulit', isActive: true, ordersThisMonth: 42 },
  { id: 's7', name: 'Cuci Sepatu', category: 'Khusus', price: 40000, priceUnit: 'per pasang', estimatedTime: '24 jam', color: 'red', description: 'Pembersihan dan perawatan sepatu', isActive: true, ordersThisMonth: 65 },
  { id: 's8', name: 'Cuci Gorden', category: 'Khusus', price: 45000, priceUnit: 'per set', estimatedTime: '48 jam', color: 'indigo', description: 'Cuci dan setrika gorden', isActive: false, ordersThisMonth: 0 },
];

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export type OrderStatus = 'received' | 'washing' | 'drying' | 'ironing' | 'ready' | 'completed';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export const orders = [
  { id: 'ORD-2026-0001', customerId: 'c1', customerName: 'Made Sudarsana', phone: '0812-3456-0001', serviceId: 's1', serviceName: 'Cuci Kiloan Reguler', weight: 5.2, quantity: null, status: 'completed' as OrderStatus, branch: 'Denpasar', branchId: 'b1', employeeId: 'e2', employeeName: 'Ketut Arya Mahendra', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 36400, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0002', customerId: 'c2', customerName: 'Ketut Sari Dewi', phone: '0812-3456-0002', serviceId: 's2', serviceName: 'Dry Cleaning', weight: null, quantity: 3, status: 'ready' as OrderStatus, branch: 'Denpasar', branchId: 'b1', employeeId: 'e3', employeeName: 'Putu Ayu Lestari', createdAt: '2026-02-27', dueDate: '2026-03-01', total: 75000, paymentStatus: 'unpaid' as PaymentStatus, notes: 'Tangani dengan hati-hati' },
  { id: 'ORD-2026-0003', customerId: 'c3', customerName: 'Putu Nirmala', phone: '0812-3456-0003', serviceId: 's3', serviceName: 'Cuci Kiloan Express', weight: 3.8, quantity: null, status: 'ironing' as OrderStatus, branch: 'Kuta', branchId: 'b2', employeeId: 'e6', employeeName: 'Ni Luh Mira Sari', createdAt: '2026-02-27', dueDate: '2026-02-27', total: 45600, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0004', customerId: 'c4', customerName: 'Kadek Bagus Pratama', phone: '0812-3456-0004', serviceId: 's4', serviceName: 'Setrika Saja', weight: 4.0, quantity: null, status: 'washing' as OrderStatus, branch: 'Kuta', branchId: 'b2', employeeId: 'e7', employeeName: 'Agus Prasetyo', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 20000, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0005', customerId: 'c5', customerName: 'Komang Ayu Rahayu', phone: '0812-3456-0005', serviceId: 's5', serviceName: 'Bed Cover & Selimut', weight: null, quantity: 2, status: 'drying' as OrderStatus, branch: 'Jimbaran', branchId: 'b3', employeeId: 'e10', employeeName: 'Yoga Pratama', createdAt: '2026-02-26', dueDate: '2026-02-28', total: 70000, paymentStatus: 'unpaid' as PaymentStatus, notes: 'Bed cover ukuran king' },
  { id: 'ORD-2026-0006', customerId: 'c6', customerName: 'Wayan Sutrisna', phone: '0812-3456-0006', serviceId: 's1', serviceName: 'Cuci Kiloan Reguler', weight: 7.5, quantity: null, status: 'received' as OrderStatus, branch: 'Denpasar', branchId: 'b1', employeeId: 'e2', employeeName: 'Ketut Arya Mahendra', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 52500, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0007', customerId: 'c7', customerName: 'Ni Luh Widiani', phone: '0812-3456-0007', serviceId: 's2', serviceName: 'Dry Cleaning', weight: null, quantity: 5, status: 'received' as OrderStatus, branch: 'Kuta', branchId: 'b2', employeeId: 'e6', employeeName: 'Ni Luh Mira Sari', createdAt: '2026-02-27', dueDate: '2026-03-01', total: 125000, paymentStatus: 'paid' as PaymentStatus, notes: 'Gaun pengantin, tangani dengan sangat hati-hati' },
  { id: 'ORD-2026-0008', customerId: 'c8', customerName: 'Gede Adi Saputra', phone: '0812-3456-0008', serviceId: 's3', serviceName: 'Cuci Kiloan Express', weight: 4.2, quantity: null, status: 'washing' as OrderStatus, branch: 'Denpasar', branchId: 'b1', employeeId: 'e3', employeeName: 'Putu Ayu Lestari', createdAt: '2026-02-27', dueDate: '2026-02-27', total: 50400, paymentStatus: 'paid' as PaymentStatus, notes: 'Dibutuhkan sebelum jam 17.00' },
  { id: 'ORD-2026-0009', customerId: 'c9', customerName: 'Dewi Anggraini', phone: '0812-3456-0009', serviceId: 's6', serviceName: 'Cuci Jaket Kulit', weight: null, quantity: 2, status: 'drying' as OrderStatus, branch: 'Kuta', branchId: 'b2', employeeId: 'e7', employeeName: 'Agus Prasetyo', createdAt: '2026-02-25', dueDate: '2026-02-28', total: 120000, paymentStatus: 'unpaid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0010', customerId: 'c10', customerName: 'Rizky Ramadhan', phone: '0812-3456-0010', serviceId: 's7', serviceName: 'Cuci Sepatu', weight: null, quantity: 3, status: 'ready' as OrderStatus, branch: 'Jimbaran', branchId: 'b3', employeeId: 'e11', employeeName: 'Ayu Wulandari', createdAt: '2026-02-26', dueDate: '2026-02-27', total: 120000, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0011', customerId: 'c1', customerName: 'Made Sudarsana', phone: '0812-3456-0001', serviceId: 's1', serviceName: 'Cuci Kiloan Reguler', weight: 4.5, quantity: null, status: 'completed' as OrderStatus, branch: 'Denpasar', branchId: 'b1', employeeId: 'e2', employeeName: 'Ketut Arya Mahendra', createdAt: '2026-02-24', dueDate: '2026-02-25', total: 31500, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0012', customerId: 'c11', customerName: 'Lina Marlina', phone: '0812-3456-0011', serviceId: 's4', serviceName: 'Setrika Saja', weight: 6.0, quantity: null, status: 'ironing' as OrderStatus, branch: 'Ubud', branchId: 'b4', employeeId: 'e13', employeeName: 'Eka Puspita', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 30000, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0013', customerId: 'c6', customerName: 'Wayan Sutrisna', phone: '0812-3456-0006', serviceId: 's3', serviceName: 'Cuci Kiloan Express', weight: 2.9, quantity: null, status: 'completed' as OrderStatus, branch: 'Denpasar', branchId: 'b1', employeeId: 'e2', employeeName: 'Ketut Arya Mahendra', createdAt: '2026-02-27', dueDate: '2026-02-27', total: 34800, paymentStatus: 'paid' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0014', customerId: 'c7', customerName: 'Ni Luh Widiani', phone: '0812-3456-0007', serviceId: 's5', serviceName: 'Bed Cover & Selimut', weight: null, quantity: 1, status: 'washing' as OrderStatus, branch: 'Kuta', branchId: 'b2', employeeId: 'e8', employeeName: 'Rina Kusuma', createdAt: '2026-02-27', dueDate: '2026-03-01', total: 35000, paymentStatus: 'partial' as PaymentStatus, notes: '' },
  { id: 'ORD-2026-0015', customerId: 'c3', customerName: 'Putu Nirmala', phone: '0812-3456-0003', serviceId: 's1', serviceName: 'Cuci Kiloan Reguler', weight: 6.0, quantity: null, status: 'drying' as OrderStatus, branch: 'Kuta', branchId: 'b2', employeeId: 'e6', employeeName: 'Ni Luh Mira Sari', createdAt: '2026-02-27', dueDate: '2026-02-28', total: 42000, paymentStatus: 'paid' as PaymentStatus, notes: '' },
];

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export const customers = [
  { id: 'c1', name: 'Made Sudarsana', phone: '0812-3456-0001', email: 'made.sudarsana@example.com', address: 'Jl. Sudirman No. 4, Denpasar', totalOrders: 12, totalSpent: 469000, loyaltyPoints: 2345, membershipTier: 'Gold', lastVisit: '2026-02-27', joinDate: '2024-08-01', preferredBranch: 'Denpasar' },
  { id: 'c2', name: 'Ketut Sari Dewi', phone: '0812-3456-0002', email: 'ketut.sari@example.com', address: 'Jl. Gatot Subroto No. 21, Denpasar', totalOrders: 5, totalSpent: 190000, loyaltyPoints: 950, membershipTier: 'Silver', lastVisit: '2026-02-27', joinDate: '2025-01-15', preferredBranch: 'Denpasar' },
  { id: 'c3', name: 'Putu Nirmala', phone: '0812-3456-0003', email: 'putu.nirmala@example.com', address: 'Jl. Imam Bonjol No. 9, Denpasar', totalOrders: 8, totalSpent: 312000, loyaltyPoints: 1562, membershipTier: 'Silver', lastVisit: '2026-02-27', joinDate: '2024-11-01', preferredBranch: 'Kuta' },
  { id: 'c4', name: 'Kadek Bagus Pratama', phone: '0812-3456-0004', email: 'kadek.bagus@example.com', address: 'Jl. Diponegoro No. 15, Denpasar', totalOrders: 3, totalSpent: 108000, loyaltyPoints: 540, membershipTier: 'Bronze', lastVisit: '2026-02-27', joinDate: '2025-09-01', preferredBranch: 'Kuta' },
  { id: 'c5', name: 'Komang Ayu Rahayu', phone: '0812-3456-0005', email: 'komang.ayu@example.com', address: 'Jl. Hayam Wuruk No. 30, Denpasar', totalOrders: 6, totalSpent: 420000, loyaltyPoints: 2100, membershipTier: 'Gold', lastVisit: '2026-02-26', joinDate: '2024-06-01', preferredBranch: 'Jimbaran' },
  { id: 'c6', name: 'Wayan Sutrisna', phone: '0812-3456-0006', email: 'wayan.sutrisna@example.com', address: 'Jl. Raya Kuta No. 44, Kuta', totalOrders: 15, totalSpent: 625000, loyaltyPoints: 3125, membershipTier: 'Platinum', lastVisit: '2026-02-27', joinDate: '2024-02-01', preferredBranch: 'Denpasar' },
  { id: 'c7', name: 'Ni Luh Widiani', phone: '0812-3456-0007', email: 'ni.luh.widiani@example.com', address: 'Jl. Legian No. 18, Kuta', totalOrders: 9, totalSpent: 846000, loyaltyPoints: 4230, membershipTier: 'Platinum', lastVisit: '2026-02-27', joinDate: '2024-04-01', preferredBranch: 'Kuta' },
  { id: 'c8', name: 'Gede Adi Saputra', phone: '0812-3456-0008', email: 'gede.adi@example.com', address: 'Jl. Sunset Road No. 7, Kuta', totalOrders: 4, totalSpent: 156000, loyaltyPoints: 780, membershipTier: 'Bronze', lastVisit: '2026-02-27', joinDate: '2025-06-01', preferredBranch: 'Denpasar' },
  { id: 'c9', name: 'Dewi Anggraini', phone: '0812-3456-0009', email: 'dewi.anggraini@example.com', address: 'Jl. Kartika Plaza No. 11, Kuta', totalOrders: 7, totalSpent: 574000, loyaltyPoints: 2870, membershipTier: 'Gold', lastVisit: '2026-02-25', joinDate: '2024-09-01', preferredBranch: 'Kuta' },
  { id: 'c10', name: 'Rizky Ramadhan', phone: '0812-3456-0010', email: 'rizky.ramadhan@example.com', address: 'Jl. Puri Gading No. 14, Jimbaran', totalOrders: 2, totalSpent: 64000, loyaltyPoints: 320, membershipTier: 'Bronze', lastVisit: '2026-02-26', joinDate: '2026-01-15', preferredBranch: 'Jimbaran' },
  { id: 'c11', name: 'Lina Marlina', phone: '0812-3456-0011', email: 'lina.marlina@example.com', address: 'Jl. Bypass Ngurah Rai No. 9, Kuta', totalOrders: 11, totalSpent: 397000, loyaltyPoints: 1985, membershipTier: 'Silver', lastVisit: '2026-02-27', joinDate: '2024-07-01', preferredBranch: 'Ubud' },
];

// ─── INVENTORY ────────────────────────────────────────────────────────────────
export const inventory = [
  { id: 'inv1', name: 'Deterjen Bubuk', category: 'Kimia', unit: 'kg', currentStock: 45, minStock: 20, reorderPoint: 30, unitCost: 18000, supplier: 'CV Bersih Sejahtera', lastRestocked: '2026-02-20' },
  { id: 'inv2', name: 'Pelembut Pakaian Cair', category: 'Kimia', unit: 'liter', currentStock: 18, minStock: 15, reorderPoint: 20, unitCost: 25000, supplier: 'CV Bersih Sejahtera', lastRestocked: '2026-02-15' },
  { id: 'inv3', name: 'Semprotan Penghilang Noda', category: 'Kimia', unit: 'botol', currentStock: 12, minStock: 10, reorderPoint: 15, unitCost: 45000, supplier: 'PT Tekstil Murni', lastRestocked: '2026-02-18' },
  { id: 'inv4', name: 'Cairan Pelarut Dry Cleaning', category: 'Kimia', unit: 'liter', currentStock: 8, minStock: 10, reorderPoint: 15, unitCost: 95000, supplier: 'PT Kimia Prima', lastRestocked: '2026-02-10' },
  { id: 'inv5', name: 'Kantong Plastik Kecil', category: 'Kemasan', unit: 'pcs', currentStock: 500, minStock: 200, reorderPoint: 300, unitCost: 300, supplier: 'Toko Kemasan Bali', lastRestocked: '2026-02-25' },
  { id: 'inv6', name: 'Kantong Plastik Besar', category: 'Kemasan', unit: 'pcs', currentStock: 230, minStock: 100, reorderPoint: 150, unitCost: 500, supplier: 'Toko Kemasan Bali', lastRestocked: '2026-02-25' },
  { id: 'inv7', name: 'Rol Label Thermal', category: 'Kemasan', unit: 'rol', currentStock: 8, minStock: 5, reorderPoint: 7, unitCost: 25000, supplier: 'Label Prima', lastRestocked: '2026-02-01' },
  { id: 'inv8', name: 'Hanger Kawat', category: 'Peralatan', unit: 'pcs', currentStock: 1200, minStock: 500, reorderPoint: 800, unitCost: 200, supplier: 'Gudang Hanger Denpasar', lastRestocked: '2026-02-22' },
  { id: 'inv9', name: 'Hanger Plastik', category: 'Peralatan', unit: 'pcs', currentStock: 345, minStock: 200, reorderPoint: 300, unitCost: 800, supplier: 'Gudang Hanger Denpasar', lastRestocked: '2026-02-22' },
  { id: 'inv10', name: 'Rol Kertas Struk', category: 'Kantor', unit: 'rol', currentStock: 24, minStock: 10, reorderPoint: 15, unitCost: 7000, supplier: 'Toko ATK Sumber Rejeki', lastRestocked: '2026-02-15' },
  { id: 'inv11', name: 'Semprotan Anti Statis', category: 'Kimia', unit: 'botol', currentStock: 6, minStock: 8, reorderPoint: 10, unitCost: 60000, supplier: 'PT Tekstil Murni', lastRestocked: '2026-01-30' },
  { id: 'inv12', name: 'Kondisioner Kulit', category: 'Kimia', unit: 'botol', currentStock: 15, minStock: 5, reorderPoint: 8, unitCost: 120000, supplier: 'Perawatan Kulit Nusantara', lastRestocked: '2026-02-12' },
];

// ─── REVENUE DATA ─────────────────────────────────────────────────────────────
export const revenueData = {
  weekly: [
    { date: '21 Feb', revenue: 2490000, orders: 34 },
    { date: '22 Feb', revenue: 2760000, orders: 41 },
    { date: '23 Feb', revenue: 1960000, orders: 28 },
    { date: '24 Feb', revenue: 3040000, orders: 47 },
    { date: '25 Feb', revenue: 3780000, orders: 56 },
    { date: '26 Feb', revenue: 4200000, orders: 63 },
    { date: '27 Feb', revenue: 3500000, orders: 52 },
  ],
  monthly: [
    { month: 'Sep', revenue: 56800000, orders: 820 },
    { month: 'Okt', revenue: 62400000, orders: 940 },
    { month: 'Nov', revenue: 69200000, orders: 1050 },
    { month: 'Des', revenue: 77800000, orders: 1180 },
    { month: 'Jan', revenue: 70400000, orders: 1050 },
    { month: 'Feb', revenue: 83600000, orders: 1240 },
  ],
};

export const branchPerformance = [
  { branch: 'Denpasar', revenue: 24800000, orders: 340, customers: 234 },
  { branch: 'Kuta', revenue: 37800000, orders: 520, customers: 456 },
  { branch: 'Jimbaran', revenue: 17400000, orders: 240, customers: 187 },
  { branch: 'Ubud', revenue: 14400000, orders: 198, customers: 98 },
];

export const serviceBreakdown = [
  { name: 'Cuci Kiloan Reguler', value: 420, color: '#3B82F6' },
  { name: 'Setrika Saja', value: 310, color: '#10B981' },
  { name: 'Cuci Kiloan Express', value: 230, color: '#F59E0B' },
  { name: 'Dry Cleaning', value: 185, color: '#8B5CF6' },
  { name: 'Khusus', value: 185, color: '#EF4444' },
];

// ─── PROMOTIONS ───────────────────────────────────────────────────────────────
export const promotions = [
  { id: 'p1', name: 'Diskon Pelanggan Baru', type: 'percentage', value: 20, minOrder: 0, usageCount: 45, maxUsage: 100, validFrom: '2026-02-01', validTo: '2026-03-31', status: 'active', code: 'FIRST20' },
  { id: 'p2', name: 'Promo Akhir Pekan', type: 'percentage', value: 15, minOrder: 50000, usageCount: 123, maxUsage: 500, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active', code: 'WEEKEND15' },
  { id: 'p3', name: 'Potongan Order Besar', type: 'fixed', value: 10000, minOrder: 100000, usageCount: 67, maxUsage: 200, validFrom: '2026-02-01', validTo: '2026-03-15', status: 'active', code: 'HEMAT10K' },
  { id: 'p4', name: 'Bonus Member', type: 'percentage', value: 10, minOrder: 30000, usageCount: 234, maxUsage: 1000, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'active', code: 'MEMBER10' },
  { id: 'p5', name: 'Promo Hari Kasih Sayang', type: 'percentage', value: 25, minOrder: 50000, usageCount: 89, maxUsage: 100, validFrom: '2026-02-10', validTo: '2026-02-16', status: 'expired', code: 'KASIH25' },
  { id: 'p6', name: 'Promo Liburan Musim Panas', type: 'fixed', value: 15000, minOrder: 80000, usageCount: 0, maxUsage: 300, validFrom: '2026-06-01', validTo: '2026-08-31', status: 'scheduled', code: 'LIBURAN15' },
];

// ─── MEMBERSHIP TIERS ─────────────────────────────────────────────────────────
export const membershipTiers = [
  { id: 'mt1', name: 'Bronze', minPoints: 0, maxPoints: 999, discount: 0, color: '#B45309', members: 234, benefits: ['Layanan dasar', 'Diskon ulang tahun 5%'] },
  { id: 'mt2', name: 'Silver', minPoints: 1000, maxPoints: 2499, discount: 5, color: '#64748B', members: 178, benefits: ['Diskon 5% semua order', 'Prioritas pengambilan', 'Diskon ulang tahun 10%'] },
  { id: 'mt3', name: 'Gold', minPoints: 2500, maxPoints: 4999, discount: 10, color: '#D97706', members: 89, benefits: ['Diskon 10% semua order', 'Prioritas pengerjaan', 'Gratis 1x cuci express per bulan', 'Diskon ulang tahun 15%'] },
  { id: 'mt4', name: 'Platinum', minPoints: 5000, maxPoints: null, discount: 15, color: '#2563EB', members: 34, benefits: ['Diskon 15% semua order', 'Prioritas pengerjaan', 'Gratis 1x cuci express per minggu', 'Layanan pelanggan khusus', 'Diskon ulang tahun 20%'] },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = [
  { id: 'n1', type: 'overdue', message: 'Order ORD-2026-0003 melewati batas waktu pengambilan', time: '5 menit lalu', read: false },
  { id: 'n2', type: 'low_stock', message: 'Cairan Pelarut Dry Cleaning berada di bawah batas stok minimum', time: '1 jam lalu', read: false },
  { id: 'n3', type: 'new_order', message: 'Order baru ORD-2026-0015 dibuat di Cabang Kuta', time: '2 jam lalu', read: false },
  { id: 'n4', type: 'completed', message: 'Order ORD-2026-0011 sudah selesai', time: '3 jam lalu', read: true },
  { id: 'n5', type: 'low_stock', message: 'Semprotan Anti Statis berada di bawah batas stok minimum', time: '4 jam lalu', read: true },
];
