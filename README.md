# 🩺 Presupuestos Médicos y Cotizaciones

**Una página web para hacer los presupuestos de tu clínica o consultorio y cotizaciones
de productos en minutos.**

Escribes los datos del paciente, agregas los servicios (cirugía, consulta, exámenes…), o
cambias a la modalidad de **cotización** para escoger productos del catálogo, y descargas un
**PDF listo para imprimir, guardar o enviar por WhatsApp**.

> ✅ No hay que instalar nada · ✅ se puede usar sin crear cuenta · ✅ funciona sin internet ·
> ✅ **por defecto tus datos no salen de tu computadora** ·
> ✅ **opcional: tu propia cuenta para ver el mismo historial en el teléfono y la computadora**

### ▶️ Pruébala ahora: **[budgetify-silk.vercel.app](https://budgetify-silk.vercel.app)**

Se abre directo en el navegador, también en el teléfono. *(Es una instancia pública de
demostración: no escribas datos reales de pacientes en ella. La cuenta está activa y
sincroniza con Supabase; para producción, despliega tu propia copia.)*

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
- **Historial**: guarda copias dentro del navegador (hasta 100) y vuelve a abrir
  cualquier presupuesto anterior cuando el paciente regrese.
- **Cuenta opcional**: si la activas, el historial, la empresa y el catálogo se
  sincronizan entre tus equipos. Sin cuenta, todo sigue siendo 100 % local.
- **Cotizaciones de productos**: cambia la modalidad, escoge varios productos del catálogo,
  ajusta cantidades, unidades, precios e **IVA por producto**, y obtén Subtotal, IVA y Neto.
- **Respaldo en archivo**: Descargar / Abrir archivo para llevarte todo a otro equipo.

## El documento que genera

Se ve como un presupuesto formal, con el **logo**, el **RIF** y los datos de tu clínica,
y al final un espacio para la **firma y el sello**:

![Vista previa del documento](docs/capturas/documento.png)

## Cotizaciones de productos

En la parte superior puedes cambiar entre **Presupuesto médico** y **Cotización**. La
cotización tiene su propio catálogo de productos (código, categoría, descripción, unidad,
precio e IVA) y su propio formato de hoja:

- Trae **78 productos de ejemplo** en 11 categorías: protección, curación, antisépticos,
  inyección, diagnóstico, quirófano, ortopedia, odontología, laboratorio, higiene y
  medicamentos. Los precios son referencias editables en USD.
- Se eligen **varios productos a la vez** desde un buscador con filtros por categoría.
- La **moneda** puede ser **USD** o **VES (bolívares)**. Puedes activar **“Mostrar también
  los importes en la otra moneda”** para ver ambos valores en cada producto, en los totales
  y en el PDF.
- El **precio es la base sin IVA**; cada producto tiene su porcentaje (16 % por defecto, 0 %
  para exentos).
- El documento muestra **Código, Descripción, Cantidad, Unidad, Precio, % IVA, IVA y Neto**.
- Al final: **Subtotal, IVA, Neto** y el total en bolívares con la tasa aplicada.
- El tamaño por defecto es **Carta**. Si el contenido pasa de una hoja, la cabecera, los
  datos del cliente y la cabecera de la tabla se repiten en las hojas siguientes.
- Los datos opcionales (código y RIF del cliente, teléfonos, dirección, vendedor, oficina,
  transporte, vencimiento, orden de compra, descripción y notas/condiciones) solo se imprimen
  si tienen valor.
- El botón **Nueva cotización** crea un documento vacío con el siguiente número disponible,
  sin perder la copia anterior (se puede deshacer).
- Los productos se gestionan en **Catálogo y precios → Productos** y se incluyen en el
  respaldo del catálogo.
- El **historial** guarda presupuestos y cotizaciones juntos, con un distintivo de tipo.

## Funciona en el teléfono

También en la tablet y en el teléfono, para que puedas hacer un presupuesto junto al
paciente:

<p>
  <img src="docs/capturas/movil-edicion.png" alt="Edición en el teléfono" width="280">
  <img src="docs/capturas/movil-documento.png" alt="Documento en el teléfono" width="280">
