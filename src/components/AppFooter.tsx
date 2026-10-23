import { GithubIcon } from '@/components/GithubIcon'

const REPO_URL = 'https://github.com/jaervic/budgetify'

/** Pie de página con el enlace al repositorio y el recordatorio de privacidad. */
export function AppFooter() {
  return (
    <footer className="mt-4 border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 pt-6 pb-24 text-center text-sm text-muted-foreground lg:py-6">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          <GithubIcon className="size-4" />
          Código abierto en GitHub
        </a>
        <p>Gratis y sin servidores · tus datos no salen de tu equipo</p>
      </div>
    </footer>
  )
}
