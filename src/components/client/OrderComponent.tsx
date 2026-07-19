'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { OrderItem } from '@/types'
import { Plus, Minus, ShoppingCart } from 'lucide-react'

interface OrderComponentProps {
  ticketId: string
  establishmentId: string
}

export default function OrderComponent({ ticketId, establishmentId }: OrderComponentProps) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const menuItems = [
    { id: '1', name: 'Água Mineral', price: 3.00 },
    { id: '2', name: 'Refrigerante', price: 5.00 },
    { id: '3', name: 'Suco Natural', price: 7.00 },
    { id: '4', name: 'Café', price: 4.00 },
    { id: '5', name: 'Pão de Queijo', price: 3.50 },
    { id: '6', name: 'Bolo', price: 6.00 },
  ]

  const addItem = (item: typeof menuItems[0]) => {
    const existing = items.find(i => i.name === item.name)
    if (existing) {
      setItems(items.map(i => 
        i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setItems([...items, { id: item.id, name: item.name, quantity: 1, price: item.price }])
    }
  }

  const removeItem = (name: string) => {
    const existing = items.find(i => i.name === name)
    if (existing && existing.quantity > 1) {
      setItems(items.map(i => 
        i.name === name ? { ...i, quantity: i.quantity - 1 } : i
      ))
    } else {
      setItems(items.filter(i => i.name !== name))
    }
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const submitOrder = async () => {
    if (items.length === 0) return

    setLoading(true)

    await supabase.from('orders').insert({
      ticket_id: ticketId,
      establishment_id: establishmentId,
      items: items,
      total,
      notes: notes || null,
    })

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Pedido Enviado!</h3>
        <p className="text-gray-600 mb-4">Seu pedido está sendo preparado</p>
        <p className="text-2xl font-bold text-indigo-600">
          Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Cardápio</h3>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="w-full p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 text-left flex justify-between items-center transition"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                  </p>
                </div>
                <Plus className="h-5 w-5 text-indigo-600" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Seu Pedido</h3>
          
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Adicione itens do cardápio
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeItem(item.name)}
                      className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => addItem({ id: item.id, name: item.name, price: item.price })}
                      className="p-1 rounded-full bg-indigo-100 hover:bg-indigo-200"
                    >
                      <Plus className="h-4 w-4 text-indigo-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma observação?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-indigo-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
              </div>

              <button
                onClick={submitOrder}
                disabled={items.length === 0 || loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
