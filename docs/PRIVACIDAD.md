# Política de privacidad (plantilla)

> **Plantilla, no asesoría legal.** Adáptala a tu país, a tu forma jurídica y a los
> proveedores que uses antes de abrir la app a pacientes reales. Cambia todos los
> campos entre `[...]`.

## 1. Responsable

- **Responsable:** `[nombre o razón social]`
- **RIF / identificación fiscal:** `[RIF]`
- **Correo de contacto:** `[privacidad@tudominio.com]`
- **País:** `[país]`

## 2. Qué datos se tratan

### Sin cuenta (modo por defecto)

La app guarda en el **`localStorage` del navegador** el borrador, el historial, el
catálogo y los datos de la empresa. **No se envían a ningún servidor.** La única
conexión externa es la consulta de la tasa del BCV, que no incluye datos del usuario.

### Con cuenta (sincronización opcional)

Si la persona activa una cuenta, se tratan:

- **Correo electrónico** y **contraseña** (almacenada por Supabase Auth como hash, nunca
  en claro ni en la app) para el acceso.
- **Datos de la empresa:** nombre, RIF, dirección, teléfonos, correo, logo, firma y
  sello.
- **Catálogo y preferencias:** servicios, productos, paquetes, notas y tamaños de hoja.
- **Documentos archivados:** nombre del paciente o cliente, cédula/RIF, edad,
  procedimiento, servicios/productos, importes, fechas y notas.
- **Metadatos técnicos:** identificadores de fila, fechas de creación/actualización y
  estado de borrado.
- **Proveedores:** Supabase (autenticación y base de datos) y `[proveedor de correo]`
  (por ejemplo, Gmail SMTP) para enviar el enlace mágico o el enlace de recuperación de
  contraseña.

Si la confirmación por correo está desactivada, el correo **no se verifica**: se usa como
identificador de la cuenta. El acceso queda protegido por la contraseña y por las reglas
de aislamiento por usuario.

No se usa analítica, publicidad ni cookies de terceros.

## 3. Para qué se usan

- Prestar el servicio: calcular presupuestos y generar PDF.
- Sincronizar el historial y la empresa entre los equipos de la misma cuenta.
- Autenticar el acceso mediante correo + contraseña o enlace mágico.
- Enviar el enlace de recuperación cuando la persona olvida su contraseña.
- Atender solicitudes de soporte y cumplir obligaciones legales.

**No** se usan para elaborar perfiles, entrenar modelos ni tomar decisiones
automatizadas. La app **no es una historia clínica** y no debe usarse como tal.

## 4. Base legal

- **Consentimiento** al crear la cuenta y activar la sincronización.
- **Ejecución del servicio** para los datos necesarios.
- **Cumplimiento legal** cuando corresponda.

## 5. Dónde y cuánto tiempo

- Los datos de la cuenta se alojan en **Supabase**, región `[región]`.
- Se conservan mientras la cuenta exista. Al borrarla desde **Cuenta → Borrar mi
  cuenta y mis datos**, se eliminan el usuario y sus filas por cascada.
- Los datos locales permanecen hasta que se borren desde la app o se limpien los datos
  del navegador.
- Las copias de seguridad del proveedor se conservan según su plan contratado
  (`[plazo]`).

## 6. Quién puede acceder

- La persona titular de la cuenta, mediante su sesión.
- El proveedor de infraestructura, en la medida necesaria para operar el servicio.
- **No hay cifrado de extremo a extremo.** El proveedor aplica cifrado en tránsito y en
  reposo, pero técnicamente podría acceder a los datos. No se deben tratar datos que no
  se esté dispuesto a alojar bajo ese modelo.
- El acceso está aislado por **Row Level Security**: cada usuario solo puede leer y
  escribir sus propias filas.

## 7. Derechos de la persona

Puede:

- **Acceder** a sus datos desde la app.
- **Rectificarlos** editando la empresa, el catálogo o los documentos.
- **Exportarlos** con **Descargar** (JSON).
- **Borrarlos** con **Cuenta → Borrar mi cuenta y mis datos**, o limpiando el
  navegador si no usa cuenta.
- **Retirar el consentimiento** cerrando sesión y borrando la cuenta.
- **Reclamar** ante `[autoridad de protección de datos]`.

Para ejercerlos: `[privacidad@tudominio.com]`.

## 8. Seguridad

- HTTPS obligatorio; HSTS y CSP estricta.
- RLS por usuario en la base de datos.
- La contraseña la almacena Supabase Auth como hash; la app no la guarda ni la escribe en
  `localStorage`.
- La clave `service_role` solo existe en la función de borrado, nunca en el navegador.
- Las credenciales SMTP viven solo en Supabase, no en el cliente.
- Validación de los datos con Zod antes de aplicarlos.
- Sin `eval`, sin `dangerouslySetInnerHTML` y sin rastreadores.
- Riesgo residual: un XSS podría leer el `localStorage` y la sesión. Por eso se mantiene
  la CSP y se revisan las dependencias.

## 9. Equipos compartidos

En una computadora compartida, la persona debe usar **Cerrar sesión → borrar los datos
de este equipo**. Si otra cuenta inicia sesión en un equipo con datos de una cuenta
anterior, la app pregunta antes de combinarlos o descartarlos; no los sube sola.

## 10. Menores y datos sensibles

La app está pensada para personal administrativo y profesionales de la salud. No debe
usarse para guardar historias clínicas ni más datos del paciente de los necesarios para
el presupuesto. Si se tratan datos de menores, se requiere la base legal aplicable.

## 11. Cambios

Esta política puede actualizarse. La fecha de la última versión es `[fecha]`. Los
cambios sustanciales se comunicarán en la app o por correo.

## 12. Contacto

`[nombre]` · `[correo]` · `[dirección]`
