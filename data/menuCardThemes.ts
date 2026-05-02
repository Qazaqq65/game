/**
 * Меню карточкалары — бір түсті жалаңаш фон (градиентсіз).
 */
export type MenuCardToneCss = {
  surface: string;
  border: string;
  glow: string;
  accent: string;
  emojiShadow: string;
};

export const MENU_CARD_TONES: MenuCardToneCss[] = [
  {
    surface: "color-mix(in srgb, #3db3e8 24%, #fffefb)",
    border: "color-mix(in srgb, #2a9fd4 32%, rgba(90, 70, 55, 0.1))",
    glow: "rgba(45, 160, 220, 0.22)",
    accent: "#1e8fc4",
    emojiShadow:
      "drop-shadow(0 3px 6px rgba(30, 130, 190, 0.22)) drop-shadow(0 1px 0 rgba(255,255,255,0.5))",
  },
  {
    surface: "color-mix(in srgb, #ff8a76 23%, #fffefb)",
    border: "color-mix(in srgb, #e85d48 30%, rgba(90, 70, 55, 0.1))",
    glow: "rgba(240, 110, 90, 0.22)",
    accent: "#d84a38",
    emojiShadow:
      "drop-shadow(0 3px 6px rgba(200, 80, 65, 0.2)) drop-shadow(0 1px 0 rgba(255,255,255,0.45))",
  },
  {
    surface: "color-mix(in srgb, #52d88c 20%, #fffefb)",
    border: "color-mix(in srgb, #2eb86e 30%, rgba(90, 70, 55, 0.09))",
    glow: "rgba(60, 195, 120, 0.2)",
    accent: "#179e5c",
    emojiShadow:
      "drop-shadow(0 3px 6px rgba(40, 150, 95, 0.2)) drop-shadow(0 1px 0 rgba(255,255,255,0.5))",
  },
  {
    surface: "color-mix(in srgb, #b894ff 22%, #fffefb)",
    border: "color-mix(in srgb, #8f6ae8 30%, rgba(90, 70, 55, 0.09))",
    glow: "rgba(140, 100, 230, 0.2)",
    accent: "#6b4ec9",
    emojiShadow:
      "drop-shadow(0 3px 6px rgba(100, 70, 180, 0.2)) drop-shadow(0 1px 0 rgba(255,255,255,0.45))",
  },
  {
    surface: "color-mix(in srgb, #6eb8ff 22%, #fffefb)",
    border: "color-mix(in srgb, #3d8eef 30%, rgba(90, 70, 55, 0.09))",
    glow: "rgba(80, 150, 245, 0.2)",
    accent: "#2178e0",
    emojiShadow:
      "drop-shadow(0 3px 6px rgba(50, 120, 210, 0.2)) drop-shadow(0 1px 0 rgba(255,255,255,0.5))",
  },
];

export function menuToneIndexForLetterCard(
  letterKey: string,
  cardIndex: number
): number {
  if (letterKey === "А") return 1;
  if (letterKey === "Ә") return 3;
  if (letterKey === "Б") return 2;
  return cardIndex % MENU_CARD_TONES.length;
}

export function menuToneIndexForDigitCard(levelNumber: number | undefined): number {
  if (levelNumber == null || levelNumber < 1) return 0;
  return Math.min(MENU_CARD_TONES.length - 1, levelNumber - 1);
}
