/**
 * Hook para gestionar ventanas múltiples
 */
export function useWindows() {
  /**
   * Verificar si estamos en Electron
   */
  const isElectronAvailable = (): boolean => {
    return typeof window !== 'undefined' &&
           'electronAPI' in window &&
           window.electronAPI?.window?.createNew !== undefined;
  };

  /**
   * Abrir nueva ventana POS
   */
  const openNewPOSWindow = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isElectronAvailable()) {
        // En modo web, abrir en nueva pestaña
        window.open('/pos', '_blank');
        return { success: true };
      }

      // En Electron, crear nueva ventana nativa
      const result = await window.electronAPI.window.createNew();

      if (!result.success) {
        throw new Error(result.error || 'Error al crear ventana');
      }

      return { success: true };
    } catch (error: any) {
      console.error('[Windows] Error:', error);
      return {
        success: false,
        error: error.message || 'Error al abrir ventana'
      };
    }
  };

  return {
    openNewPOSWindow,
    isElectronAvailable: isElectronAvailable(),
  };
}
