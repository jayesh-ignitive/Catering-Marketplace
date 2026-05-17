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

export const ADMIN_CONTACT_SORT_FIELDS = [
  'createdAt',
  'name',
  'email',
  'subject',
  'solved',
] as const;

export const ADMIN_CONTACT_SOLVED_FILTERS = ['all', 'open', 'solved'] as const;
export type AdminContactSolvedFilter =
  (typeof ADMIN_CONTACT_SOLVED_FILTERS)[number];

export type AdminContactSortField = (typeof ADMIN_CONTACT_SORT_FIELDS)[number];

export class ListAdminContactSubmissionsQueryDto {
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

  /** Case-insensitive match on name, email, subject, or message. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ADMIN_CONTACT_SORT_FIELDS])
  sortBy?: AdminContactSortField;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  /** `open` = unsolved, `solved` = resolved, `all` = no filter (default). */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn([...ADMIN_CONTACT_SOLVED_FILTERS])
  status?: AdminContactSolvedFilter;
}
