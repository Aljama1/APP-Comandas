/**
 * Interfaz para manejar textos traducibles desde el backend.
 * Permite que un campo tenga múltiples versiones de idioma.
 */
export interface LocalizedString {
  es: string;
  en: string;
  // Se pueden añadir más idiomas aquí: [key: string]: string;
}

/**
 * Tipo utilidad para campos que pueden ser o un string simple (legacy)
 * o un objeto traducido (escalable).
 */
export type Translatable = string | LocalizedString;

/**
 * Función de utilidad para extraer el texto correcto basado en el idioma.
 * @param field El campo traducible.
 * @param lang El idioma actual (ej: 'es', 'en').
 * @returns El string correspondiente o el valor por defecto.
 */
export function getTranslation(field: Translatable | undefined, lang: string = 'es'): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang as keyof LocalizedString] || field['es'] || '';
}

/**
 * Compara dos campos traducibles para ver si son equivalentes.
 */
export function areTranslatableEqual(a: Translatable | undefined, b: Translatable | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}
