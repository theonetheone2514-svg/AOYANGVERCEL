'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'
import { getCsrfHeaders } from '@/lib/csrf-client'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Props {
  storeId: string
}

const defaultCategories = ['ก๋วยเตี๋ยว', 'ของทอด', 'ข้าว', 'ส้มตำ', 'ย่าง', 'ลาบ', 'น้ำตก', 'ต้ม', 'ซุป', 'เครื่องดื่ม']
const categoryEmoji: Record<string, string> = {
  'ก๋วยเตี๋ยว': '🍜', 'ของทอด': '🍤', 'ข้าว': '🍚', 'ส้มตำ': '🥗',
  'ย่าง': '🍖', 'ลาบ': '🥩', 'น้ำตก': '🥘', 'ต้ม': '🍲', 'ซุป': '🥣', 'เครื่องดื่ม': '🥤',
}

export default function MenuTab({ storeId }: Props) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', category: '', stock: 99, image_url: '' })

  const load = useCallback(async () => {
    if (!storeId) return
    const res = await fetch(`/api/menu?store_id=${storeId}`)
    if (!res.ok) return
    const data: any[] = await res.json()
    if (data) {
      setItems(data)
      const cats = [...new Set(data.map((i: any) => i.category).filter(Boolean))] as string[]
      setCategories(cats)
    }
    setLoading(false)
  }, [storeId])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setForm({ name: '', price: '', category: '', stock: 99, image_url: '' })
    setShowForm(false)
    setEditId(null)
  }

  async function addItem() {
    if (!form.name || !form.price) return
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
      body: JSON.stringify({
        store_id: storeId,
        name: form.name,
        price: Number(form.price),
        category: form.category || null,
        stock: Number(form.stock),
        image_url: form.image_url || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setItems((prev) => [...prev, data])
    }
    resetForm()
  }

  async function saveEdit() {
    if (!editId || !form.name || !form.price) return
    const res = await fetch(`/api/menu/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
      body: JSON.stringify({
        name: form.name,
        price: Number(form.price),
        category: form.category || null,
        stock: Number(form.stock),
        image_url: form.image_url || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setItems((prev) => prev.map((i) => (i.id === editId ? data : i)))
    }
    resetForm()
  }

  function startEdit(item: any) {
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category || '',
      stock: item.stock ?? 99,
      image_url: item.image_url || '',
    })
    setEditId(item.id)
    setShowForm(true)
  }

  async function deleteItem() {
    if (!deleteTarget) return
    await fetch(`/api/menu/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: { ...getCsrfHeaders() },
    })
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  async function updateStock(item: any, delta: number) {
    const newStock = Math.max(0, (item.stock ?? 0) + delta)
    await fetch(`/api/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
      body: JSON.stringify({ stock: newStock }),
    })
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stock: newStock } : i)))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-4">
      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#3E2723]">เมนูทั้งหมด ({items.length})</h2>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="bg-[#E65100] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d44900] transition"
          >
            + เพิ่มเมนู
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
          <h3 className="font-semibold text-sm text-[#3E2723]">
            {editId ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
          </h3>
          <input
            placeholder="ชื่อเมนู *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E65100]"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="ราคา *"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E65100]"
            />
            <input
              placeholder="stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E65100]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E65100] bg-white appearance-none"
            >
              <option value="">ไม่มีหมวดหมู่</option>
              {[...new Set([...defaultCategories, ...categories])].map((c) => (
                <option key={c} value={c}>{categoryEmoji[c] || '🍽️'} {c}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const cat = prompt('ชื่อหมวดหมู่ใหม่:')
                if (cat?.trim()) {
                  setForm({ ...form, category: cat.trim() })
                  setCategories((prev) => [...new Set([...prev, cat.trim()])])
                }
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition shrink-0"
              title="เพิ่มหมวดหมู่ใหม่"
            >
              +
            </button>
          </div>
          {/* Image upload */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">รูปอาหาร (ไม่บังคับ)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const fd = new FormData()
                  fd.append('file', file)
                  setUploading(true)
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: fd })
                    const data = await res.json()
                    if (data.url) setForm({ ...form, image_url: data.url })
                  } catch {
                    alert('อัปโหลดรูปไม่สำเร็จ')
                  }
                  setUploading(false)
                }}
                className="flex-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#E65100] hover:file:bg-orange-100 cursor-pointer"
              />
              {form.image_url && (
                <button
                  onClick={() => setForm({ ...form, image_url: '' })}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0"
                >
                  ลบรูป
                </button>
              )}
            </div>
            {form.image_url && (
              <div className="h-24 rounded-lg overflow-hidden bg-gray-100 mt-2">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block' }}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={editId ? saveEdit : addItem}
              disabled={!form.name || !form.price || uploading}
              className="flex-1 bg-[#E65100] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-[#d44900] transition"
            >
              {uploading ? 'กำลังอัปโหลด...' : editId ? 'บันทึก' : 'เพิ่มเมนู'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Menu list */}
      {items.length === 0 ? (
        <EmptyState icon="🍳" title="ยังไม่มีเมนู" description="เพิ่มเมนูแรกของคุณ" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 transition hover:border-gray-200">
              <div className="flex items-center gap-3">
                {/* Thumbnail */}
                <div className="h-14 w-14 rounded-xl shrink-0 overflow-hidden bg-gradient-to-br from-[#FFF8E7] to-orange-100 flex items-center justify-center text-2xl">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = categoryEmoji[item.category] || '🍽️' }}
                    />
                  ) : (
                    <span>{categoryEmoji[item.category] || '🍽️'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-[#3E2723] text-sm truncate">{item.name}</span>
                    {item.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[#E65100] mt-0.5">
                    {formatPrice(item.price)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Stock controls */}
                  <div className="flex items-center gap-1 mr-1">
                    <button
                      onClick={() => updateStock(item, -1)}
                      disabled={(item.stock ?? 0) <= 0}
                      className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 transition"
                    >−</button>
                    <span className="text-xs font-medium text-gray-600 w-5 text-center">{item.stock ?? 0}</span>
                    <button
                      onClick={() => updateStock(item, 1)}
                      className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-200 transition"
                    >+</button>
                  </div>
                  <button onClick={() => startEdit(item)}
                    className="text-xs text-blue-600 font-medium px-2 py-1 hover:bg-blue-50 rounded transition">แก้ไข</button>
                  <button onClick={() => setDeleteTarget(item)}
                    className="text-xs text-red-600 font-medium px-2 py-1 hover:bg-red-50 rounded transition">ลบ</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="ลบเมนู?"
        danger
        message={`แน่ใจว่าจะลบ "${deleteTarget?.name}"? การกระทำนี้ไม่สามารถกู้คืนได้`}
        confirmLabel="ลบเลย"
        onConfirm={deleteItem}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
