import { Injectable } from '@nestjs/common';

export type City = { id: string; name: string; slug: string };
export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
};
export type TrustStats = {
  verifiedReviews: number;
  cateringServicesListed: number;
  researchArticles: number;
  customersHelped: number;
};
export type CatererListing = {
  id: string;
  name: string;
  cityId: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  priceHint: string;
  specialties: string[];
};

@Injectable()
export class CatalogService {
  private readonly cities: City[] = [
    { id: '1', name: 'Mumbai', slug: 'mumbai' },
    { id: '2', name: 'Delhi', slug: 'delhi' },
    { id: '3', name: 'Bangalore', slug: 'bangalore' },
    { id: '4', name: 'Hyderabad', slug: 'hyderabad' },
    { id: '5', name: 'Ahmedabad', slug: 'ahmedabad' },
    { id: '6', name: 'Chennai', slug: 'chennai' },
    { id: '7', name: 'Kolkata', slug: 'kolkata' },
    { id: '8', name: 'Pune', slug: 'pune' },
    { id: '9', name: 'Surat', slug: 'surat' },
    { id: '10', name: 'Jaipur', slug: 'jaipur' },
  ];

  private readonly categories: ServiceCategory[] = [
    {
      id: 'c1',
      name: 'Marriage & Wedding Catering',
      slug: 'marriage-wedding-catering',
      shortDescription: 'Full-service wedding menus, live counters, and buffet setups.',
    },
    {
      id: 'c2',
      name: 'Birthday Party Catering',
      slug: 'birthday-party-catering',
      shortDescription: 'Kid-friendly spreads, snacks, and celebration cakes.',
    },
    {
      id: 'c3',
      name: 'Corporate & Office Catering',
      slug: 'corporate-office-catering',
      shortDescription: 'Box lunches, working lunches, and large team events.',
    },
    {
      id: 'c4',
      name: 'Buffet Catering',
      slug: 'buffet-catering',
      shortDescription: 'Multi-cuisine buffets with service staff.',
    },
    {
      id: 'c5',
      name: 'Outdoor Catering',
      slug: 'outdoor-catering',
      shortDescription: 'Tents, grills, and on-location kitchen support.',
    },
    {
      id: 'c6',
      name: 'Home Catering',
      slug: 'home-catering',
      shortDescription: 'Intimate gatherings at your residence.',
    },
    {
      id: 'c7',
      name: 'Engagement Catering',
      slug: 'engagement-catering',
      shortDescription: 'Ring ceremonies and family functions.',
    },
    {
      id: 'c8',
      name: 'BBQ & Live Grill',
      slug: 'bbq-catering',
      shortDescription: 'Live grills, skewers, and outdoor dining.',
    },
  ];

  private readonly listings: CatererListing[] = [
    {
      id: 'l1',
      name: 'Royal Spice Kitchens',
      cityId: '1',
      categoryId: 'c1',
      rating: 4.8,
      reviewCount: 126,
      priceHint: 'From ₹450 / plate',
      specialties: ['North Indian', 'Jain options'],
    },
    {
      id: 'l2',
      name: 'Coastal Flame Catering',
      cityId: '1',
      categoryId: 'c4',
      rating: 4.6,
      reviewCount: 89,
      priceHint: 'From ₹550 / plate',
      specialties: ['Seafood', 'South Indian'],
    },
    {
      id: 'l3',
      name: 'Capital Feast Co.',
      cityId: '2',
      categoryId: 'c3',
      rating: 4.9,
      reviewCount: 210,
      priceHint: 'From ₹400 / plate',
      specialties: ['Continental', 'High tea'],
    },
    {
      id: 'l4',
      name: 'Garden Grove Caterers',
      cityId: '3',
      categoryId: 'c5',
      rating: 4.7,
      reviewCount: 54,
      priceHint: 'Custom quote',
      specialties: ['BBQ', 'Live counters'],
    },
    {
      id: 'l5',
      name: 'Celebration Bites',
      cityId: '8',
      categoryId: 'c2',
      rating: 4.5,
      reviewCount: 72,
      priceHint: 'From ₹350 / plate',
      specialties: ['Snacks', 'Dessert tables'],
    },
  ];

  getCities(): City[] {
    return this.cities;
  }

  getServiceCategories(): ServiceCategory[] {
    return this.categories;
  }

  getStats(): TrustStats {
    return {
      verifiedReviews: 8000,
      cateringServicesListed: 4000,
      researchArticles: 300,
      customersHelped: 10000,
    };
  }

  search(cityId?: string, categoryId?: string): {
    caterers: CatererListing[];
    city?: City;
    category?: ServiceCategory;
  } {
    if (!cityId || !categoryId) {
      return { caterers: [] };
    }
    const city = this.cities.find((c) => c.id === cityId);
    const category = this.categories.find((c) => c.id === categoryId);
    const caterers = this.listings.filter(
      (l) => l.cityId === cityId && l.categoryId === categoryId,
    );
    return { caterers, city, category };
  }
}
