'use client'

import { use } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname, Link } from '@/i18n/navigation'
import { QrCode, Smartphone, Clock, Gamepad2, BarChart3, LogIn, UserPlus } from 'lucide-react'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { useAuth } from '@/contexts/AuthContext'

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const t = useTranslations('home')
  const tFeatures = useTranslations('features')
  const tSteps = useTranslations('steps')
  const tFooter = useTranslations('footer')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleAuthClick = () => {
    if (user) {
      router.push('/admin/dashboard')
    } else {
      router.push('/auth/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2 text-white">
          <QrCode className="h-8 w-8" />
          <span className="text-2xl font-bold">QFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAuthClick}
            className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition"
          >
            {user ? tAuth('login_title') : (
              <>
                <LogIn className="h-4 w-4 inline mr-2" />
                {tAuth('login_button')}
              </>
            )}
          </button>
          {user && (
            <button
              onClick={async () => { await signOut(); router.push('/') }}
              className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition"
            >
              {tAuth('logout', { default: 'Logout' })}
            </button>
          )}
          <Link
            href="/admin"
            className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition"
          >
            {t('admin')}
          </Link>
          <Link
            href="/tv-display"
            className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition"
          >
            {t('tv_display')}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-20">
            <Link
              href="/enter"
              className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 hover:bg-gray-100 transition shadow-lg"
            >
              {t('cta_enter')}
            </Link>
            <Link
              href="/establishment"
              className="rounded-xl bg-white/20 px-8 py-4 text-lg font-semibold text-white hover:bg-white/30 transition backdrop-blur"
            >
              {t('cta_create')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<QrCode className="h-12 w-12" />}
            title={tFeatures('qr_title')}
            description={tFeatures('qr_desc')}
          />
          <FeatureCard
            icon={<Clock className="h-12 w-12" />}
            title={tFeatures('realtime_title')}
            description={tFeatures('realtime_desc')}
          />
          <FeatureCard
            icon={<Gamepad2 className="h-12 w-12" />}
            title={tFeatures('games_title')}
            description={tFeatures('games_desc')}
          />
          <FeatureCard
            icon={<Smartphone className="h-12 w-12" />}
            title={tFeatures('mobile_title')}
            description={tFeatures('mobile_desc')}
          />
          <FeatureCard
            icon={<BarChart3 className="h-12 w-12" />}
            title={tFeatures('tv_title')}
            description={tFeatures('tv_desc')}
          />
          <FeatureCard
            icon={<QrCode className="h-12 w-12" />}
            title={tFeatures('multi_title')}
            description={tFeatures('multi_desc')}
          />
        </div>

        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-white mb-4">
            {tSteps('title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard number={1} title={tSteps('scan')} description={tSteps('scan_desc')} />
            <StepCard number={2} title={tSteps('wait')} description={tSteps('wait_desc')} />
            <StepCard number={3} title={tSteps('called')} description={tSteps('called_desc')} />
          </div>
        </div>

        <footer className="text-center mt-20 pb-8">
          <p className="text-white/60">
            {tFooter('made_with')}
          </p>
        </footer>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur p-6 text-white">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-white/80">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur p-6 text-white">
      <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-white/80">{description}</p>
    </div>
  )
}
