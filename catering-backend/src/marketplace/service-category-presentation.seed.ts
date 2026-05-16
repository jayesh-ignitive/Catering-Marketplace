/** Default presentation for marketplace service categories (c1–c8). */
export type ServiceCategoryPresentationSeed = {
  code: string;
  iconKey: string;
  borderClass: string;
  iconWrapClass: string;
  titleHoverClass: string;
  displayOrder: number;
};

export const SERVICE_CATEGORY_PRESENTATION_SEED: ServiceCategoryPresentationSeed[] =
  [
    {
      code: 'c1',
      iconKey: 'bowl-food',
      borderClass: 'border-brand-red',
      iconWrapClass:
        'bg-red-50 text-brand-red group-hover:bg-brand-red group-hover:text-white',
      titleHoverClass: 'group-hover:text-brand-red',
      displayOrder: 1,
    },
    {
      code: 'c2',
      iconKey: 'cake',
      borderClass: 'border-brand-green',
      iconWrapClass:
        'bg-green-50 text-brand-green group-hover:bg-brand-green group-hover:text-white',
      titleHoverClass: 'group-hover:text-brand-green',
      displayOrder: 2,
    },
    {
      code: 'c3',
      iconKey: 'buildings',
      borderClass: 'border-brand-yellow',
      iconWrapClass:
        'bg-yellow-50 text-brand-yellow group-hover:bg-brand-yellow group-hover:text-white',
      titleHoverClass: 'group-hover:text-brand-yellow',
      displayOrder: 3,
    },
    {
      code: 'c4',
      iconKey: 'martini',
      borderClass: 'border-blue-500',
      iconWrapClass:
        'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white',
      titleHoverClass: 'group-hover:text-blue-500',
      displayOrder: 4,
    },
    {
      code: 'c5',
      iconKey: 'plant',
      borderClass: 'border-purple-500',
      iconWrapClass:
        'bg-purple-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white',
      titleHoverClass: 'group-hover:text-purple-500',
      displayOrder: 5,
    },
    {
      code: 'c6',
      iconKey: 'hamburger',
      borderClass: 'border-orange-500',
      iconWrapClass:
        'bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white',
      titleHoverClass: 'group-hover:text-orange-500',
      displayOrder: 6,
    },
    {
      code: 'c7',
      iconKey: 'confetti',
      borderClass: 'border-brand-red',
      iconWrapClass:
        'bg-red-50 text-brand-red group-hover:bg-brand-red group-hover:text-white',
      titleHoverClass: 'group-hover:text-brand-red',
      displayOrder: 7,
    },
    {
      code: 'c8',
      iconKey: 'fire',
      borderClass: 'border-teal-500',
      iconWrapClass:
        'bg-teal-50 text-teal-500 group-hover:bg-teal-500 group-hover:text-white',
      titleHoverClass: 'group-hover:text-teal-500',
      displayOrder: 8,
    },
  ];

export const SERVICE_CATEGORY_ICON_KEYS = [
  'bowl-food',
  'cake',
  'buildings',
  'martini',
  'plant',
  'hamburger',
  'confetti',
  'fire',
  'coffee',
  'cooking-pot',
  'handshake',
  'star',
] as const;
