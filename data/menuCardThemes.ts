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

/** Әріптер меню: Алма — қызыл, Ара — сары (арнайы). */
export const MENU_LETTER_TONE_ALMA: MenuCardToneCss = {
  surface: MENU_CARD_SURFACE,
  border: "color-mix(in srgb, #dc2626 34%, rgba(90, 70, 55, 0.12))",
  glow: MENU_CARD_SHADOW_NEUTRAL,
  accent: "#dc2626",
  emojiShadow: "drop-shadow(0 2px 8px rgba(220, 38, 38, 0.38))",
};

export const MENU_LETTER_TONE_ARA: MenuCardToneCss = {
  surface: MENU_CARD_SURFACE,
  border: "color-mix(in srgb, #ca8a04 32%, rgba(90, 70, 55, 0.11))",
  glow: MENU_CARD_SHADOW_NEUTRAL,
  accent: "#ca8a04",
  emojiShadow: "drop-shadow(0 2px 8px rgba(202, 138, 4, 0.36))",
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
  /* 0-інші тонмен екі көк болып кетпесін — 5-деңгей (азайту) жылы қызғылт-сары */
  {
    surface: MENU_CARD_SURFACE,
    border: "color-mix(in srgb, #ea580c 26%, rgba(90, 70, 55, 0.1))",
    glow: MENU_CARD_SHADOW_NEUTRAL,
    accent: "#c2410c",
    emojiShadow: "drop-shadow(0 2px 5px rgba(200, 95, 35, 0.2))",
  },
];

export function menuToneIndexForLetterCard(
  letterKey: string,
  cardIndex: number
): number {
  /* «А» топтасында бірнеше сөз (Алма, Ара, …) — әр карта өз реңкі; бұрын барлығы 1-ші тонда болды. */
  if (letterKey === "Ә") return 3;
  if (letterKey === "Б") return 2;
  return cardIndex % MENU_CARD_TONES.length;
}

export function menuToneIndexForDigitCard(levelNumber: number | undefined): number {
  if (levelNumber == null || levelNumber < 1) return 0;
  return (levelNumber - 1) % MENU_CARD_TONES.length;
}
