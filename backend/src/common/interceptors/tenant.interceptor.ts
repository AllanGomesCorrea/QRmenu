import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor that injects restaurantId into request body
 * for create/update operations, ensuring tenant isolation
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && request.body) {
      // Super Admin: use x-restaurant-id header if provided
      if (user.isSuperAdmin) {
        const headerRestaurantId = request.headers['x-restaurant-id'];
        if (headerRestaurantId) {
          request.body.restaurantId = headerRestaurantId;
          return next.handle();
        }
      }

      // Regular users: inject their restaurantId
      if (user.restaurantId) {
        request.body.restaurantId = user.restaurantId;
      }
    }

    return next.handle();
  }
}

