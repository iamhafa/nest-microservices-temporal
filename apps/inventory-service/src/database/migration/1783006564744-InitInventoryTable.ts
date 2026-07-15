import { MigrationInterface, QueryRunner } from "typeorm";

export class InitInventoryTable1783006564744 implements MigrationInterface {
    name = 'InitInventoryTable1783006564744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "inventories"."version" IS 'Phiên bản khóa lạc quan (Optimistic Locking) dùng để ngăn chặn tranh chấp dữ liệu (Race Condition)'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "inventories"."version" IS 'Phiên bản khóa lạc quan (Optimistic Locking) dùng để ngăn chặn tranh chấp dữ liệu (Race Condition).'`);
    }

}
