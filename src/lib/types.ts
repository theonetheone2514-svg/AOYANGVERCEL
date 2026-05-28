export interface Store {
  id: string
  name: string
  phone: string
  status: 'open' | 'closed'
  wait_time: number
  image_url?: string
  created_at: string
}

export interface MenuItem {
  id: string
  store_id: string
  name: string
  price: number
  image_url?: string
  category?: string
  stock: number
  created_at: string
}

export interface Order {
  id: string
  customer_id: string
  store_id: string
  rider_id?: string
  status: OrderStatus
  total: number
  delivery_fee: number
  lat?: number
  lng?: number
  address?: string
  payment_method: 'cash' | 'transfer'
  zone_id?: string
  note?: string
  created_at: string
}

export type OrderStatus =
  | 'รอดำเนินการ'
  | 'กำลังเตรียมอาหาร'
  | 'พร้อมจัดส่ง'
  | 'กำลังจัดส่ง'
  | 'จัดส่งสำเร็จ'
  | 'ยกเลิก'

export interface OrderItem {
  id: string
  order_id: string
  menu_id: string
  name: string
  qty: number
  price: number
}

export interface Customer {
  id: string
  user_id?: string
  phone: string
  name?: string
  points: number
  created_at: string
}

export interface Rider {
  id: string
  user_id?: string
  phone: string
  name?: string
  earnings: number
  jobs_count: number
  zone_id?: string
  online: boolean
  created_at: string
}

export interface Zone {
  id: string
  name: string
  lat: number
  lng: number
  radius: number
  status: 'open' | 'closed'
}

export interface Setting {
  key: string
  value: string
}

export interface CustomerLocation {
  id: string
  customer_id: string
  lat?: number
  lng?: number
  address?: string
  created_at: string
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  store?: Store
  rider?: Rider
  customer?: Customer
}

export interface StoreWithMenu extends Store {
  menu_items: MenuItem[]
}

export interface MerchantStatement {
  store_id: string
  store_name: string
  total_orders: number
  total_food_sales: number
  total_delivery_fees: number
  total_commission: number
  net_income: number
  orders: OrderWithItems[]
}

export interface DashboardSummary {
  total_orders_today: number
  total_revenue_today: number
  total_customers: number
  total_riders: number
  total_stores: number
  pending_orders: number
  orders_by_status: { status: string; count: number }[]
  revenue_by_day: { date: string; revenue: number }[]
}

export interface Rating {
  id: string
  order_id: string
  customer_id: string
  store_id: string
  rating: number
  review?: string
  created_at: string
}
