/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    const result = super.handleRequest(
      err,
      user,
      info,
      context,
      status,
    ) as TUser | null;

    if (
      result &&
      typeof result === 'object' &&
      'id' in result &&
      typeof (result as { id: unknown }).id === 'string'
    ) {
      const typedResult = result as { id: string };
      const request = context.switchToHttp().getRequest<{
        headers: Record<string, string | string[] | undefined>;
      }>();
      const sessionToken = request.headers['x-session-token'];
      void this.authService.touchSession(typedResult.id, sessionToken);
    }
    return result as TUser;
  }
}
