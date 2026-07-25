'use client'

export const dynamic = 'force-dynamic'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700 animate-scale-in">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erro no Painel</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ocorreu um erro ao carregar esta página do admin.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
