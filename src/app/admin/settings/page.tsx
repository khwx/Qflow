'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    establishmentName: 'Meu Estabelecimento',
    notificationSound: true,
    autoCall: true,
    qrCodeEnabled: true,
    pointsEnabled: true,
    primaryColor: '#4f46e5',
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
        <p className="text-gray-600">Personalize seu sistema</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Informações Básicas</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Estabelecimento
              </label>
              <input
                type="text"
                value={settings.establishmentName}
                onChange={(e) => setSettings({ ...settings, establishmentName: e.target.value })}
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
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Funcionalidades</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Som de Notificação</p>
                <p className="text-sm text-gray-600">Reproduzir som quando chamar senha</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, notificationSound: !settings.notificationSound })}
                className={settings.notificationSound ? 'text-indigo-600' : 'text-gray-400'}
              >
                {settings.notificationSound ? 'Ativado' : 'Desativado'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Chamada Automática</p>
                <p className="text-sm text-gray-600">Chamar automaticamente quando a senha chegar</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoCall: !settings.autoCall })}
                className={settings.autoCall ? 'text-indigo-600' : 'text-gray-400'}
              >
                {settings.autoCall ? 'Ativado' : 'Desativado'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">QR Code</p>
                <p className="text-sm text-gray-600">Habilitar entrada via QR Code</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, qrCodeEnabled: !settings.qrCodeEnabled })}
                className={settings.qrCodeEnabled ? 'text-indigo-600' : 'text-gray-400'}
              >
                {settings.qrCodeEnabled ? 'Ativado' : 'Desativado'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Gamificação</p>
                <p className="text-sm text-gray-600">Habilitar jogos e pontos</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, pointsEnabled: !settings.pointsEnabled })}
                className={settings.pointsEnabled ? 'text-indigo-600' : 'text-gray-400'}
              >
                {settings.pointsEnabled ? 'Ativado' : 'Desativado'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Integrações</h3>
          
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
