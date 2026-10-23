/**
 * Versión del estado que se guarda en el navegador.
 *
 * Se sube cuando un cambio de datos necesita ejecutar la migración aunque el
 * usuario ya tenga una versión anterior guardada. Zustand solo llama a
 * `migrate` cuando cambia este número.
 *
 * v9: catálogo ampliado a 78 productos. Fuerza la mezcla de los productos de
 * fábrica en instalaciones que se quedaron con la lista inicial de 8.
 */
export const PERSIST_VERSION = 9
