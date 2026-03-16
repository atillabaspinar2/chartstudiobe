import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFullName20260316110000 implements MigrationInterface {
  name = 'AddUserFullName20260316110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD "full_name" character varying(120)',
    );
    await queryRunner.query(
      `UPDATE "users" SET "full_name" = split_part("email", '@', 1) WHERE "full_name" IS NULL`,
    );
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "full_name"');
  }
}
