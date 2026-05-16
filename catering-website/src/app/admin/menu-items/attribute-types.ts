import type { AdminAttributeType } from "@/lib/admin-api";

/**
 * Attribute types surfaced on menu item editor & list filters.
 * Omits backend enums that are rarely needed per dish (audience, counter type, season, etc.).
 */
export const MENU_ITEM_RELEVANT_TYPES: readonly AdminAttributeType[] = [
  "dietary",
  "cuisine",
  "meal_time",
  "course",
  "food_category",
  "spice",
  "service",
];

/** Exactly one option allowed from this type (e.g. veg vs non-veg vs Jain). */
export const MENU_ITEM_SINGLE_SELECT_TYPES = new Set<AdminAttributeType>(["dietary"]);

const TITLES: Record<AdminAttributeType, string> = {
  audience: "Audience",
  beverage_type: "Beverage type",
  counter_type: "Counter type",
  course: "Course",
  cuisine: "Cuisine",
  dietary: "Dietary",
  event: "Event",
  food_category: "Food category",
  meal_time: "Meal time",
  package_type: "Package type",
  portion: "Portion size",
  preparation: "Preparation style",
  recommendation: "Recommendation",
  season: "Season",
  service: "Service style",
  spice: "Spice level",
  temperature: "Serving temperature",
};

export function menuItemAttributeTypeTitle(type: AdminAttributeType): string {
  return TITLES[type] ?? type;
}
