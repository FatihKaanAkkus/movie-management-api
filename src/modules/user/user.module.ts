import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './application/services/user.service';
import { UserController } from './presentation/controllers/user.controller';
import { UserOrmEntity } from './infrastructure/persistence/entities/user.orm-entity';
import { IUserRepository } from './domain/repositories/user.repository.interface';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository';
import { TicketService } from '../ticket/application/services/ticket.service';
import { MovieModule } from '../movie/movie.module';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [
    forwardRef(() => TicketModule),
    forwardRef(() => MovieModule),
    TypeOrmModule.forFeature([UserOrmEntity]),
  ],
  providers: [
    UserService,
    TicketService,
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
  ],
  controllers: [UserController],
  exports: [UserService, IUserRepository],
})
export class UserModule {}
