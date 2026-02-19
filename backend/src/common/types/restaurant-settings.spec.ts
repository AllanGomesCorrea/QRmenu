import {
  calculateDistance,
  isRestaurantOpen,
  RestaurantSettings,
  DEFAULT_RESTAURANT_SETTINGS,
} from './restaurant-settings';

describe('restaurant-settings', () => {
  describe('calculateDistance', () => {
    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(-23.5505, -46.6333, -23.5505, -46.6333);
      expect(distance).toBeCloseTo(0, 0);
    });

    it('should calculate distance between São Paulo and Rio de Janeiro (~360km)', () => {
      // São Paulo: -23.5505, -46.6333
      // Rio de Janeiro: -22.9068, -43.1729
      const distance = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
      // ~358 km
      expect(distance).toBeGreaterThan(350000);
      expect(distance).toBeLessThan(370000);
    });

    it('should calculate short distance (~100m)', () => {
      // Two points very close together in São Paulo
      const lat1 = -23.5505;
      const lon1 = -46.6333;
      const lat2 = -23.5514; // ~100m south
      const lon2 = -46.6333;
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      expect(distance).toBeGreaterThan(50);
      expect(distance).toBeLessThan(200);
    });

    it('should be symmetric (A->B == B->A)', () => {
      const d1 = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
      const d2 = calculateDistance(-22.9068, -43.1729, -23.5505, -46.6333);
      expect(d1).toBeCloseTo(d2, 5);
    });
  });

  describe('isRestaurantOpen', () => {
    it('should return isOpen true when operating hours are disabled', () => {
      const settings: RestaurantSettings = {
        operatingHours: {
          enabled: false,
          timezone: 'America/Sao_Paulo',
          schedule: {},
        },
      };
      const result = isRestaurantOpen(settings);
      expect(result.isOpen).toBe(true);
    });

    it('should return isOpen true when no operatingHours settings', () => {
      const settings: RestaurantSettings = {};
      const result = isRestaurantOpen(settings);
      expect(result.isOpen).toBe(true);
    });

    it('should return closed when day is marked as closed', () => {
      const now = new Date();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[now.getDay()];

      const schedule: any = {};
      // Mark today as closed, but have another day open
      days.forEach((day) => {
        schedule[day] = day === today
          ? { open: '11:00', close: '23:00', closed: true }
          : { open: '11:00', close: '23:00' };
      });

      const settings: RestaurantSettings = {
        operatingHours: {
          enabled: true,
          timezone: 'America/Sao_Paulo',
          schedule,
        },
      };

      const result = isRestaurantOpen(settings);
      expect(result.isOpen).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should return open when current time is within operating hours', () => {
      const now = new Date();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[now.getDay()];

      // Set schedule to be open all day
      const schedule: any = {};
      days.forEach((day) => {
        schedule[day] = { open: '00:00', close: '23:59' };
      });

      const settings: RestaurantSettings = {
        operatingHours: {
          enabled: true,
          timezone: 'America/Sao_Paulo',
          schedule,
        },
      };

      const result = isRestaurantOpen(settings);
      expect(result.isOpen).toBe(true);
    });

    it('should handle default settings', () => {
      // DEFAULT_RESTAURANT_SETTINGS should be defined
      expect(DEFAULT_RESTAURANT_SETTINGS).toBeDefined();
      expect(DEFAULT_RESTAURANT_SETTINGS.operatingHours).toBeDefined();
      expect(DEFAULT_RESTAURANT_SETTINGS.geolocation).toBeDefined();
      expect(DEFAULT_RESTAURANT_SETTINGS.geolocation?.radiusMeters).toBe(200);
    });
  });
});
