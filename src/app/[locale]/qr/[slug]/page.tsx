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
  const { slug } = use(params)
  const t = useTranslations('qr')
  const tEstablishment = useTranslations('establishment')
  const router = useRouter()
  const qrRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [establishmentName, setEstablishmentName] = useState('')

  useEffect(() => {
    setQrUrl(`${window.location.origin}/enter?code=${slug}`)
    const name = localStorage.getItem('establishment_name')
    if (name) {
      setEstablishmentName(name)
    } else {
      setEstablishmentName(slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    }
  }, [slug])

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
      <div className="w-full max-w-lg animate-fade-in">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition print:hidden hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5" />
          {t('back')}
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 print:shadow-none print:rounded-none animate-slide-up border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('title')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
          </div>

          <div className="text-center mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('establishment')}</span>
            <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{establishmentName}</p>
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

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6 print:hidden">
            {t('scan_hint')}
          </p>

          <div className="flex gap-3 print:hidden">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              {t('download')}
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
