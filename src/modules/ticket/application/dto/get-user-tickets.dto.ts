import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { FilterTicketByUse } from 'src/common/enums/filter-ticket-by-use.enum';

export class GetUserTicketsDto {
  @ApiProperty({
    example: 'unused',
    description: 'Filter tickets by their usage status',
    enum: FilterTicketByUse,
    default: FilterTicketByUse.All,
  })
  @IsEnum(FilterTicketByUse)
  @IsOptional()
  readonly filterByUse: FilterTicketByUse;
}
