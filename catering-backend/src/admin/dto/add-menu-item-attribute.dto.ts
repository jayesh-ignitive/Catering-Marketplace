import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddMenuItemAttributeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attributeId!: number;
}
