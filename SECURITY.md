# Política de seguridad

Gracias por ayudar a mantener segura esta aplicación.

## Cómo reportar una vulnerabilidad

**No abras un *issue* público** para problemas de seguridad. Usa el reporte privado
de GitHub:

1. Entra en <https://github.com/jaervic/budgetify/security/advisories/new>
2. Describe el problema, cómo reproducirlo y su impacto.

Recibirás respuesta lo antes posible. Una vez corregido, se publicará el aviso.

## Alcance y modelo de seguridad

Esta aplicación **no tiene backend, ni cuentas, ni sesiones, ni servidores**. Todo el
cálculo y el almacenamiento ocurren en el navegador de cada persona:

- Los datos (borrador, catálogo, datos de la clínica) se guardan en el **`localStorage`
  del propio navegador**. No se envían a ningún servidor.
- La única conexión externa es un `GET` a la API pública de la tasa del BCV
  (`https://ve.dolarapi.com`), que no lleva datos del usuario.
- No hay analítica, rastreadores ni cookies de terceros.

Por eso, las vulnerabilidades relevantes aquí son:

- **XSS** (que un script inyectado pudiera leer el `localStorage`).
- **CSRF/clickjacking** (mitigado con CSP `frame-ancestors` y `X-Frame-Options`).
- **Dependencias** comprometidas o desactualizadas.

## Medidas aplicadas

- **Content-Security-Policy estricta** sin `unsafe-inline` ni `unsafe-eval` en scripts
  (ver `vercel.json`). Solo se permite WebAssembly (`'wasm-unsafe-eval'`), que necesita
  la librería que arma el PDF, y `data:` en `connect-src` porque esa misma librería
  carga su módulo desde una URL de datos (inerte: no puede salir a la red).
- Cabeceras `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy` y `Cross-Origin-Resource-Policy`.
- **Validación con Zod** de todo archivo importado, con límites de tamaño y longitud, y
  las imágenes solo se aceptan como `data:image/(png|jpeg|webp);base64,…`.
- Sin `eval`, sin `new Function` y sin `dangerouslySetInnerHTML`.
- `npm audit --audit-level=high` en el CI y actualizaciones automáticas con Dependabot.

## Aviso para equipos compartidos

Como los datos viven en el navegador, **en una computadora compartida otra persona que
use el mismo perfil del navegador podría ver el borrador**. En ese caso, usa el botón
**Limpiar** al terminar (o abre la app en una ventana de incógnito).
