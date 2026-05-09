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

/** Whitelisted columns for ORDER BY (joined `tenant` when needed). */
export const ADMIN_USER_SORT_FIELDS = [
  'createdAt',
  'email',
  'fullName',
  'role',
  'tenantSlug',
  'tenantName',
  'emailVerified',
] as const;

export type AdminUserSortField = (typeof ADMIN_USER_SORT_FIELDS)[number];

export class ListAdminUsersQueryDto {
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

  /** Case-insensitive match on email or full name. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ADMIN_USER_SORT_FIELDS])
  sortBy?: AdminUserSortField;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}
