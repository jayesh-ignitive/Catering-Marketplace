import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ADMIN_CATERER_SORT_FIELDS = [
  'createdAt',
  'name',
  'slug',
  'subdomain',
  'provisionStatus',
  'profilePublished',
  'updatedAt',
  'ownerEmail',
  'ownerFullName',
] as const;

export type AdminCatererSortField = (typeof ADMIN_CATERER_SORT_FIELDS)[number];

export class ListAdminCaterersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  /** Workspace name, slug, subdomain, or owner email / name. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ADMIN_CATERER_SORT_FIELDS])
  sortBy?: AdminCatererSortField;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}
