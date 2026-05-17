import { IsIn } from 'class-validator';

export class SetCatererMarketplaceApprovalDto {
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';
}
