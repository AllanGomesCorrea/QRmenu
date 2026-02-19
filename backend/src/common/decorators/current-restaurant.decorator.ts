import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the current restaurant ID from the request.
 * Super Admin users can override the restaurant by sending
 * 'x-restaurant-id' header, allowing them to operate on any restaurant.
 */
export const CurrentRestaurant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If Super Admin, allow restaurant override via header
    if (user?.isSuperAdmin) {
      const headerRestaurantId = request.headers['x-restaurant-id'];
      if (headerRestaurantId) {
        return headerRestaurantId;
      }
    }

    return user?.restaurantId || null;
  },
);

