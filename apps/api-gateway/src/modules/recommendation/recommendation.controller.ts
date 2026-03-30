import { RelatedProductDto } from '@libs/contract/recommendation';
import { Controller, Get, Inject, Param, ParseIntPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiBearerAuth('Authorization')
@ApiTags('Recommendation (AI-Powered)')
@Controller('recommendations')
export class RecommendationController {
  constructor(@Inject('RECOMMENDATION_SERVICE_CLIENT') private readonly recommendationServiceClient: ClientProxy) {}

  @Get('products/:id/related')
  @ApiOperation({ summary: 'Get related products based on product ID' })
  @ApiOkResponse({ description: 'List of related products', type: [RelatedProductDto] })
  @ApiInternalServerErrorResponse({ description: 'Failed to get related products' })
  getRelatedProducts(@Param('id', ParseIntPipe) id: number): Observable<RelatedProductDto[]> {
    return this.recommendationServiceClient.send({ cmd: 'get-related-products' }, id);
  }
}
