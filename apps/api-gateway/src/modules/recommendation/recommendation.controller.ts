import { RelatedProductDto } from '@libs/contract/recommendation/dto';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RmqPublisherService } from '@libs/common/rabbitmq';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('Authorization')
@ApiTags('Recommendation (AI-Powered)')
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Get('products/:id/related')
  @ApiOperation({ summary: 'Get related products based on product ID' })
  @ApiOkResponse({ description: 'List of related products', type: [RelatedProductDto] })
  @ApiInternalServerErrorResponse({ description: 'Failed to get related products' })
  getRelatedProducts(@Param('id', ParseIntPipe) id: number): Promise<RelatedProductDto[]> {
    return this.rmqPublisher.request('recommendation.getRelatedProducts', id);
  }
}
