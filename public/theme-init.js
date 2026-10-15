/**
 * Aplica el tema guardado antes de pintar, para evitar el destello (FOUC).
 * Vive en un archivo aparte (no inline) para poder usar una CSP estricta
 * sin permitir scripts en línea.
 */
;(function () {
  try {
    var stored = localStorage.getItem('budgetify:theme') || 'system'
    var dark =
      stored === 'dark' ||
      (stored === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (dark) document.documentElement.classList.add('dark')
  } catch {
    // Sin acceso a localStorage o matchMedia: se usa el tema claro por defecto.
  }
})()
