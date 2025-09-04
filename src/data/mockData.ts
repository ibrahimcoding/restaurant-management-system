// Mock data for the restaurant management system

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  prepTime: number; // in minutes
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'pending' | 'cooking' | 'ready' | 'delivered';
  customerName?: string;
  orderTime: Date;
  totalAmount: number;
  estimatedTime?: number;
}

export interface OrderItem {
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  isOccupied: boolean;
  currentOrderId?: string;
}

// Menu Categories
export const menuCategories = [
  'Appetizers',
  'Main Courses', 
  'Desserts',
  'Beverages',
  'Specials'
];

// Mock Menu Items
export const mockMenuItems: MenuItem[] = [
  // Appetizers
  {
    id: '1',
    name: 'Truffle Arancini',
    description: 'Crispy risotto balls filled with truffle and parmesan, served with garlic aioli',
    price: 14.99,
    image: '/images/truffle-arancini.jpg',
    category: 'Appetizers',
    isAvailable: true,
    prepTime: 12
  },
  {
    id: '2',
    name: 'Tuna Tartare',
    description: 'Fresh yellowfin tuna with avocado, cucumber, and sesame ginger dressing',
    price: 18.99,
    image: '/images/tuna-tartare.jpg',
    category: 'Appetizers',
    isAvailable: true,
    prepTime: 8
  },
  
  // Main Courses
  {
    id: '3',
    name: 'Grilled Atlantic Salmon',
    description: 'Pan-seared salmon with lemon herb butter, roasted vegetables, and quinoa',
    price: 28.99,
    image: '/images/grilled-salmon.jpg',
    category: 'Main Courses',
    isAvailable: true,
    prepTime: 18
  },
  {
    id: '4',
    name: 'Ribeye Steak',
    description: 'Premium 12oz ribeye with garlic mashed potatoes and seasonal vegetables',
    price: 42.99,
    image: '/images/ribeye-steak.jpg',
    category: 'Main Courses',
    isAvailable: true,
    prepTime: 22
  },
  {
    id: '5',
    name: 'Mushroom Risotto',
    description: 'Creamy arborio rice with wild mushrooms, truffle oil, and aged parmesan',
    price: 24.99,
    image: '/api/placeholder/300/200',
    category: 'Main Courses',
    isAvailable: false,
    prepTime: 25
  },
  
  // Desserts
  {
    id: '6',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, vanilla ice cream, and berry coulis',
    price: 12.99,
    image: '/api/placeholder/300/200',
    category: 'Desserts',
    isAvailable: true,
    prepTime: 15
  },
  {
    id: '7',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with mascarpone, espresso, and cocoa powder',
    price: 10.99,
    image: '/api/placeholder/300/200',
    category: 'Desserts',
    isAvailable: true,
    prepTime: 5
  },
  
  // Beverages
  {
    id: '8',
    name: 'Craft Beer Selection',
    description: 'Local IPA, Lager, or Seasonal ale',
    price: 7.99,
    image: '/api/placeholder/300/200',
    category: 'Beverages',
    isAvailable: true,
    prepTime: 2
  },
  {
    id: '9',
    name: 'House Wine',
    description: 'Red or white wine selection by the glass',
    price: 9.99,
    image: '/api/placeholder/300/200',
    category: 'Beverages',
    isAvailable: true,
    prepTime: 2
  }
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    tableNumber: 5,
    status: 'cooking',
    customerName: 'Sarah Johnson',
    orderTime: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    totalAmount: 67.97,
    estimatedTime: 12,
    items: [
      {
        menuItemId: '3',
        menuItem: mockMenuItems[2],
        quantity: 1
      },
      {
        menuItemId: '4',
        menuItem: mockMenuItems[3],
        quantity: 1,
        specialInstructions: 'Medium rare, no vegetables'
      }
    ]
  },
  {
    id: 'ORD002',
    tableNumber: 3,
    status: 'pending',
    customerName: 'Mike Chen',
    orderTime: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    totalAmount: 43.97,
    estimatedTime: 20,
    items: [
      {
        menuItemId: '1',
        menuItem: mockMenuItems[0],
        quantity: 2
      },
      {
        menuItemId: '8',
        menuItem: mockMenuItems[7],
        quantity: 2
      }
    ]
  },
  {
    id: 'ORD003',
    tableNumber: 8,
    status: 'ready',
    customerName: 'Emma Davis',
    orderTime: new Date(Date.now() - 25 * 60000), // 25 minutes ago
    totalAmount: 35.98,
    items: [
      {
        menuItemId: '5',
        menuItem: mockMenuItems[4],
        quantity: 1
      },
      {
        menuItemId: '6',
        menuItem: mockMenuItems[5],
        quantity: 1
      }
    ]
  },
  {
    id: 'ORD004',
    tableNumber: 12,
    status: 'delivered',
    customerName: 'Alex Rodriguez',
    orderTime: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    totalAmount: 29.98,
    items: [
      {
        menuItemId: '2',
        menuItem: mockMenuItems[1],
        quantity: 1
      },
      {
        menuItemId: '7',
        menuItem: mockMenuItems[6],
        quantity: 1
      }
    ]
  }
];

// Mock Tables
export const mockTables: Table[] = [
  { id: 1, number: 1, capacity: 2, isOccupied: false },
  { id: 2, number: 2, capacity: 4, isOccupied: false },
  { id: 3, number: 3, capacity: 4, isOccupied: true, currentOrderId: 'ORD002' },
  { id: 4, number: 4, capacity: 6, isOccupied: false },
  { id: 5, number: 5, capacity: 4, isOccupied: true, currentOrderId: 'ORD001' },
  { id: 6, number: 6, capacity: 2, isOccupied: false },
  { id: 7, number: 7, capacity: 8, isOccupied: false },
  { id: 8, number: 8, capacity: 4, isOccupied: true, currentOrderId: 'ORD003' },
  { id: 9, number: 9, capacity: 2, isOccupied: false },
  { id: 10, number: 10, capacity: 4, isOccupied: false },
  { id: 11, number: 11, capacity: 6, isOccupied: false },
  { id: 12, number: 12, capacity: 4, isOccupied: false }
];

// Mock Analytics Data
export const mockAnalytics = {
  dailyRevenue: 2847.52,
  weeklyRevenue: 18924.30,
  monthlyRevenue: 78421.15,
  totalOrders: 147,
  averageOrderValue: 32.45,
  customerSatisfaction: 4.8,
  topSellingItems: [
    { item: mockMenuItems[3], orderCount: 23 },
    { item: mockMenuItems[2], orderCount: 19 },
    { item: mockMenuItems[0], orderCount: 16 }
  ],
  hourlyOrders: [
    { hour: '11:00', orders: 5 },
    { hour: '12:00', orders: 12 },
    { hour: '13:00', orders: 18 },
    { hour: '14:00', orders: 8 },
    { hour: '17:00', orders: 15 },
    { hour: '18:00', orders: 22 },
    { hour: '19:00', orders: 25 },
    { hour: '20:00', orders: 20 },
    { hour: '21:00', orders: 14 }
  ]
};