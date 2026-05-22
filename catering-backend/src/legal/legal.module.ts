import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from '../localization/language.entity';
import { LegalPageTranslation } from './legal-page-translation.entity';
import { LegalPage } from './legal-page.entity';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegalPage, LegalPageTranslation, Language]),
  ],
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
