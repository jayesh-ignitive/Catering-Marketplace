import { Injectable } from '@nestjs/common';
import {
  PublicServiceCategory,
  ServiceCategoriesService,
} from '../marketplace/service-categories.service';

export type City = { id: string; name: string; slug: string };
export type ServiceCategory = PublicServiceCategory;
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
  constructor(private readonly serviceCategories: ServiceCategoriesService) {}

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

  getServiceCategories(): Promise<ServiceCategory[]> {
    return this.serviceCategories.listPublicActive();
  }

  getStats(): TrustStats {
    return {
      verifiedReviews: 8000,
      cateringServicesListed: 4000,
      researchArticles: 300,
      customersHelped: 10000,
    };
  }

  async search(
    cityId?: string,
    categoryId?: string,
  ): Promise<{
    caterers: CatererListing[];
    city?: City;
    category?: ServiceCategory;
  }> {
    const c = cityId?.trim() || undefined;
    const cat = categoryId?.trim() || undefined;

    let caterers = [...this.listings];
    if (c) {
      caterers = caterers.filter((l) => l.cityId === c);
    }
    if (cat) {
      caterers = caterers.filter((l) => l.categoryId === cat);
    }

    const city = c ? this.cities.find((x) => x.id === c) : undefined;
    const categories = await this.serviceCategories.listPublicActive();
    const category = cat
      ? categories.find((x) => x.id === cat || x.code === cat)
      : undefined;

    return { caterers, city, category };
  }
}
