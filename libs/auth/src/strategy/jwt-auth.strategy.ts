import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtPayload } from '../interface/jwt.interface';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // extract token from Authorization: Bearer <token>
      ignoreExpiration: false,
      issuer: configService.get<string>('JWT_ISSUER'),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Phương thức validate được Passport tự động gọi sau khi giải mã và xác thực chữ ký (signature) & thời hạn (expiration) của Token thành công.
   * Dữ liệu trả về từ hàm này sẽ được Passport tự động gán vào đối tượng `request.user` để các Controller/Guard ở tầng HTTP sử dụng.
   *
   * @param payload Dữ liệu đã giải mã từ JWT Token (chứa user_id, email, role, iat, exp...)
   * @returns IJwtPayload Payload thông tin người dùng được đính kèm vào request.user
   */
  validate(payload: IJwtPayload): IJwtPayload {
    return payload;
  }
}
