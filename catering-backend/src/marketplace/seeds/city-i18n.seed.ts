/** Hindi + Gujarati city names (keyed by URL slug). */

export type CityLocaleCopy = { name: string };

export type CityI18nRow = {
  slug: string;
  hi: CityLocaleCopy;
  gu: CityLocaleCopy;
};

export const CITY_I18N: readonly CityI18nRow[] = [
  { slug: 'mumbai', hi: { name: 'मुंबई' }, gu: { name: 'મુંબઈ' } },
  { slug: 'delhi', hi: { name: 'दिल्ली' }, gu: { name: 'દિલ્હી' } },
  { slug: 'bangalore', hi: { name: 'बेंगलुरु' }, gu: { name: 'બેંગલોર' } },
  { slug: 'hyderabad', hi: { name: 'हैदराबाद' }, gu: { name: 'હૈદરાબાદ' } },
  { slug: 'ahmedabad', hi: { name: 'अहमदाबाद' }, gu: { name: 'અમદાવાદ' } },
  { slug: 'chennai', hi: { name: 'चेन्नई' }, gu: { name: 'ચેન્નઈ' } },
  { slug: 'kolkata', hi: { name: 'कोलकाता' }, gu: { name: 'કોલકાતા' } },
  { slug: 'pune', hi: { name: 'पुणे' }, gu: { name: 'પુણે' } },
  { slug: 'surat', hi: { name: 'सूरत' }, gu: { name: 'સુરત' } },
  { slug: 'jaipur', hi: { name: 'जयपुर' }, gu: { name: 'જયપુર' } },
];

/** Major cities for catalog / home hero (English). */
export const CATALOG_CITY_SEED: ReadonlyArray<{
  legacyCatalogId: string;
  slug: string;
  name: string;
  stateName: string;
  displayOrder: number;
}> = [
  { legacyCatalogId: '1', slug: 'mumbai', name: 'Mumbai', stateName: 'Maharashtra', displayOrder: 1 },
  { legacyCatalogId: '2', slug: 'delhi', name: 'Delhi', stateName: 'Delhi', displayOrder: 2 },
  { legacyCatalogId: '3', slug: 'bangalore', name: 'Bangalore', stateName: 'Karnataka', displayOrder: 3 },
  { legacyCatalogId: '4', slug: 'hyderabad', name: 'Hyderabad', stateName: 'Telangana', displayOrder: 4 },
  { legacyCatalogId: '5', slug: 'ahmedabad', name: 'Ahmedabad', stateName: 'Gujarat', displayOrder: 5 },
  { legacyCatalogId: '6', slug: 'chennai', name: 'Chennai', stateName: 'Tamil Nadu', displayOrder: 6 },
  { legacyCatalogId: '7', slug: 'kolkata', name: 'Kolkata', stateName: 'West Bengal', displayOrder: 7 },
  { legacyCatalogId: '8', slug: 'pune', name: 'Pune', stateName: 'Maharashtra', displayOrder: 8 },
  { legacyCatalogId: '9', slug: 'surat', name: 'Surat', stateName: 'Gujarat', displayOrder: 9 },
  { legacyCatalogId: '10', slug: 'jaipur', name: 'Jaipur', stateName: 'Rajasthan', displayOrder: 10 },
];
