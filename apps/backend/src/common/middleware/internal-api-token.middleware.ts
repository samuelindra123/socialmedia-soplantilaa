import {
  Injectable,
  NestMiddleware,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const INTERNAL_TOKEN_HEADER = 'x-internal-api-token';

@Injectable()
export class InternalApiTokenMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const expectedToken = process.env.NEXT_SERVER_ACTION_API_TOKEN;

    if (!expectedToken) {
      throw new ServiceUnavailableException(
        'NEXT_SERVER_ACTION_API_TOKEN belum dikonfigurasi di backend',
      );
    }

    const incomingHeader = req.headers[INTERNAL_TOKEN_HEADER];
    const providedToken = Array.isArray(incomingHeader)
      ? incomingHeader[0]
      : incomingHeader;

    if (!providedToken || providedToken !== expectedToken) {
      throw new UnauthorizedException('Akses API internal tidak valid');
    }

    next();
  }
}