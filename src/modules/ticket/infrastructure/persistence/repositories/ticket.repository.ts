import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { ITicketRepository } from '../../../domain/repositories/ticket.repository.interface';
import { Ticket } from 'src/modules/ticket/domain/entities/ticket.entity';
import { TicketOrmEntity } from '../entities/ticket.orm-entity';

@Injectable()
export class TicketRepository implements ITicketRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly ticketRepo: Repository<TicketOrmEntity>,
  ) {}

  async findAll(mgr?: EntityManager): Promise<Ticket[]> {
    const repository = this.getRepository(mgr);
    const entities = await repository.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: string, mgr?: EntityManager): Promise<Ticket | null> {
    const repository = this.getRepository(mgr);
    const entity = await repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUser(userId: string, mgr?: EntityManager): Promise<Ticket[]> {
    const repository = this.getRepository(mgr);
    const entities = await repository.find({ where: { userId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findUsedByUser(userId: string, mgr?: EntityManager): Promise<Ticket[]> {
    const repository = this.getRepository(mgr);
    const entities = await repository.find({ where: { userId, isUsed: true } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findUnusedByUser(
    userId: string,
    mgr?: EntityManager,
  ): Promise<Ticket[]> {
    const repository = this.getRepository(mgr);
    const entities = await repository.find({
      where: { userId, isUsed: false },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findBySession(
    sessionId: string,
    mgr?: EntityManager,
  ): Promise<Ticket[]> {
    const repository = this.getRepository(mgr);
    const entities = await repository.find({ where: { sessionId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByUserAndSession(
    userId: string,
    sessionId: string,
    mgr?: EntityManager,
  ): Promise<Ticket | null> {
    const repository = this.getRepository(mgr);
    const entity = await repository.findOne({ where: { userId, sessionId } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(ticket: Ticket, mgr?: EntityManager): Promise<Ticket> {
    const repository = this.getRepository(mgr);
    const entity = this.toOrm(ticket);
    const saved = await repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string, mgr?: EntityManager): Promise<void> {
    const repository = this.getRepository(mgr);
    await repository.delete(id);
  }

  private toDomain(entity: TicketOrmEntity): Ticket {
    return Ticket.create({
      id: entity.id,
      userId: entity.userId,
      sessionId: entity.sessionId,
      purchasedAt: entity.purchasedAt,
      isUsed: entity.isUsed,
      usedAt: entity.usedAt,
    });
  }

  private toOrm(ticket: Ticket): TicketOrmEntity {
    const orm = new TicketOrmEntity();
    orm.id = ticket.id;
    orm.userId = ticket.userId;
    orm.sessionId = ticket.sessionId;
    orm.purchasedAt = ticket.purchasedAt;
    orm.isUsed = ticket.isUsed;
    orm.usedAt = ticket.usedAt;
    return orm;
  }

  private getRepository(mgr?: EntityManager): Repository<TicketOrmEntity> {
    return mgr ? mgr.getRepository(TicketOrmEntity) : this.ticketRepo;
  }
}
