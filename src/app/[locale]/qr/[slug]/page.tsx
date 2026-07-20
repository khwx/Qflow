'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Download, Printer } from 'lucide-react'

export default function QRCodePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = use(params)
  const t = useTranslations('qr')
  const tEstablishment = useTranslations('establishment')
  const router = useRouter()
  const qrRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [establishmentName, setEstablishmentName] = useState('')

  useEffect(() => {
    setQrUrl(`${window.location.origin}/${locale}/enter`)

    const name = localStorage.getItem('establishment_name')
    if (name) {
      setEstablishmentName(name)
    } else {
      setEstablishmentName(slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    }
  }, [locale, slug])

  const handleDownload = () => {
    const svgEl = qrRef.current?.querySelector('svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const size = 600
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)

      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `qr-${slug}.png`
      link.href = pngUrl
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6 print:bg-white">
      <div className="w-full max-w-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition print:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
          {t('back')}
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8 print:shadow-none print:rounded-none">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('title')}</h1>
            <p className="text-gray-500">{t('subtitle')}</p>
          </div>

          <div className="text-center mb-4">
            <span className="text-sm font-medium text-gray-500">{t('establishment')}</span>
            <p className="text-lg font-semibold text-indigo-600">{establishmentName}</p>
          </div>

          <div className="flex justify-center mb-6">
            <div
              ref={qrRef}
              className="bg-white p-4 rounded-xl border border-gray-200 inline-block"
            >
              <QRCodeSVG
                value={qrUrl}
                size={300}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#1e1b4b"
              />
            </div>
          </div>

          {qrUrl && (
            <p className="text-center text-sm text-gray-400 mb-6 font-mono break-all">
              {qrUrl}
            </p>
          )}

          <p className="text-center text-sm text-gray-500 mb-6 print:hidden">
            {t('scan_hint')}
          </p>

          <div className="flex gap-3 print:hidden">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              <Download className="h-5 w-5" />
              {t('download')}
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              <Printer className="h-5 w-5" />
              {t('print')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