</p>

## Pensada para ser fácil

- Textos y botones más grandes, con áreas de toque cómodas en el teléfono.
- La guía de 3 pasos explica el recorrido la primera vez y se puede reabrir con
  **“¿Cómo se usa?”**.
- Las opciones técnicas (precio del dólar, datos opcionales, copias de seguridad)
  quedan plegadas para no distraer.
- Todo se puede usar solo con el teclado y los avisos se anuncian al lector de pantalla.

## Para quién es

Médicos, odontólogos y personal administrativo de **consultorios, clínicas pequeñas y
unidades quirúrgicas** que hoy hacen los presupuestos a mano o en Word/Excel.

Elige tu **área de práctica** —Cirugía, Medicina General, Odontología, Traumatología y
Ortopedia, Pediatría, Ginecología y Obstetricia, o Dermatología— y el catálogo se enfoca en
lo tuyo sin perder los gastos generales (enfermería, estudios, gastos de clínica), que
cualquier especialista termina necesitando. Viene con **129 servicios y 12 paquetes**.

También sirve para un **profesional independiente sin clínica propia**: la hoja se encabeza
con tu nombre y tu título (“Od. Ana Rojas”) y debajo tu área de práctica.

## Cómo usarlo (paso a paso)

1. **Abre la página** en tu navegador (Chrome, Edge, Safari…). La primera vez
   aparece una guía de 3 pasos; puedes volver a abrirla con **“¿Cómo se usa?”**.
2. Escribe el **nombre del paciente**, su cédula y su edad, y el **procedimiento**.
3. Pulsa **“Agregar servicio”** y elige los que necesites del catálogo, o **“Cargar
   paquete”** para traer un conjunto ya armado (por ejemplo, una cirugía completa).
   Arriba del buscador tienes los **chips por área**: elige la tuya para ver solo lo tuyo,
   o “Todo el catálogo” para ver los 129 servicios.
4. Revisa y ajusta los precios en la tabla. Todo se recalcula al instante.
5. Pulsa **“Descargar PDF”**. También puedes **imprimirlo** o **mandarlo por WhatsApp**.
   Si quieres conservarlo a mano, **“Guardar copia en el historial”** (arriba, en
   **Historial**, lo vuelves a abrir después).
6. La primera vez, entra en **“Empresa”**: elige si los documentos son de una **clínica** o
   de un **profesional independiente**, escribe tu **título** (Dr., Dra., Od., Lcda.…) y tu
   **área de práctica**, y carga el RIF, el logo, la firma y el sello.
7. Si quieres continuar en otro equipo, pulsa **“Iniciar sesión”** (arriba). Puedes crear
   una cuenta con **correo y contraseña** o pedir un **enlace mágico** por correo. La app
   sigue funcionando sin conexión; los cambios se suben cuando vuelve la red.

En móvil o tablet, **Empresa**, **Historial** y **Catálogo y precios** están dentro del
menú **Más opciones** (⋮) de la cabecera.

## Preguntas frecuentes

**¿Necesito internet?**
Para abrirla la primera vez y, si usas cuenta, para iniciar sesión y sincronizar. Después
se puede trabajar sin conexión. Si hay internet, la app aprovecha para actualizar la tasa
del BCV y —si activaste tu cuenta— para sincronizar los cambios. Sin conexión sigues
editando; lo pendiente se sube al volver la red.

**¿Mis datos se envían a algún servidor? ¿Son privados?**
**Por defecto, no.** Sin cuenta, todo se guarda únicamente en tu navegador: no hay
registro, no hay base de datos y nada sale de tu equipo.

Si tú activas la **cuenta opcional**, el historial, la empresa y el catálogo se guardan
también en Supabase para que los veas en tus otros equipos. Viajan por HTTPS y se guardan
cifrados en el proveedor; cada fila está aislada por usuario con reglas RLS. No es cifrado
de extremo a extremo: el proveedor aplica el cifrado, no una clave que solo tú tengas.
La contraseña la guarda Supabase como hash; la app nunca la almacena. Los correos de
acceso o recuperación pasan por el SMTP configurado (por ejemplo, Gmail). Puedes cerrar
sesión, borrar la cuenta y todos sus datos desde **Cuenta**.

