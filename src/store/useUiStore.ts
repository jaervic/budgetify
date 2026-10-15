import { create } from 'zustand'

interface UiState {
  /**
   * Hay un PDF generándose (descargar, imprimir, ver o compartir). Vive en el
   * store y no en un `useState` del hook porque la barra lateral, la barra de
   * móvil y el botón de vista previa son tres instancias distintas: sin esto,
   * pulsar "Descargar PDF" en una no desactivaba las de la otra y se podían
   * lanzar dos generaciones a la vez.
   */
  pdfBusy: boolean
  setPdfBusy: (busy: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  pdfBusy: false,
  setPdfBusy: (pdfBusy) => set({ pdfBusy }),
}))
