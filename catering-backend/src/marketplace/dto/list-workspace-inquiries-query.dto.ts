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

export const WORKSPACE_INQUIRY_SORT_FIELDS = [
  'createdAt',
  'name',
  'email',
  'subject',
  'solved',
] as const;

export const WORKSPACE_INQUIRY_STATUS_FILTERS = ['all', 'open', 'solved'] as const;

export type WorkspaceInquirySortField =
  (typeof WORKSPACE_INQUIRY_SORT_FIELDS)[number];

export type WorkspaceInquiryStatusFilter =
  (typeof WORKSPACE_INQUIRY_STATUS_FILTERS)[number];

export class ListWorkspaceInquiriesQueryDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn([...WORKSPACE_INQUIRY_SORT_FIELDS])
  sortBy?: WorkspaceInquirySortField;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn([...WORKSPACE_INQUIRY_STATUS_FILTERS])
  status?: WorkspaceInquiryStatusFilter;
}
