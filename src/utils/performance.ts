/**
 * Utilidades para optimización de rendimiento
 * Evita reprocesamientos forzados agrupando lecturas/escrituras del DOM
 */

/**
 * Agrupa múltiples actualizaciones de estado para evitar múltiples re-renders
 */
export function batchStateUpdates<T>(
  updates: Array<() => void>,
  callback?: () => void
): void {
  // Usar requestAnimationFrame para agrupar actualizaciones
  requestAnimationFrame(() => {
    updates.forEach(update => update());
    if (callback) {
      requestAnimationFrame(callback);
    }
  });
}

/**
 * Debounce para evitar cálculos excesivos
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle para limitar la frecuencia de ejecución
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Agrupa lecturas del DOM para evitar reprocesamientos forzados
 */
export function batchDOMReads<T>(
  reads: Array<() => T>
): T[] {
  // Forzar un layout antes de leer
  // Esto agrupa todas las lecturas en un solo reflow
  const results: T[] = [];
  
  // Leer todas las propiedades en un solo batch
  for (const read of reads) {
    results.push(read());
  }
  
  return results;
}

/**
 * Agrupa escrituras del DOM para evitar múltiples reflows
 */
export function batchDOMWrites(
  writes: Array<() => void>
): void {
  // Usar requestAnimationFrame para agrupar escrituras
  requestAnimationFrame(() => {
    writes.forEach(write => write());
  });
}


