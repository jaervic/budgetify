import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LIMITS } from '@/lib/limits'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { Pack, PackService } from '@/types'

/** Alta, edición y borrado de paquetes de servicios. */
export function PacksPanel() {
  const catalog = useBudgetStore((state) => state.catalog)
  const addPack = useBudgetStore((state) => state.addPack)
  const updatePack = useBudgetStore((state) => state.updatePack)
  const removePack = useBudgetStore((state) => state.removePack)

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        size="sm"
        className="w-fit"
        onClick={() => addPack({ name: 'Nuevo paquete', description: '', services: [] })}
      >
        <Plus />
        Nuevo paquete
      </Button>

      <ScrollArea className="h-[46vh] pr-3">
        <div className="grid gap-3">
          {catalog.packs.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay paquetes todavía.
            </p>
          )}

          {catalog.packs.map((pack) => (
            <PackEditor
              key={pack.id}
              pack={pack}
              services={catalog.services.map((service) => ({
                id: service.id,
                label: `${service.category} · ${service.concept}`,
              }))}
              onChange={(patch) => updatePack(pack.id, patch)}
              onRemove={() => removePack(pack.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface PackEditorProps {
  pack: Pack
  services: { id: string; label: string }[]
  onChange: (patch: Partial<Pack>) => void
  onRemove: () => void
}

function PackEditor({ pack, services, onChange, onRemove }: PackEditorProps) {
  const toggle = (serviceId: string, checked: boolean) => {
    const next: PackService[] = checked
      ? [...pack.services, { serviceId }]
      : pack.services.filter((entry) => entry.serviceId !== serviceId)
    onChange({ services: next })
  }

  const selected = new Set(pack.services.map((entry) => entry.serviceId))

  return (
    <div className="grid gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Input
          className="font-medium"
          aria-label="Nombre del paquete"
          maxLength={LIMITS.packName}
          value={pack.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Eliminar paquete"
          className="text-destructive hover:text-destructive"
          onClick={() =>
            withUndo(
              { catalog: useBudgetStore.getState().catalog },
              'Paquete eliminado',
              () => onRemove(),
            )
          }
        >
          <Trash2 />
        </Button>
      </div>

      <Input
        aria-label="Descripción del paquete"
        placeholder="Descripción (opcional)"
        maxLength={LIMITS.packDescription}
        value={pack.description ?? ''}
        onChange={(event) => onChange({ description: event.target.value || undefined })}
      />

      <div className="max-h-44 overflow-y-auto rounded-md border p-2">
        <div className="grid gap-1">
          {services.map((service) => (
            <label
              key={service.id}
              className="flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent"
            >
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={selected.has(service.id)}
                onChange={(event) => toggle(service.id, event.target.checked)}
              />
              <span className="truncate">{service.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
