import type { Icon } from "@phosphor-icons/react";
import {
  BowlFood,
  Buildings,
  Cake,
  Coffee,
  Confetti,
  CookingPot,
  Fire,
  Hamburger,
  Handshake,
  Martini,
  Plant,
  Star,
} from "@phosphor-icons/react";

const ICON_BY_KEY: Record<string, Icon> = {
  "bowl-food": BowlFood,
  cake: Cake,
  buildings: Buildings,
  martini: Martini,
  plant: Plant,
  hamburger: Hamburger,
  confetti: Confetti,
  fire: Fire,
  coffee: Coffee,
  "cooking-pot": CookingPot,
  handshake: Handshake,
  star: Star,
};

export function getServiceCategoryIcon(iconKey: string): Icon {
  return ICON_BY_KEY[iconKey] ?? BowlFood;
}

export const SERVICE_CATEGORY_ICON_OPTIONS = Object.keys(ICON_BY_KEY);

/** Strip `group-hover:*` — those must be applied via {@link getCategoryIconHoverClasses} so Tailwind emits them. */
export function getCategoryIconWrapBase(iconWrapClass: string): string {
  return iconWrapClass
    .split(/\s+/)
    .filter((c) => c && !c.startsWith("group-hover:"))
    .join(" ");
}

const ICON_HOVER_BY_ACCENT: { match: string; hover: string }[] = [
  { match: "text-brand-red", hover: "group-hover:bg-brand-red group-hover:text-white" },
  { match: "text-brand-green", hover: "group-hover:bg-brand-green group-hover:text-white" },
  { match: "text-brand-yellow", hover: "group-hover:bg-brand-yellow group-hover:text-white" },
  { match: "text-blue-500", hover: "group-hover:bg-blue-500 group-hover:text-white" },
  { match: "text-purple-500", hover: "group-hover:bg-purple-500 group-hover:text-white" },
  { match: "text-orange-500", hover: "group-hover:bg-orange-500 group-hover:text-white" },
  { match: "text-teal-500", hover: "group-hover:bg-teal-500 group-hover:text-white" },
];

/** Static hover classes for category icon circles (paired with base from DB). */
export function getCategoryIconHoverClasses(iconWrapClass: string): string {
  for (const { match, hover } of ICON_HOVER_BY_ACCENT) {
    if (iconWrapClass.includes(match)) return hover;
  }
  return "group-hover:bg-brand-red group-hover:text-white";
}
