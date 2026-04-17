/**
 * Қазақ әріптері үшін пресет кілті (SVG бет координаталары бас әріпке бапталған).
 * Дисплейдегі ch өзгермейді, тек eye/mouth шиеленісуі үшін қолданылады.
 */
export function letterPresetKey(ch: string): string {
  if (ch.length !== 1) return ch;
  try {
    return ch.toLocaleUpperCase("kk-KZ");
  } catch {
    return ch.toUpperCase();
  }
}
