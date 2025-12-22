import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './application/services/ticket.service';
import { TicketController } from './presentation/controllers/ticket.controller';
import { TicketOrmEntity } from './infrastructure/persistence/entities/ticket.orm-entity';
import { UserOrmEntity } from '../user/infrastructure/persistence/entities/user.orm-entity';
import { MovieSessionOrmEntity } from '../movie/infrastructure/persistence/entities/movie-session.orm-entity';
import { ITicketRepository } from './domain/repositories/ticket.repository.interface';
import { TicketRepository } from './infrastructure/persistence/repositories/ticket.repository';
import { UserModule } from '../user/user.module';
import { MovieModule } from '../movie/movie.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => MovieModule),
    TypeOrmModule.forFeature([
      TicketOrmEntity,
      UserOrmEntity,
      MovieSessionOrmEntity,
    ]),
  ],
  providers: [
    TicketService,
    {
      provide: ITicketRepository,
      useClass: TicketRepository,
    },
  ],
  controllers: [TicketController],
  exports: [TicketService, ITicketRepository],
})
export class TicketModule {}
