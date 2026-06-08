import { RmqPublisherService } from '@libs/common';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('Authorization')
@ApiTags('Recommendation (AI-Powered)')
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Get('products/:id/related')
  @ApiOperation({ summary: 'Get related products based on product ID' })
  @ApiOkResponse({ description: 'List of related products' })
  @ApiInternalServerErrorResponse({ description: 'Failed to get related products' })
  getRelatedProducts(@Param('id', ParseIntPipe) id: number) {
    return this.rmqPublisher.request('recommendation.getRelatedProducts', id);
  }
}
