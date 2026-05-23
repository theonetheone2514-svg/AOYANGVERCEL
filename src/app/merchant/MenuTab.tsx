'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice, cn } from '@/lib/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

interface Props {
  storeId: string
}

export default function MenuTab({ storeId }: Props) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '', stock: 99 })

  useEffect(() => {
    if (!storeId) return
    supabase.from('menu_items').select('*').eq('store_id', storeId).order('name').then(({ data }) => {
      if (data) setItems(data)
      setLoading(false)
    })
  }, [storeId])

  async function addItem() {
    if (!newItem.name || !newItem.price) return
    const { data } = await supabase.from('menu_items').insert({
      store_id: storeId,
      name: newItem.name,
      price: Number(newItem.price),
      category: newItem.category || null,
      stock: Number(newItem.stock),
    }).select().single()
    if (data) setItems((prev) => [...prev, data])
    setNewItem({ name: '', price: '', category: '', stock: 99 })
  }

  async function updateItem(id: string, updates: any) {
    const { data } = await supabase.from('menu_items').update(updates).eq('id', id).select().single()
    if (data) setItems((prev) => prev.map((i) => (i.id === id ? data : i)))
    setEditing(null)
  }

  async function deleteItem(id: string) {
    await supabase.from('menu_items').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-4">
      {/* Add new item form */}
      <div className="bg-white rounded-lg border p-3 space-y-2">
        <h3 className="font-semibold text-sm text-[#3E2723]">เพิ่มเมนูใหม่</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="ชื่อเมนู"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="border rounded px-3 py-2 text-sm col-span-2"
          />
          <input
            placeholder="ราคา"
            type="number"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="หมวดหมู่"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={addItem}
          disabled={!newItem.name || !newItem.price}
          className="w-full bg-[#E65100] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          เพิ่มเมนู
        </button>
      </div>

      {/* Menu list */}
      {items.length === 0 ? (
        <EmptyState icon="🍳" title="ยังไม่มีเมนู" description="เพิ่มเมนูแรกของคุณ" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border p-3">
              {editing?.id === item.id ? (
                <div className="space-y-2">
                  <input
                    defaultValue={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="border rounded px-3 py-1.5 text-sm w-full"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      defaultValue={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                      className="border rounded px-3 py-1.5 text-sm flex-1"
                    />
                    <button onClick={() => updateItem(item.id, { name: editing.name, price: Number(editing.price) })}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
                    >บันทึก</button>
                    <button onClick={() => setEditing(null)}
                      className="bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm"
                    >ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-[#3E2723]">{item.name}</div>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{formatPrice(item.price)}</span>
                      {item.category && <span>• {item.category}</span>}
                      <span>• stock: {item.stock}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing({ ...item })}
                      className="text-xs text-blue-600 underline">แก้ไข</button>
                    <button onClick={() => deleteItem(item.id)}
                      className="text-xs text-red-600 underline">ลบ</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
