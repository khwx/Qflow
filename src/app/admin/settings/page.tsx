'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { AlertCircle, Loader2, Save } from 'lucide-react'
import Link from 'next/link'

function SettingsContent() {
  const searchParams = useSearchParams()
  const estSlug = searchParams.get('est')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    primary_color: '#4f46e5',
    secondary_color: '#000000',
    phone: '',
    address: '',
    is_active: true,
    qr_code_enabled: true,
    notification_sound: true,
    auto_call: true,
    points_enabled: true,
  })

  useEffect(() => {
    if (!estSlug) {
      setLoading(false)
      return
    }

    async function loadEstablishment() {
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase
          .from('establishments')
          .select('*')
          .eq('slug', estSlug)
          .single()

        if (error) {
          toast.error('Erro ao carregar dados do estabelecimento')
          setLoading(false)
          return
        }

        if (data) {
          let qrCodeEnabled = true
          let notificationSound = true
          let autoCall = true
          let pointsEnabled = true

          if (data.notes) {
            try {
              const parsed = typeof data.notes === 'string' ? JSON.parse(data.notes) : data.notes
              if (typeof parsed.qr_code_enabled === 'boolean') qrCodeEnabled = parsed.qr_code_enabled
              if (typeof parsed.notification_sound === 'boolean') notificationSound = parsed.notification_sound
              if (typeof parsed.auto_call === 'boolean') autoCall = parsed.auto_call
              if (typeof parsed.points_enabled === 'boolean') pointsEnabled = parsed.points_enabled
            } catch {
              // notes field is not valid JSON, use defaults
            }
          }

          setSettings({
            name: data.name || '',
            description: data.description || '',
            primary_color: data.primary_color || '#4f46e5',
            secondary_color: data.secondary_color || '#000000',
            phone: data.phone || '',
            address: data.address || '',
            is_active: data.is_active ?? true,
            qr_code_enabled: qrCodeEnabled,
            notification_sound: notificationSound,
            auto_call: autoCall,
            points_enabled: pointsEnabled,
          })
        }
      } catch (error) {
        console.error('Load establishment error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEstablishment()
  }, [estSlug])

  async function handleSave() {
    if (!estSlug) return

    setSaving(true)
    const supabase = createClientComponentClient()

    const updates: Record<string, unknown> = {
      name: settings.name,
      description: settings.description,
      primary_color: settings.primary_color,
      secondary_color: settings.secondary_color,
      phone: settings.phone,
      address: settings.address,
      is_active: settings.is_active,
    }

    const { data: existing } = await supabase
      .from('establishments')
      .select('notes')
      .eq('slug', estSlug)
      .single()

    let notes: Record<string, unknown> = {}
    if (existing?.notes) {
      try {
        notes = typeof existing.notes === 'string' ? JSON.parse(existing.notes) : existing.notes
      } catch {
        notes = {}
      }
    }

    notes.qr_code_enabled = settings.qr_code_enabled
    notes.notification_sound = settings.notification_sound
    notes.auto_call = settings.auto_call
    notes.points_enabled = settings.points_enabled
    updates.notes = JSON.stringify(notes)

    const { error } = await supabase
      .from('establishments')
      .update(updates)
      .eq('slug', estSlug)

    if (error) {
      toast.error('Erro ao salvar configurações')
    } else {
      toast.success('Configurações salvas com sucesso')
    }

    setSaving(false)
  }

  function updateField(field: string, value: string | boolean) {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  if (!estSlug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum estabelecimento selecionado</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Acesse as configurações com o parâmetro{' '}
            <code className="bg-gray-100 px-1 rounded">?est=slug</code> para editar os dados.
          </p>
          <Link
            href="/admin/establishments"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Selecionar Estabelecimento
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h2>
          <p className="text-gray-600 dark:text-gray-400">Personalize seu sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informações Básicas</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Estabelecimento
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor Primária
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor Secundária
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => updateField('secondary_color', e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => updateField('secondary_color', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Estabelecimento Ativo</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Habilitar ou desabilitar o estabelecimento</p>
              </div>
              <button
                onClick={() => updateField('is_active', String(!settings.is_active))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.is_active ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Funcionalidades</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Som de Notificação</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reproduzir som quando chamar senha</p>
              </div>
              <button
                onClick={() => updateField('notification_sound', String(!settings.notification_sound))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notification_sound ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notification_sound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Chamada Automática</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Chamar automaticamente quando a senha chegar</p>
              </div>
              <button
                onClick={() => updateField('auto_call', String(!settings.auto_call))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.auto_call ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.auto_call ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">QR Code</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Habilitar entrada via QR Code</p>
              </div>
              <button
                onClick={() => updateField('qr_code_enabled', String(!settings.qr_code_enabled))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.qr_code_enabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.qr_code_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Gamificação</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Habilitar jogos e pontos</p>
              </div>
              <button
                onClick={() => updateField('points_enabled', String(!settings.points_enabled))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.points_enabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.points_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Integrações</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Business API
              </label>
              <input
                type="text"
                placeholder="Número do WhatsApp"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMS (Twilio)
              </label>
              <input
                type="text"
                placeholder="Account SID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}