import Link from 'next/link'
import { QrCode, Smartphone, Clock, Gamepad2, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2 text-white">
          <QrCode className="h-8 w-8" />
          <span className="text-2xl font-bold">TiraSenha</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin"
            className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition"
          >
            Admin
          </Link>
          <Link
            href="/tv-display"
            className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition"
          >
            TV Display
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Elimine Filas. Engaje Clientes.
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Sistema de fila virtual com QR Code, gamificação e painéis inteligentes.
            Transforme o tempo de espera em uma experiência positiva.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-20">
            <Link
              href="/enter"
              className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 hover:bg-gray-100 transition shadow-lg"
            >
              Entrar na Fila
            </Link>
            <Link
              href="/establishment"
              className="rounded-xl bg-white/20 px-8 py-4 text-lg font-semibold text-white hover:bg-white/30 transition backdrop-blur"
            >
              Criar Estabelecimento
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<QrCode className="h-12 w-12" />}
            title="QR Code Instantâneo"
            description="Clientes escaneiam e entram na fila sem precisar baixar apps ou fazer cadastros complicados."
          />
          <FeatureCard
            icon={<Clock className="h-12 w-12" />}
            title="Tempo Real"
            description="Acompanhe sua posição na fila em tempo real e receba notificações quando for chamado."
          />
          <FeatureCard
            icon={<Gamepad2 className="h-12 w-12" />}
            title="Gamificação"
            description="Enquanto espera, jogue, responda enquetes e ganhe recompensas. Transforme espera em diversão."
          />
          <FeatureCard
            icon={<Smartphone className="h-12 w-12" />}
            title="Mobile-First"
            description="Interface otimizada para celular. Funciona em qualquer smartphone sem instalação."
          />
          <FeatureCard
            icon={<BarChart3 className="h-12 w-12" />}
            title="Painel TV"
            description="Exiba a fila em tempo real em telas da loja. Clientes veem sua posição sem perguntar."
          />
          <FeatureCard
            icon={<QrCode className="h-12 w-12" />}
            title="Multi-Estabelecimento"
            description="Gerencie múltiplas filas por categoria. Ideal para shoppings, clínicas e eventos."
          />
        </div>

        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Como Funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard number={1} title="Escaneie" description="Escaneie o QR Code na entrada ou na mesa" />
            <StepCard number={2} title="Aguarde" description="Receba sua senha e acompanhe a fila pelo celular" />
            <StepCard number={3} title="Seja Chamado" description="Receba uma notificação quando for sua vez" />
          </div>
        </div>

        <footer className="text-center mt-20 pb-8">
          <p className="text-white/60">
            Feito com ❤️ para eliminar filas no Brasil
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
