export type DefaultPlanSeed = {
  code: 'essential' | 'growth' | 'premier';
  priceDisplay: string;
  icon: string;
  isRecommended: boolean;
  isDarkTheme: boolean;
  displayOrder: number;
  contactTopic: string;
  name: string;
  subtitle: string;
  periodLabel: string;
  ctaLabel: string;
  features: string[];
};

export type DefaultComparisonRowSeed = {
  sortOrder: number;
  label: string;
  essentialValue: string;
  growthValue: string;
  premierValue: string;
};

export const DEFAULT_PACKAGES_PAGE_EN = {
  heroEyebrow: 'For caterers & brands',
  heroTitle: 'Catering listing packages',
  heroSubtitle:
    'On a busy marketplace, a basic profile is rarely enough. These plans stack visibility, trust signals, and enquiry features so serious hosts can find you faster on Bharat Catering.',
  valueTitle: 'Which tier is usually the best value?',
  valueBody:
    'Our three-step ladder (Essential / Growth / Premier) follows a familiar pattern: entry covers “be findable,” Growth adds homepage or social exposure and stronger enquiry treatment, Premier adds SEO-friendly backlinks and PR-style placement. For most regional kitchens, Growth tends to be the sweet spot between cost and lead quality; choose Premier when you are scaling multi-city or competing for high-ticket weddings and corporate RFPs. Final mix should match your margin and enquiry volume — we are happy to advise.',
  discoverTitle: 'Discover our listing plans',
  discoverSubtitle:
    'Pick the depth of exposure that matches how aggressively you want to grow on Bharat Catering. Annual fees below are indicative — confirm current rates and inclusions with our team before purchase.',
  comparisonTitle: 'At-a-glance comparison',
  comparisonHint:
    'Exact quotas can change — use this table to brief our sales team.',
  featureColumnLabel: 'Feature',
  tierEssentialLabel: 'Essential',
  tierGrowthLabel: 'Growth',
  tierPremierLabel: 'Premier',
  recommendedBadge: 'Recommended for growth',
  audienceTitle: 'Who sees your listing?',
  audienceSubtitle:
    'Hosts on Bharat Catering search by occasion and city — the same demand patterns directories optimise for across weddings, corporates, and home celebrations.',
  audienceTags: [
    'Wedding & marriage catering',
    'Birthday & party catering',
    'Corporate & office catering',
    'Buffet & large-format events',
    'Home & intimate catering',
    'Outdoor & venue catering',
  ],
  helpTitle: 'Need a hand choosing?',
  helpBody:
    'Tell us your city mix, average ticket size, and whether you chase weddings, corporates, or both. We will map you to the leanest plan that still hits your lead goals.',
  browseDirectoryLabel: 'See how hosts browse the directory',
  disclaimerText:
    'Annual fees and feature limits above are indicative. Final pricing and inclusions are confirmed with our team at contract time.',
};

export const DEFAULT_LISTING_PLANS_EN: DefaultPlanSeed[] = [
  {
    code: 'essential',
    priceDisplay: '₹9,999',
    icon: 'medal',
    isRecommended: false,
    isDarkTheme: false,
    displayOrder: 1,
    contactTopic: 'Directory Essential',
    name: 'Directory Essential',
    subtitle: 'Bronze-style entry',
    periodLabel: '/ year (indicative)',
    ctaLabel: 'Enquire for Essential',
    features: [
      'Live listing in marketplace search',
      'Core business profile & categories',
      'Up to 6 gallery images',
      'Standard enquiry handling',
      'Essential trust badge on profile',
    ],
  },
  {
    code: 'growth',
    priceDisplay: '₹14,999',
    icon: 'storefront',
    isRecommended: true,
    isDarkTheme: false,
    displayOrder: 2,
    contactTopic: 'Directory Growth',
    name: 'Directory Growth',
    subtitle: 'Silver-style — most kitchens start here',
    periodLabel: '/ year (indicative)',
    ctaLabel: 'Enquire for Growth',
    features: [
      'Everything in Essential',
      'Elevated enquiry priority',
      'Expanded gallery (up to 18 images)',
      'Rotating homepage / collection spotlight',
      'Nofollow website link + quarterly social highlight',
      'Growth badge & lighter SEO pass on copy',
    ],
  },
  {
    code: 'premier',
    priceDisplay: '₹24,999',
    icon: 'crown',
    isRecommended: false,
    isDarkTheme: true,
    displayOrder: 3,
    contactTopic: 'Directory Premier',
    name: 'Directory Premier',
    subtitle: 'Gold-style maximum visibility',
    periodLabel: '/ year (indicative)',
    ctaLabel: 'Enquire for Premier',
    features: [
      'Everything in Growth',
      'Highest enquiry routing priority',
      'Higher gallery cap for full menus & events',
      'Dofollow website link for SEO value',
      'Monthly social spotlight + PR / editorial slot',
      'Premier badge & full SEO profile review',
    ],
  },
];

export const DEFAULT_COMPARISON_ROWS_EN: DefaultComparisonRowSeed[] = [
  {
    sortOrder: 1,
    label: 'Directory listing (search & filters)',
    essentialValue: 'true',
    growthValue: 'true',
    premierValue: 'true',
  },
  {
    sortOrder: 2,
    label: 'Profile: story, services, service areas',
    essentialValue: 'true',
    growthValue: 'true',
    premierValue: 'true',
  },
  {
    sortOrder: 3,
    label: 'Gallery images (published)',
    essentialValue: 'Up to 6',
    growthValue: 'Up to 18',
    premierValue: 'Higher limit',
  },
  {
    sortOrder: 4,
    label: 'Enquiry priority in inbox / routing',
    essentialValue: 'Standard',
    growthValue: 'Elevated',
    premierValue: 'Highest',
  },
  {
    sortOrder: 5,
    label: 'Homepage or collection spotlight',
    essentialValue: 'false',
    growthValue: 'Rotating',
    premierValue: 'Priority',
  },
  {
    sortOrder: 6,
    label: 'Website link from profile',
    essentialValue: 'false',
    growthValue: 'Nofollow',
    premierValue: 'Dofollow (SEO)',
  },
  {
    sortOrder: 7,
    label: 'Social highlight (owned channels)',
    essentialValue: 'false',
    growthValue: 'Quarterly',
    premierValue: 'Monthly',
  },
  {
    sortOrder: 8,
    label: 'Editorial / PR mention or guest slot',
    essentialValue: 'false',
    growthValue: 'Optional add-on',
    premierValue: 'Included',
  },
  {
    sortOrder: 9,
    label: 'Listing badge tier',
    essentialValue: 'Essential',
    growthValue: 'Growth',
    premierValue: 'Premier',
  },
  {
    sortOrder: 10,
    label: 'Profile SEO & copy review',
    essentialValue: 'false',
    growthValue: 'Light',
    premierValue: 'Full pass',
  },
];
