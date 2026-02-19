/**
 * Restaurant Settings Type
 * Stored in Restaurant.settings JSON field
 */
export interface RestaurantSettings {
  // Operating hours
  operatingHours?: {
    enabled: boolean;
    timezone: string; // e.g., "America/Sao_Paulo"
    schedule: {
      [key: string]: { // "monday", "tuesday", etc.
        open: string;  // "11:00"
        close: string; // "23:00"
        closed?: boolean;
      };
    };
  };

  // Geolocation settings
  geolocation?: {
    enabled: boolean;
    radiusMeters: number; // Max distance allowed (default 200m)
  };

  // Security settings
  security?: {
    requireTableOccupied: boolean; // Waiter must mark table as occupied
    maxOrdersPerSession: number;   // Max orders per session
    maxOrderValueWithoutApproval: number; // Max value without staff approval
  };

  // Appearance
  theme?: {
    primaryColor: string;
    accentColor: string;
  };
}

/**
 * Default settings for new restaurants
 */
export const DEFAULT_RESTAURANT_SETTINGS: RestaurantSettings = {
  operatingHours: {
    enabled: true,
    timezone: 'America/Sao_Paulo',
    schedule: {
      sunday: { open: '11:00', close: '22:00' },
      monday: { open: '11:00', close: '23:00' },
      tuesday: { open: '11:00', close: '23:00' },
      wednesday: { open: '11:00', close: '23:00' },
      thursday: { open: '11:00', close: '23:00' },
      friday: { open: '11:00', close: '00:00' },
      saturday: { open: '11:00', close: '00:00' },
    },
  },
  geolocation: {
    enabled: true,
    radiusMeters: 200, // 200 meters
  },
  security: {
    requireTableOccupied: false,
    maxOrdersPerSession: 20,
    maxOrderValueWithoutApproval: 1000,
  },
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if restaurant is currently open
 */
export function isRestaurantOpen(settings: RestaurantSettings): {
  isOpen: boolean;
  message?: string;
  opensAt?: string;
  closesAt?: string;
} {
  if (!settings.operatingHours?.enabled) {
    return { isOpen: true };
  }

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[now.getDay()];
  const schedule = settings.operatingHours.schedule[dayName];

  if (!schedule || schedule.closed) {
    // Find next open day
    let nextDay = (now.getDay() + 1) % 7;
    for (let i = 0; i < 7; i++) {
      const nextSchedule = settings.operatingHours.schedule[days[nextDay]];
      if (nextSchedule && !nextSchedule.closed) {
        return {
          isOpen: false,
          message: `Fechado hoje. Abrimos ${days[nextDay] === 'sunday' ? 'domingo' : 
            days[nextDay] === 'monday' ? 'segunda' :
            days[nextDay] === 'tuesday' ? 'terça' :
            days[nextDay] === 'wednesday' ? 'quarta' :
            days[nextDay] === 'thursday' ? 'quinta' :
            days[nextDay] === 'friday' ? 'sexta' : 'sábado'} às ${nextSchedule.open}.`,
          opensAt: nextSchedule.open,
        };
      }
      nextDay = (nextDay + 1) % 7;
    }
    return { isOpen: false, message: 'Restaurante fechado.' };
  }

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const openTime = schedule.open;
  let closeTime = schedule.close;

  // Handle closing after midnight (e.g., "00:00" or "01:00")
  if (closeTime < openTime) {
    // Restaurant closes after midnight
    if (currentTime >= openTime || currentTime < closeTime) {
      return { isOpen: true, closesAt: closeTime };
    }
  } else {
    // Normal hours
    if (currentTime >= openTime && currentTime < closeTime) {
      return { isOpen: true, closesAt: closeTime };
    }
  }

  // Check if before opening
  if (currentTime < openTime) {
    return {
      isOpen: false,
      message: `Abrimos hoje às ${openTime}.`,
      opensAt: openTime,
    };
  }

  // After closing
  return {
    isOpen: false,
    message: `Fechado. Voltamos amanhã.`,
  };
}
