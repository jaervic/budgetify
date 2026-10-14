import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { RateField } from '@/components/RateField'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBudgetStore } from '@/store/useBudgetStore'

const schema = z.object({
  name: z.string().trim().min(1, 'El nombre del paciente es obligatorio'),
  ci: z.string(),
  age: z.string().refine(
    (value) => value === '' || (/^\d{1,3}$/.test(value) && Number(value) > 0 && Number(value) <= 130),
    { message: 'Edad inválida' },
  ),
  issueDate: z.string().min(1, 'Indica la fecha de emisión'),
  procedure: z.string(),
})

type FormValues = z.infer<typeof schema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

/**
 * Datos del paciente, fecha de emisión y tasa de cálculo.
 * Cada cambio válido se guarda en el store; el formulario se remonta (vía key)
 * cuando se importa o limpia un presupuesto.
 */
export function DataForm() {
  const budget = useBudgetStore((state) => state.budget)
  const setPatient = useBudgetStore((state) => state.setPatient)
  const setProcedure = useBudgetStore((state) => state.setProcedure)
  const setIssueDate = useBudgetStore((state) => state.setIssueDate)

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: budget.patient.name,
      ci: budget.patient.ci ?? '',
      age: budget.patient.age ? String(budget.patient.age) : '',
      issueDate: budget.issueDate,
      procedure: budget.procedure ?? '',
    },
  })

  useEffect(() => {
    const subscription = watch((values) => {
      const parsed = schema.safeParse(values)
      if (!parsed.success) return
      const data = parsed.data
      setPatient({
        name: data.name.trim(),
        ci: data.ci.trim() || undefined,
        age: data.age ? Number(data.age) : undefined,
      })
      setProcedure(data.procedure.trim())
      setIssueDate(data.issueDate)
    })
    return () => subscription.unsubscribe()
  }, [watch, setPatient, setProcedure, setIssueDate])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del presupuesto</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="patient-name">Paciente *</Label>
          <Input
            id="patient-name"
            placeholder="Nombre y apellido"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="patient-ci">Cédula</Label>
          <Input id="patient-ci" placeholder="V-00000000" {...register('ci')} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="patient-age">Edad</Label>
          <Input
            id="patient-age"
            inputMode="numeric"
            placeholder="Años"
            aria-invalid={Boolean(errors.age)}
            {...register('age')}
          />
          <FieldError message={errors.age?.message} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="issue-date">Fecha de emisión</Label>
          <Input
            id="issue-date"
            type="date"
            aria-invalid={Boolean(errors.issueDate)}
            {...register('issueDate')}
          />
          <FieldError message={errors.issueDate?.message} />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="procedure">Procedimiento</Label>
          <Input
            id="procedure"
            placeholder="Ej. Chequeo general"
            {...register('procedure')}
          />
        </div>

        <RateField />
      </CardContent>
    </Card>
  )
}
