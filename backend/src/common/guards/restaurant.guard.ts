import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RestaurantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admin can access any restaurant
    if (user.isSuperAdmin) {
      return true;
    }

    // Regular users must have a restaurantId
    if (!user.restaurantId) {
      throw new ForbiddenException(
        'Usuário não está vinculado a um restaurante',
      );
    }

    // Check if requesting resource from their own restaurant
    const restaurantIdParam = request.params?.restaurantId;
    if (restaurantIdParam && restaurantIdParam !== user.restaurantId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este restaurante',
      );
    }

    return true;
  }
}

