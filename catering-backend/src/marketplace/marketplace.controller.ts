import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCatererReviewDto } from './dto/create-caterer-review.dto';
import { KeywordSuggestQueryDto } from './dto/keyword-suggest-query.dto';
import { ListCatererReviewsQueryDto } from './dto/list-caterer-reviews-query.dto';
import { ListMarketplaceQueryDto } from './dto/list-marketplace-query.dto';
import { UpsertCatererWorkspaceProfileDto } from './dto/upsert-caterer-workspace-profile.dto';
import { WorkspaceProfileStep0Dto } from './dto/workspace-profile-step-0.dto';
import { WorkspaceProfileStep1Dto } from './dto/workspace-profile-step-1.dto';
import { WorkspaceProfileStep2Dto } from './dto/workspace-profile-step-2.dto';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  /** Distinct cities for filter dropdowns (published listings only). */
  @Get('caterers/cities')
  listCities() {
    return this.marketplace.listCities();
  }

  @Get('cities')
  listWorkspaceCities() {
    return this.marketplace.listAllCitiesForWorkspace();
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

  @Get('service-offerings')
  listServiceOfferings() {
    return this.marketplace.listServiceOfferings();
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

  @Get('caterer/profile')
  @UseGuards(JwtAuthGuard)
  workspaceProfile(@Req() req: Request & { user: User }) {
    if (req.user.role !== UserRole.CATERER) {
      throw new ForbiddenException('Workspace profile is only available for caterer accounts');
    }
    return this.marketplace.getWorkspaceProfileForUser(req.user.id);
  }

  /** Wizard step 0 — business basics (city, about, pricing fields, optional banner URL). */
  @Patch('caterer/profile/step/0')
  @UseGuards(JwtAuthGuard)
  patchWorkspaceProfileStep0(@Req() req: Request & { user: User }, @Body() body: WorkspaceProfileStep0Dto) {
    if (req.user.role !== UserRole.CATERER) {
      throw new ForbiddenException('Workspace profile is only available for caterer accounts');
    }
    return this.marketplace.patchWorkspaceProfileStep0ForUser(req.user.id, body);
  }

  /** Wizard step 1 — categories, service offerings, keywords. */
  @Patch('caterer/profile/step/1')
  @UseGuards(JwtAuthGuard)
  patchWorkspaceProfileStep1(@Req() req: Request & { user: User }, @Body() body: WorkspaceProfileStep1Dto) {
    if (req.user.role !== UserRole.CATERER) {
      throw new ForbiddenException('Workspace profile is only available for caterer accounts');
    }
    return this.marketplace.patchWorkspaceProfileStep1ForUser(req.user.id, body);
  }

  /** Wizard step 2 — gallery image URLs + optional banner update. */
  @Patch('caterer/profile/step/2')
  @UseGuards(JwtAuthGuard)
  patchWorkspaceProfileStep2(@Req() req: Request & { user: User }, @Body() body: WorkspaceProfileStep2Dto) {
    if (req.user.role !== UserRole.CATERER) {
      throw new ForbiddenException('Workspace profile is only available for caterer accounts');
    }
    return this.marketplace.patchWorkspaceProfileStep2ForUser(req.user.id, body);
  }

  /** Wizard step 3 — publish when server-side completion checks pass. */
  @Patch('caterer/profile/step/3')
  @UseGuards(JwtAuthGuard)
  publishWorkspaceProfile(@Req() req: Request & { user: User }) {
    if (req.user.role !== UserRole.CATERER) {
      throw new ForbiddenException('Workspace profile is only available for caterer accounts');
    }
    return this.marketplace.publishWorkspaceProfileForUser(req.user.id);
  }

  /** Full replace — prefer step PATCH routes from the onboarding wizard. */
  @Patch('caterer/profile')
  @UseGuards(JwtAuthGuard)
  updateWorkspaceProfile(
    @Req() req: Request & { user: User },
    @Body() body: UpsertCatererWorkspaceProfileDto,
  ) {
    if (req.user.role !== UserRole.CATERER) {
      throw new ForbiddenException('Workspace profile is only available for caterer accounts');
    }
    return this.marketplace.upsertWorkspaceProfileForUser(req.user.id, body);
  }

  @Get('stats')
  async stats() {
    const caterersListed = await this.marketplace.publishedCount();
    return { caterersListed };
  }
}
