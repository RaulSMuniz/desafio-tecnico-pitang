/*
  Warnings:

  - You are about to alter the column `valor` on the `reimbursements` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "reimbursements" ALTER COLUMN "valor" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deletadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
