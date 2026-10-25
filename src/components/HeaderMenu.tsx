import { Building2, History, MoreHorizontal, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderMenuProps {
  onOpenClinic: () => void
  onOpenHistory: () => void
  onOpenCatalog: () => void
}

/**
 * En móvil la cabecera solo muestra cuenta, tema y este menú. Las acciones
 * secundarias (empresa, historial y catálogo) viven aquí para no amontonar
 * iconos y para que los nombres se lean completos.
 */
export function HeaderMenu({
  onOpenClinic,
  onOpenHistory,
  onOpenCatalog,
}: HeaderMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 lg:hidden"
          aria-label="Más opciones"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpenClinic}>
          <Building2 />
          Empresa
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenHistory}>
          <History />
          Historial
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenCatalog}>
          <Settings2 />
          Catálogo y precios
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
