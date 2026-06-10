'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

const allLinks = [
  { href: '/', label: 'สั่งอาหาร', icon: '🏠', roles: ['customer', 'merchant', 'rider', 'admin'] },
  { href: '/merchant', label: 'ร้านค้า', icon: '🍳', roles: ['merchant'] },
  { href: '/rider', label: 'ไรเดอร์', icon: '🛵', roles: ['rider'] },
  { href: '/dashboard', label: 'ภาพรวม', icon: '📊', roles: ['admin', 'merchant'] },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const links = allLinks.filter((link) => {
    if (!user) return link.href === '/'
    return link.roles.includes(user.type)
  })

  if (links.length <= 1) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-lg mx-auto flex">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${
                isActive ? 'text-[#E65100] font-semibold' : 'text-gray-500'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
