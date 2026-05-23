export const DEFAULT_LOCATION = {
  lat: 17.293067,
  lng: 103.969910,
  name: 'เอาหยังบ่',
  address: 'บ้านสูงเนิน',
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} บาท`
}

export function calculateCommission(foodTotal: number, rate: number = 0.15): number {
  return Math.round(foodTotal * rate * 100) / 100
}

export function netAfterCommission(foodTotal: number, deliveryFee: number, rate: number = 0.15): number {
  return foodTotal - calculateCommission(foodTotal, rate) + deliveryFee
}

export function generateOrderRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let ref = ''
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return ref
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'รอดำเนินการ': 'bg-yellow-100 text-yellow-800',
    'กำลังเตรียมอาหาร': 'bg-blue-100 text-blue-800',
    'พร้อมจัดส่ง': 'bg-green-100 text-green-800',
    'กำลังจัดส่ง': 'bg-purple-100 text-purple-800',
    'จัดส่งสำเร็จ': 'bg-gray-100 text-gray-800',
    'ยกเลิก': 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getElapsedMinutes(dateString: string): number {
  const created = new Date(dateString)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / 60000)
}

export function isInZone(
  lat: number,
  lng: number,
  zoneLat: number,
  zoneLng: number,
  radiusKm: number
): boolean {
  const R = 6371
  const dLat = ((lat - zoneLat) * Math.PI) / 180
  const dLng = ((lng - zoneLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((zoneLat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c <= radiusKm
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
