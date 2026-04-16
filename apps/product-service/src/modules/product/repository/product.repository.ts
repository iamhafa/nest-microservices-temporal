import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ProductEntity } from '../entity/product.entity';

@Injectable()
export class ProductRepository extends Repository<ProductEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(ProductEntity, entityManager);
  }

  async findSimilarProducts(productId: number, embeddingStr: string, limit: number = 10): Promise<any[]> {
    // Perform cosine similarity search (1 - (<=> distance))
    // We use QueryBuilder for pgvector "<=>" distance operator and mapping
    const similarProducts = await this.createQueryBuilder('p')
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.description AS description',
        'p.price AS price',
        'p.image_url AS image_url',
        'pc.name AS category_name',
        'pb.name AS brand_name',
      ])
      .addSelect('1 - (p.embedding <=> :embedding::vector)', 'similarity_score')
      .leftJoin('p.category', 'pc')
      .leftJoin('p.brand', 'pb')
      .where('p.id != :productId', { productId })
      .andWhere('p.is_active = true')
      .andWhere('p.embedding IS NOT NULL')
      .orderBy('p.embedding <=> :embedding::vector', 'ASC')
      .setParameter('embedding', embeddingStr)
      .limit(limit)
      .getRawMany();

    return similarProducts;
  }
}
