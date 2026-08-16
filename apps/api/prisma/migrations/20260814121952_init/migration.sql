/*
  Warnings:

  - You are about to drop the column `embedding` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Recipe` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ingredient_alias_trgm_idx";

-- DropIndex
DROP INDEX "recipe_embedding_hnsw_idx";

-- DropIndex
DROP INDEX "recipe_search_vector_idx";

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "embedding",
DROP COLUMN "search_vector";