**¿Cómo entro desde otro equipo?**
Pulsa **“Iniciar sesión”** y entra con el mismo correo y contraseña. Si creaste la cuenta
con un enlace mágico y nunca le pusiste contraseña, entra con otro enlace y usa **Cuenta →
Cambiar contraseña** para crear una.

**Ya usaba la app sin cuenta y tengo presupuestos en el historial. ¿Qué pasa si me registro?**
Regístrate en el **mismo navegador y equipo** donde están guardados. Después de crear la
cuenta, la app te preguntará qué hacer: elige **“Subir mis documentos”** o
**“Combinar ambos”**. No elijas **“Usar solo la nube”** si el historial local es lo que
quieres conservar. Si cambias de equipo, usa **“Descargar”** y **“Abrir”**, o registra
primero el equipo que tiene los documentos.

**¿Olvidé mi contraseña?**
En **Cuenta → ¿Olvidaste tu contraseña?** escribes tu correo y recibes un enlace para
crear una nueva. Ese correo sale por el SMTP configurado (por ejemplo, Gmail). Si el
enlace no llega, revisa spam o pide al administrador que restablezca la contraseña.

**¿La cuenta da un error al cargar después de una actualización?**
La app reintenta la descarga del módulo de la cuenta y, si aun así falla, muestra un
aviso con un botón **“Reintentar”** en vez del error técnico. También puedes cerrar la
PWA y abrirla desde el navegador, o hacer una recarga forzada. **No borres los datos del
sitio**: ahí están tus presupuestos locales. Si el problema continúa, espera unos minutos
y recarga; puede coincidir con el despliegue de una versión nueva.

**¿Dónde quedan los presupuestos guardados?**
En el navegador del equipo donde trabajas. Además del que estás editando, puedes archivar
copias en **“Historial”** (se conservan las 100 últimas; al pasar de ahí se descartan las
más viejas y la app te avisa). Si activas la cuenta, el historial también queda en la nube
y aparece en tus otros equipos. Para un respaldo manual siempre tienes **“Descargar”** y
**“Abrir”**.

**Me equivoque, ¿puedo volver atrás?**
Sí. Al borrar una línea, una nota, una categoría o una copia del historial, o al reemplazar
el presupuesto, aparece un aviso con **“Deshacer”**. Lo que sí borra de verdad es
**“Nuevo presupuesto”**: para eso pide confirmación.

**¿Puedo recuperar las notas y condiciones que vienen por defecto?**
Sí. En **“Notas y recomendaciones”** del presupuesto y en **“Notas y condiciones”** de la
cotización puedes volver a poner las que faltan, restaurar el texto original de una nota
editada o reemplazar todo por las predeterminadas (con opción de deshacer). Además puedes
guardar tus propias notas y condiciones como predeterminadas para los documentos nuevos.

**¿Puedo cambiar los precios?**
Sí. En **“Catálogo y precios”** puedes editar precios, agregar o borrar servicios, crear
categorías nuevas y guardar paquetes para los casos que más repites. Cada servicio puede
pertenecer a un **área de práctica** o ser **transversal** (se ofrece en todas).

**¿Sirve para odontología? ¿Y para otras especialidades?**
Sí. Trae catálogos de arranque para **Cirugía, Medicina General, Odontología** (consulta,
restauradora, endodoncia, cirugía oral, periodoncia, ortodoncia, estética y odontopediatría),
**Traumatología y Ortopedia, Pediatría, Ginecología y Obstetricia** y **Dermatología**, con
precios de referencia de mercado que puedes editar.

**¿Se actualiza el precio del dólar?**
Sí, toma solo la **tasa oficial del BCV**. Si prefieres, puedes desmarcar *“Actualizar solo con el BCV”*
y escribir la tasa a mano.

**¿Puedo poner el logo, el RIF, la firma y el sello de mi clínica?**
Sí, en **“Empresa”**. Salen en el encabezado y al pie del documento. Si trabajas por tu
cuenta, activa **“Profesional independiente”** y la hoja se encabeza con tu nombre, tu
título y tu área.

