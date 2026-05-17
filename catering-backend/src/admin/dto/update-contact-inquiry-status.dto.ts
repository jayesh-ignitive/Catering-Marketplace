import { IsBoolean } from 'class-validator';

export class UpdateContactInquiryStatusDto {
  @IsBoolean()
  solved!: boolean;
}
