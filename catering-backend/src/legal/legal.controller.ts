import { Controller, Get, Param, Query } from '@nestjs/common';
import { LegalService } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.legal.getPublished(slug, locale);
  }
}
