/**
 * Меню карточкалары: фон = EntryMenu --entry-menu-bg (негізгі фонмен бірдей).
 * Glow нейтралды — карта астындағы түсті дақ калдырмайды.
 */
const MENU_CARD_SURFACE = "var(--entry-menu-bg)";
const MENU_CARD_SHADOW_NEUTRAL = "rgba(75, 58, 45, 0.08)";

export type MenuCardToneCss = {
  surface: string;
  border: string;
  glow: string;
  accent: string;
  emojiShadow: string;
};

export const MENU_CARD_TONES: MenuCardToneCss[] = [
  {
    surface: MENU_CARD_SURFACE,
    border: "color-mix(in srgb, #2a9fd4 26%, rgba(90, 70, 55, 0.11))",
    glow: MENU_CARD_SHADOW_NEUTRAL,
    accent: "#1e8fc4",
    emojiShadow: "drop-shadow(0 2px 5px rgba(30, 130, 190, 0.18))",
  },
  {
    surface: MENU_CARD_SURFACE,
    border: "color-mix(in srgb, #e85d48 26%, rgba(90, 70, 55, 0.11))",
    glow: MENU_CARD_SHADOW_NEUTRAL,
    accent: "#d84a38",
    emojiShadow: "drop-shadow(0 2px 5px rgba(200, 80, 65, 0.16))",
  },
  {
    surface: MENU_CARD_SURFACE,
    border: "color-mix(in srgb, #2eb86e 26%, rgba(90, 70, 55, 0.1))",
    glow: MENU_CARD_SHADOW_NEUTRAL,
    accent: "#179e5c",
    emojiShadow: "drop-shadow(0 2px 5px rgba(40, 150, 95, 0.16))",
  },
  {
    surface: MENU_CARD_SURFACE,
    border: "color-mix(in srgb, #8f6ae8 26%, rgba(90, 70, 55, 0.1))",
    glow: MENU_CARD_SHADOW_NEUTRAL,
    accent: "#6b4ec9",
    emojiShadow: "drop-shadow(0 2px 5px rgba(100, 70, 180, 0.16))",
  },
  {
    surface: MENU_CARD_SURFACE,
    border: "color-mix(in srgb, #3d8eef 26%, rgba(90, 70, 55, 0.1))",
    glow: MENU_CARD_SHADOW_NEUTRAL,
    accent: "#2178e0",
    emojiShadow: "drop-shadow(0 2px 5px rgba(50, 120, 210, 0.16))",
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
