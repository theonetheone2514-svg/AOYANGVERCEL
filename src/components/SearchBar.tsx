'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'ค้นหาเมนูเด็ด...'}
        className="w-full bg-white/95 border-0 rounded-2xl pl-11 pr-4 py-3 text-sm text-[#3E2723] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg backdrop-blur-sm transition"
      />
    </div>
  )
}
