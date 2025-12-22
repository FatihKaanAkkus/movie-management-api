import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class Tickets1766323823838 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'session_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'purchased_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'is_used',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['session_id'],
        referencedTableName: 'movie_sessions',
        referencedColumnNames: ['id'],
        // Allows returning tickets later if a session is deleted
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'tickets',
      new TableIndex({
        name: 'IDX_TICKET_USER_SESSION',
        columnNames: ['user_id', 'session_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tickets');
  }
}
