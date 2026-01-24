/**
 * ElectronClassManager
 * Agrega la clase 'electron' al elemento HTML cuando está en Electron
 * Esto permite aplicar estilos CSS específicos para Electron
 */

'use client';

import { useEffect } from 'react';
import { useElectron } from '@/shared/hooks/useElectron';

export function ElectronClassManager() {
  const { isElectron } = useElectron();

  useEffect(() => {
    if (isElectron) {
      document.documentElement.classList.add('electron');
    } else {
      document.documentElement.classList.remove('electron');
    }

    return () => {
      document.documentElement.classList.remove('electron');
    };
  }, [isElectron]);

  return null;
}
