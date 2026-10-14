# 🩺 Presupuestos Médicos

**Una página web para hacer los presupuestos de tu clínica o consultorio en minutos.**

Escribes los datos del paciente, agregas los servicios (cirugía, consulta, exámenes…),
y descargas un **PDF listo para imprimir, guardar o enviar por WhatsApp**.

> ✅ No hay que instalar nada · ✅ no hay que crear cuenta · ✅ funciona sin internet ·
> ✅ **tus datos no salen de tu computadora**

![Pantalla de edición](docs/capturas/edicion.png)

## ¿Qué hace?

- **Datos del paciente**: nombre, cédula y edad.
- **El procedimiento** y la fecha que tú elijas.
- **Los servicios**: honorarios médicos, gastos de la clínica, consultas, procedimientos,
  enfermería y estudios (ecografías, electrocardiograma, laboratorio, rayos X…).
- **Los precios los pones tú**: puedes cambiar cantidades, precios o agregar servicios
  propios. Se guardan para la próxima vez.
- **Calcula solo**: muestra el monto en **dólares** y en **bolívares**, con subtotales por
  categoría y el total general.
- **La tasa del dólar (BCV)** se actualiza sola; también la puedes escribir a mano.
- **Descarga el PDF**, lo imprimes o lo compartes por WhatsApp.
- **Guarda una copia** de tus presupuestos en un archivo (Exportar / Importar).

## El documento que genera

Se ve como un presupuesto formal, con el **logo**, el **RIF** y los datos de tu clínica,
y al final un espacio para la **firma y el sello**:

![Vista previa del documento](docs/capturas/documento.png)

## Funciona en el teléfono

También en la tablet y en el teléfono, para que puedas hacer un presupuesto junto al
paciente:

<p>
  <img src="docs/capturas/movil-edicion.png" alt="Edición en el teléfono" width="280">
  <img src="docs/capturas/movil-documento.png" alt="Documento en el teléfono" width="280">
</p>

## Para quién es

Médicos, secretarias y personal administrativo de **clínicas pequeñas, consultorios y
unidades quirúrgicas** que hoy hacen los presupuestos a mano o en Word/Excel.

## Cómo usarlo (paso a paso)

1. **Abre la página** en tu navegador (Chrome, Edge, Safari…).
2. Escribe el **nombre del paciente**, su cédula y su edad, y el **procedimiento**.
3. Pulsa **“Agregar servicio”** y elige los que necesites del catálogo, o **“Cargar
   plantilla”** para traer un conjunto ya armado (por ejemplo, una cirugía completa).
4. Revisa y ajusta los precios en la tabla. Todo se recalcula al instante.
5. Pulsa **“Descargar PDF”**. También puedes **imprimirlo** o **mandarlo por WhatsApp**.
6. La primera vez, entra en **“Clínica”** y carga el nombre, el RIF, el logo, la firma y
   el sello para que salgan en el documento.

## Preguntas frecuentes

**¿Necesito internet?**
Solo la primera vez, para abrir la página. Después funciona sin conexión. Si hay internet,
aprovecha para actualizar sola la tasa del dólar del BCV.

**¿Mis datos se envían a algún servidor? ¿Son privados?**
Sí, son privados. **Nada se envía a ningún servidor**: todo se guarda únicamente en tu
navegador. No hay cuentas, no hay registro y no hay base de datos.

**¿Dónde quedan los presupuestos guardados?**
En el navegador del equipo donde trabajas. Si cambias de computadora o quieres un respaldo,
usa **“Exportar JSON”** y luego **“Importar JSON”** en el otro equipo.

**¿Puedo cambiar los precios?**
Sí. En **“Gestionar catálogo”** puedes editar precios, agregar o borrar servicios, crear
categorías nuevas y guardar plantillas para los casos que más repites.

**¿Se actualiza el precio del dólar?**
Sí, toma solo la **tasa oficial del BCV**. Si prefieres, puedes desmarcar *“Anclar al BCV”*
y escribir la tasa a mano.

**¿Puedo poner el logo, el RIF, la firma y el sello de mi clínica?**
Sí, en **“Clínica”**. Salen en el encabezado y al pie del documento.

**¿Puedo elegir el tamaño de la hoja?**
Sí: **A4**, Carta u Oficio.

**¿Sirve como historia médica?**
No. Es solo para **armar el presupuesto**. No guarda historias clínicas ni datos de
pacientes en ningún sistema.

**¿Cuánto cuesta?**
Nada. Es **gratis y de código abierto** (licencia MIT).

## ⚠️ Aviso importante

Los precios del catálogo son **orientativos**. Revisa siempre los montos y los datos del
documento antes de entregarlo al paciente. Esta herramienta ayuda a armar el presupuesto,
pero **no sustituye tu criterio médico ni administrativo**.

## ¿Quieres colaborar?

¡Eres bienvenido! Puedes reportar un error o proponer una mejora abriendo un *Issue*, o
enviar un *Pull Request*. Si eres desarrollador, mira la
**[documentación técnica](docs/DESARROLLO.md)** (stack, instalación, tests y despliegue).

## Licencia

[MIT](LICENSE) — puedes usarlo, modificarlo y compartirlo libremente citando al autor.

---

## English summary

**Medical Estimates** is a free, open-source web app that helps small clinics and private
practices in Venezuela create medical cost estimates (quotes): enter the patient's data,
pick services, and download a ready-to-print **PDF** in USD and VES (BCV rate).

**100 % frontend** — no backend, no sign-up, no tracking. Everything is stored in the
browser, and it works offline. Built with React, TypeScript, Tailwind and
[`@react-pdf/renderer`](docs/DESARROLLO.md).

*Not a medical records system — it only builds the estimate.*
