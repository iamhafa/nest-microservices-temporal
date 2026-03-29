import { GenerateContentResult, GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { RelatedProductDto } from '@libs/contract/recommendation/dto/related-product.dto';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey: string = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async getRelatedProducts(productInfo: any): Promise<RelatedProductDto[]> {
    try {
      const model: GenerativeModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt: string = `
        Bạn là một chuyên gia gợi ý sản phẩm cho sàn thương mại điện tử.
        Dựa trên thông tin sản phẩm hiện tại:
        - Tên: ${productInfo.name}
        - Thương hiệu: ${productInfo.brand?.name ?? 'N/A'}
        - Danh mục: ${productInfo.category?.name ?? 'N/A'}
        - Tags: ${productInfo.tags?.map((t: any) => t.name).join(', ') ?? 'N/A'}
        - Thuộc tính: ${JSON.stringify(productInfo.attributes ?? {})}

        Hãy gợi ý 10 sản phẩm liên quan khác mà người dùng có thể quan tâm. 
        Trả về kết quả DUY NHẤT dưới dạng mảng JSON thuần túy (no markdown, no wrap blocks) chứa các đối tượng có cấu trúc:
        { "name": "tên sản phẩm", "reason": "lý do gợi ý ngắn gọn bằng tiếng Việt" }
      `;

      const result: GenerateContentResult = await model.generateContent(prompt);
      const text: string = result.response.text().trim();

      // Clean response if it contains markdown code blocks
      const cleanJson: string = text
        .replace(/^```json/, '')
        .replace(/```$/, '')
        .trim();

      const relatedProducts: RelatedProductDto[] = JSON.parse(cleanJson);
      return relatedProducts;
    } catch (error) {
      this.logger.error(`Error calling Gemini API: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get recommendations from AI');
    }
  }
}
