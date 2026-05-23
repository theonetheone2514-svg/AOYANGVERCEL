'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'สั่งอาหาร', icon: '🏠' },
  { href: '/merchant', label: 'ร้านค้า', icon: '🍳' },
  { href: '/rider', label: 'ไรเดอร์', icon: '🛵' },
  { href: '/dashboard', label: 'ภาพรวม', icon: '📊' },
]

export default function BottomNav() {
  const pathname = usePathname()

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
