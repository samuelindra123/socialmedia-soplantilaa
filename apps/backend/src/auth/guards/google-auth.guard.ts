import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createSignedGoogleOauthState } from '../utils/google-oauth-state.util';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const stateSecret =
      this.configService.get<string>('GOOGLE_OAUTH_STATE_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      '';

    if (!stateSecret) {
      throw new Error('GOOGLE_OAUTH_STATE_SECRET atau JWT_SECRET wajib diisi');
    }

    const state = createSignedGoogleOauthState(
      stateSecret,
      request.query.redirect,
      request.query.mode,
    );

    return { state };
  }
}
