import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateTime, formatTime, formatPhone } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format value as BRL currency', () => {
      const result = formatCurrency(29.90);
      expect(result).toContain('29,90');
      expect(result).toContain('R$');
    });

    it('should format zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0,00');
    });

    it('should format large values', () => {
      const result = formatCurrency(1500.50);
      expect(result).toContain('1.500,50');
    });

    it('should format negative values', () => {
      const result = formatCurrency(-10);
      expect(result).toContain('10,00');
    });
  });

  describe('formatDate', () => {
    it('should format Date object to dd/mm/yyyy', () => {
      const result = formatDate(new Date(2025, 0, 15)); // Jan 15, 2025
      expect(result).toBe('15/01/2025');
    });

    it('should format ISO string', () => {
      const result = formatDate('2025-06-20T12:00:00Z');
      expect(result).toMatch(/20\/06\/2025/);
    });
  });

  describe('formatTime', () => {
    it('should format time from Date', () => {
      const date = new Date(2025, 0, 15, 14, 30);
      const result = formatTime(date);
      expect(result).toBe('14:30');
    });
  });

  describe('formatPhone', () => {
    it('should format 11-digit phone (mobile)', () => {
      expect(formatPhone('11999887766')).toBe('(11) 99988-7766');
    });

    it('should format 10-digit phone (landline)', () => {
      expect(formatPhone('1133445566')).toBe('(11) 3344-5566');
    });

    it('should return original for other lengths', () => {
      expect(formatPhone('123')).toBe('123');
    });

    it('should handle phone with formatting characters', () => {
      expect(formatPhone('(11) 99988-7766')).toBe('(11) 99988-7766');
    });
  });
});
