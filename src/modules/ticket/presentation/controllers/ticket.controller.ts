import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request as NestRequest,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TicketService } from '../../application/services/ticket.service';
import { BuyTicketDto } from '../../application/dto/buy-ticket.dto';
import { GetUserTicketsDto } from '../../application/dto/get-user-tickets.dto';
import { TicketResponseDto } from '../../application/dto/ticket-response.dto';

import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/infrastructure/guards/roles.guard';
import { Roles } from 'src/modules/auth/infrastructure/guards/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import type { IAuthRequest } from 'src/common/presentation/auth-request.interface';

@ApiTags('tickets')
@Controller('v1/tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Get()
  @ApiOperation({
    summary: 'Get all tickets',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 200, type: [TicketResponseDto] })
  @ApiBearerAuth()
  @HttpCode(200)
  async getTickets(): Promise<TicketResponseDto[]> {
    return this.ticketService.getTickets();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Buy a ticket' })
  @ApiResponse({ status: 201, type: TicketResponseDto })
  @ApiConflictResponse({
    description: 'Ticket already purchased for this session by the user',
  })
  @ApiBearerAuth()
  @HttpCode(201)
  async buy(
    @NestRequest() req: IAuthRequest,
    @Body() dto: BuyTicketDto,
  ): Promise<TicketResponseDto> {
    if (req.user.userId !== dto.userId) {
      throw new ForbiddenException(
        'Users can only buy tickets for their own account',
      );
    }
    return this.ticketService.buyTicket(dto.userId, dto.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get my tickets (all, used, unused)' })
  @ApiResponse({ status: 200, type: [TicketResponseDto] })
  @ApiBearerAuth()
  @HttpCode(200)
  async getMyTickets(
    @NestRequest() req: IAuthRequest,
    @Query() dto: GetUserTicketsDto,
  ): Promise<TicketResponseDto[]> {
    return this.ticketService.getUserTickets(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Post(':ticketId/use')
  @ApiOperation({
    summary: 'Manager marks a ticket as used',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  @ApiBearerAuth()
  @HttpCode(200)
  async use(
    @Param('ticketId', new ParseUUIDPipe()) ticketId: string,
  ): Promise<TicketResponseDto> {
    return this.ticketService.useTicket(ticketId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Delete(':ticketId')
  @ApiOperation({
    summary: 'Delete a ticket (cancel)',
    description: 'Requires Manager role',
  })
  @ApiNotFoundResponse({ description: 'Ticket not found' })
  @ApiBearerAuth()
  @HttpCode(204)
  async delete(
    @Param('ticketId', new ParseUUIDPipe()) ticketId: string,
  ): Promise<void> {
    return this.ticketService.deleteTicket(ticketId);
  }
}