**¿Puedo elegir el tamaño de la hoja?**
Sí: **A4**, Carta u Oficio.

**¿Sirve como historia médica?**
No. Es solo para **armar el presupuesto**. No es un sistema de historia clínica: solo
guarda el documento que tú decides archivar, en el navegador o en tu cuenta si la activas.

**¿Cuánto cuesta?**
Nada para quien la usa. Es **gratis y de código abierto** (licencia MIT). Si activas la
sincronización, el operador de esa instancia paga el proveedor: Supabase tiene plan
gratuito y, para uso real sin pausas, unos **$25/mes** (ver
[documentación técnica](docs/DESARROLLO.md)).

## ⚠️ Aviso importante

Los precios del catálogo son **orientativos**. Revisa siempre los montos y los datos del
documento antes de entregarlo al paciente. Esta herramienta ayuda a armar el presupuesto,
pero **no sustituye tu criterio médico ni administrativo**.

## 🔒 Privacidad y seguridad

- **Sin cuenta, no hay servidores**: nada de lo que escribes se envía a internet. No hay
  registro ni base de datos.
- **La cuenta es opcional y explícita**: solo se sincroniza lo que decidas guardar en ella.
  La app sigue funcionando sin conexión y sin cuenta.
- **Sin rastreadores**: no hay analítica ni cookies de terceros.
- Las conexiones externas son la consulta de la tasa del BCV (que no lleva datos tuyos) y,
  si activas la cuenta, Supabase para la sesión y la sincronización. Si no usas cuenta y
  escribes la tasa a mano, no hay conexión con Supabase.
- Los datos quedan guardados **en este navegador**, incluido el **historial** de copias. En
  una computadora compartida, usa **Cuenta → Cerrar sesión → borrar los datos de este
  equipo**, o pulsa **Nuevo presupuesto** al terminar y vacía el historial.
- En esta **instancia pública de demostración** la cuenta está activa y los datos se
  guardan en Supabase. No uses datos reales de pacientes aquí; para producción, despliega
  tu propia copia (ver [documentación técnica](docs/DESARROLLO.md)).
- Si vas a operar una instancia con cuentas, adapta la
  **[plantilla de política de privacidad](docs/PRIVACIDAD.md)**.
- Detalles y cómo reportar un problema: **[política de seguridad](SECURITY.md)**.

## ¿Quieres colaborar?

¡Eres bienvenido! Puedes reportar un error o proponer una mejora abriendo un *Issue*, o
enviar un *Pull Request*. Si eres desarrollador, mira la
**[documentación técnica](docs/DESARROLLO.md)** (stack, instalación, tests y despliegue).

## Licencia

[MIT](LICENSE) — puedes usarlo, modificarlo y compartirlo libremente citando al autor.

---

## English summary

**Medical Estimates** is a free, open-source web app that helps small clinics, sole
practitioners and dental offices in Venezuela create medical cost estimates (quotes): enter
the patient's data, pick services, and download a ready-to-print **PDF** in USD and VES
(BCV rate).

It ships with **practice-area catalogues** (Surgery, General Medicine, Dentistry, Trauma &
Orthopaedics, Paediatrics, OB-GYN and Dermatology) plus cross-cutting services such as
nursing and lab work, and the document can be headed either by a clinic or by the
professional ("Dr. Jane Doe" over her specialty). It keeps a **local history** of up to 100
estimates you can reopen, and every destructive action offers an undo.

It works **without an account** and offline. An **optional account** (email + password,
or a magic email link) syncs the history, company data and catalogue across phone and
computer through Supabase, with per-user row-level security. The public demo has the
optional account enabled; do not enter real patient data there. For production, deploy
your own copy with your own Supabase project.

**Live demo:** [budgetify-silk.vercel.app](https://budgetify-silk.vercel.app)

**Local-first** — no backend unless you enable the optional account, no tracking.
Everything is stored in the browser by default. Built with React, TypeScript, Tailwind,
[`@react-pdf/renderer`](docs/DESARROLLO.md) and optionally Supabase.

*Not a medical records system — it only builds the estimate.*
