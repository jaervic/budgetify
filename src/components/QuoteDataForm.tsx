import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { RateField } from '@/components/RateField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LIMITS } from '@/lib/limits'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { QuoteCurrency } from '@/types'

/**
 * Datos de la cotización.
 *
 * Lo esencial (número, cliente, fecha, moneda y tasa) siempre está visible.
 * Los datos adicionales se pliegan y solo se imprimen si tienen valor; así el
 * documento queda limpio cuando no se usan.
 */
export function QuoteDataForm() {
  const quote = useBudgetStore((state) => state.quote)
  const setQuoteNumber = useBudgetStore((state) => state.setQuoteNumber)
  const setQuoteClient = useBudgetStore((state) => state.setQuoteClient)
  const setQuoteMeta = useBudgetStore((state) => state.setQuoteMeta)
  const setQuoteIssueDate = useBudgetStore((state) => state.setQuoteIssueDate)

  const [dateText, setDateText] = useState(quote.issueDate)
  const [lastDate, setLastDate] = useState(quote.issueDate)
  const [extraOpen, setExtraOpen] = useState(() =>
    Boolean(
      quote.client.code ||
        quote.client.rif ||
        quote.client.phones ||
        quote.client.address ||
        quote.seller ||
        quote.office ||
        quote.transport ||
        quote.dueDate ||
        quote.purchaseOrder ||
        quote.description,
    ),
  )

  if (quote.issueDate !== lastDate) {
    setLastDate(quote.issueDate)
    if (dateText !== quote.issueDate) setDateText(quote.issueDate)
  }

  const dateMissing = !/^\d{4}-\d{2}-\d{2}$/.test(dateText)
  // En bolívares (o si se muestra el equivalente) el precio del dólar es parte
  // del cálculo, no una opción avanzada.
  const needsRate = quote.currency === 'VES' || quote.showBothCurrencies

  const handleDate = (value: string) => {
    setDateText(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) setQuoteIssueDate(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la cotización</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="quote-number">N.º de cotización</Label>
          <Input
            id="quote-number"
            maxLength={LIMITS.quoteNumber}
            value={quote.number}
            onChange={(event) => setQuoteNumber(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="quote-date">Fecha de emisión</Label>
          <Input
            id="quote-date"
            type="date"
            aria-invalid={dateMissing}
            aria-describedby={dateMissing ? 'quote-date-error' : undefined}
            value={dateText}
            onChange={(event) => handleDate(event.target.value)}
            onBlur={() => {
              if (dateMissing) setDateText(quote.issueDate)
            }}
          />
          {dateMissing && (
            <p id="quote-date-error" className="text-sm text-destructive">
              Indica la fecha de emisión
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="quote-client">Cliente</Label>
          <Input
            id="quote-client"
            placeholder="Nombre o razón social"
            maxLength={LIMITS.quoteClientName}
            value={quote.client.name}
            onChange={(event) => setQuoteClient({ name: event.target.value })}
          />
          {quote.client.name.trim() === '' && (
            <p className="text-sm text-muted-foreground">
              Sin nombre, el documento muestra «—». Puedes completarlo más tarde.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="quote-currency">Moneda</Label>
          <Select
            value={quote.currency}
            onValueChange={(value) =>
              setQuoteMeta({ currency: value as QuoteCurrency })
            }
          >
            <SelectTrigger id="quote-currency" aria-label="Moneda de la cotización">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD · dólar estadounidense</SelectItem>
              <SelectItem value="VES">VES · bolívares</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            La tabla y el PDF muestran los precios en esta moneda.
          </p>
        </div>

        <label
          htmlFor="quote-show-both"
          className="flex cursor-pointer items-start gap-2 text-sm sm:pt-7"
        >
          <input
            id="quote-show-both"
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-primary"
            checked={quote.showBothCurrencies}
            onChange={(event) =>
              setQuoteMeta({ showBothCurrencies: event.target.checked })
            }
          />
          <span>
            Mostrar también en{' '}
            {quote.currency === 'USD' ? 'bolívares (VES)' : 'dólares (USD)'}
            <span className="block text-sm text-muted-foreground">
              Añade el equivalente en cada producto, en los totales y en el PDF.
            </span>
          </span>
        </label>

        {needsRate ? (
          <RateField />
        ) : (
          <details className="grid gap-3 rounded-lg border p-3 sm:col-span-2">
            <summary className="cursor-pointer text-sm font-medium">
              Opciones avanzadas: precio del dólar
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">
              Se actualiza solo con el BCV. Ábrelo únicamente si necesitas fijar el precio
              a mano.
            </p>
            <RateField />
          </details>
        )}
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Los precios se guardan en dólares. Si cotizas en bolívares, el precio del dólar
          los convierte a Bs.; al cambiarlo, los importes se recalculan.
        </p>

        <div className="min-w-0 sm:col-span-2">
          <Button
            id="quote-extra-toggle"
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-h-9 py-1.5 text-left whitespace-normal"
            onClick={() => setExtraOpen((open) => !open)}
            aria-expanded={extraOpen}
            aria-controls="quote-extra"
          >
            {extraOpen ? <ChevronUp /> : <ChevronDown />}
            Datos opcionales del cliente y del documento
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Solo se imprimen los campos que tengan valor. Sirven para completar la
            referencia: código y RIF del cliente, vendedor, oficina, transporte, vencimiento,
            orden de compra y descripción.
          </p>
        </div>

        <div
          id="quote-extra"
          role="group"
          aria-labelledby="quote-extra-toggle"
          hidden={!extraOpen}
          className="sm:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="quote-client-code">Código del cliente</Label>
              <Input
                id="quote-client-code"
                maxLength={LIMITS.quoteClientCode}
                value={quote.client.code ?? ''}
                onChange={(event) =>
                  setQuoteClient({ code: event.target.value || undefined })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-client-rif">RIF</Label>
              <Input
                id="quote-client-rif"
                placeholder="J-00000000-0"
                maxLength={LIMITS.quoteClientRif}
                value={quote.client.rif ?? ''}
                onChange={(event) =>
                  setQuoteClient({ rif: event.target.value || undefined })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-client-phones">Teléfonos</Label>
              <Input
                id="quote-client-phones"
                maxLength={LIMITS.quoteClientPhones}
                value={quote.client.phones ?? ''}
                onChange={(event) =>
                  setQuoteClient({ phones: event.target.value || undefined })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-client-address">Dirección</Label>
              <Input
                id="quote-client-address"
                maxLength={LIMITS.quoteClientAddress}
                value={quote.client.address ?? ''}
                onChange={(event) =>
                  setQuoteClient({ address: event.target.value || undefined })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-seller">Vendedor</Label>
              <Input
                id="quote-seller"
                maxLength={LIMITS.quoteSeller}
                value={quote.seller ?? ''}
                onChange={(event) => setQuoteMeta({ seller: event.target.value || undefined })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-office">Oficina</Label>
              <Input
                id="quote-office"
                maxLength={LIMITS.quoteOffice}
                value={quote.office ?? ''}
                onChange={(event) => setQuoteMeta({ office: event.target.value || undefined })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-transport">Transporte</Label>
              <Input
                id="quote-transport"
                maxLength={LIMITS.quoteTransport}
                value={quote.transport ?? ''}
                onChange={(event) =>
                  setQuoteMeta({ transport: event.target.value || undefined })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-due-date">Fecha de vencimiento</Label>
              <Input
                id="quote-due-date"
                type="date"
                value={quote.dueDate ?? ''}
                onChange={(event) =>
                  setQuoteMeta({ dueDate: event.target.value || undefined })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-purchase-order">Orden de compra</Label>
              <Input
                id="quote-purchase-order"
                maxLength={LIMITS.quotePurchaseOrder}
                value={quote.purchaseOrder ?? ''}
                onChange={(event) =>
                  setQuoteMeta({ purchaseOrder: event.target.value || undefined })
                }
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="quote-description">Descripción</Label>
              <Textarea
                id="quote-description"
                rows={2}
                maxLength={LIMITS.quoteDescription}
                value={quote.description ?? ''}
                onChange={(event) =>
                  setQuoteMeta({ description: event.target.value || undefined })
                }
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="quote-terms">Notas y condiciones</Label>
              <Textarea
                id="quote-terms"
                rows={3}
                maxLength={LIMITS.quoteTerms}
                placeholder="Formas de pago, tiempo de entrega, garantía, validez…"
                value={quote.terms ?? ''}
                onChange={(event) =>
                  setQuoteMeta({ terms: event.target.value || undefined })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
