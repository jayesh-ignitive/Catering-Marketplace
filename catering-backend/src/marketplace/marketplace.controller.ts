import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateCatererReviewDto } from './dto/create-caterer-review.dto';
import { KeywordSuggestQueryDto } from './dto/keyword-suggest-query.dto';
import { ListCatererReviewsQueryDto } from './dto/list-caterer-reviews-query.dto';
import { ListMarketplaceQueryDto } from './dto/list-marketplace-query.dto';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  /** Distinct cities for filter dropdowns (published listings only). */
  @Get('caterers/cities')
  listCities() {
    return this.marketplace.listCities();
  }

  /** Autocomplete: keyword labels/slugs used by published caterers (prefix / contains on small set). */
  @Get('caterers/keywords/suggest')
  suggestKeywords(@Query() query: KeywordSuggestQueryDto) {
    return this.marketplace.suggestPublishedKeywords(query.q ?? '');
  }

  /** Distinct search keywords used by published caterers (optional bulk list). */
  @Get('caterers/keywords')
  listKeywordFilters() {
    return this.marketplace.listPublishedKeywordFilters();
  }

  @Get('caterers')
  listCaterers(@Query() query: ListMarketplaceQueryDto) {
    return this.marketplace.listPublished(query);
  }

  @Get('caterers/:slug/reviews')
  listCatererReviews(@Param('slug') slug: string, @Query() query: ListCatererReviewsQueryDto) {
    return this.marketplace.listReviewsForSlug(slug, query);
  }

  @Post('caterers/:slug/reviews')
  createCatererReview(@Param('slug') slug: string, @Body() body: CreateCatererReviewDto) {
    return this.marketplace.createReviewForSlug(slug, body);
  }

  @Get('caterers/:slug')
  catererDetail(@Param('slug') slug: string) {
    return this.marketplace.getByProfileSlug(slug);
  }

  @Get('stats')
  async stats() {
    const caterersListed = await this.marketplace.publishedCount();
    return { caterersListed };
  }
}
