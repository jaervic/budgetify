import { useState } from 'react'
import { RateField } from '@/components/RateField'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LIMITS } from '@/lib/limits'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Error de la edad, o `null` si es válida (vacía se considera válida). */
function ageError(value: string): string | null {
  if (value === '') return null
  const age = Number(value)
  if (!/^\d{1,3}$/.test(value) || age < 1 || age > 130) return 'Edad inválida (1 a 130)'
  return null
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

/**
 * Datos del paciente, fecha de emisión y tasa de cálculo.
 *
 * Cada campo escribe en el store por separado: un valor inválido en un campo
 * (p. ej. la fecha vacía) solo afecta a ese campo, nunca bloquea el guardado de
 * los demás. Antes se guardaba todo o nada, así que escribir con el nombre del
 * paciente vacío descartaba el resto en silencio y la hoja quedaba desfasada
 * respecto al formulario.
 *
 * La edad y la fecha se editan como texto porque el modelo solo admite valores
 * válidos: así se puede borrar el campo sin que salte al valor anterior.
 */
export function DataForm() {
  const patient = useBudgetStore((state) => state.budget.patient)
  const procedure = useBudgetStore((state) => state.budget.procedure ?? '')
  const issueDate = useBudgetStore((state) => state.budget.issueDate)
  const setPatient = useBudgetStore((state) => state.setPatient)
  const setProcedure = useBudgetStore((state) => state.setProcedure)
  const setIssueDate = useBudgetStore((state) => state.setIssueDate)

  const [ageText, setAgeText] = useState(() => (patient.age ? String(patient.age) : ''))
  const [dateText, setDateText] = useState(issueDate)

  const ageMessage = ageError(ageText)
  const dateMissing = !/^\d{4}-\d{2}-\d{2}$/.test(dateText)

  const handleAge = (value: string) => {
    setAgeText(value)
    if (value === '') {
      setPatient({ age: undefined })
      return
    }
    if (ageError(value)) return
    setPatient({ age: Number(value) })
  }

  const handleDate = (value: string) => {
    setDateText(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) setIssueDate(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del presupuesto</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="patient-name">Paciente</Label>
          <Input
            id="patient-name"
            placeholder="Nombre y apellido"
            maxLength={LIMITS.patientName}
            value={patient.name}
            onChange={(event) => setPatient({ name: event.target.value })}
          />
          {patient.name.trim() === '' && (
            <p className="text-xs text-muted-foreground">
              Sin nombre, la hoja muestra «—». Puedes completarlo más tarde.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="patient-ci">Cédula</Label>
          <Input
            id="patient-ci"
            placeholder="V-00000000"
            maxLength={LIMITS.patientCi}
            value={patient.ci ?? ''}
            onChange={(event) => setPatient({ ci: event.target.value || undefined })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="patient-age">Edad</Label>
          <Input
            id="patient-age"
            inputMode="numeric"
            placeholder="Años"
            maxLength={3}
            aria-invalid={Boolean(ageMessage)}
            value={ageText}
            onChange={(event) => handleAge(event.target.value)}
          />
          <FieldError message={ageMessage} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="issue-date">Fecha de emisión</Label>
          <Input
            id="issue-date"
            type="date"
            aria-invalid={dateMissing}
            value={dateText}
            onChange={(event) => handleDate(event.target.value)}
            onBlur={() => {
              if (dateMissing) setDateText(issueDate)
            }}
          />
          <FieldError message={dateMissing ? 'Indica la fecha de emisión' : null} />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="procedure">Procedimiento</Label>
          <Input
            id="procedure"
            placeholder="Ej. Chequeo general"
            maxLength={LIMITS.procedure}
            value={procedure}
            onChange={(event) => setProcedure(event.target.value)}
          />
        </div>

        <RateField />
      </CardContent>
    </Card>
  )
}
