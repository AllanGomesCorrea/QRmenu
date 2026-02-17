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

    if (user && user.restaurantId && request.body) {
      // Inject restaurantId into body for POST/PUT/PATCH requests
      request.body.restaurantId = user.restaurantId;
    }

    return next.handle();
  }
}

