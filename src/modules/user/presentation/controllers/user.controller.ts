import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Request as NestRequest,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UserService } from '../../application/services/user.service';
import { TicketService } from 'src/modules/ticket/application/services/ticket.service';
import {
  UserResponseDto,
  UserWithTicketsResponseDto,
} from '../../application/dto/user-response.dto';
import { GetUserTicketsDto } from 'src/modules/ticket/application/dto/get-user-tickets.dto';
import { TicketResponseDto } from 'src/modules/ticket/application/dto/ticket-response.dto';

import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/infrastructure/guards/roles.guard';
import { Roles } from 'src/modules/auth/infrastructure/guards/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import type { IAuthRequest } from 'src/common/presentation/auth-request.interface';

@ApiTags('users')
@Controller('v1/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly ticketService: TicketService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @ApiBearerAuth()
  @HttpCode(200)
  async getUsers(): Promise<UserResponseDto[]> {
    return this.userService.getUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Customer, UserRole.Manager)
  @Get(':userId')
  @ApiOperation({
    summary: 'Get user by unique ID',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 200, type: UserWithTicketsResponseDto })
  @ApiBearerAuth()
  @HttpCode(200)
  async getUserById(
    @NestRequest() req: IAuthRequest,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<UserWithTicketsResponseDto> {
    if (req.user.userId !== userId && req.user.role !== UserRole.Manager) {
      throw new ForbiddenException();
    }
    return this.userService.getUserById(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Get(':userId/tickets')
  @ApiOperation({
    summary: 'Get tickets for a specific user',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 200, type: [TicketResponseDto] })
  @ApiBearerAuth()
  @HttpCode(200)
  async getUserTickets(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: GetUserTicketsDto,
  ): Promise<TicketResponseDto[]> {
    return this.ticketService.getUserTickets(userId, dto);
  }
}
