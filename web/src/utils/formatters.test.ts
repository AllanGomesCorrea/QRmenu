import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPhone, formatDate, formatTime, formatDateTime } from './formatters';

describe('formatters (web)', () => {
  describe('formatCurrency', () => {
    it('should format value as BRL', () => {
      const result = formatCurrency(29.90);
      expect(result).toContain('29,90');
      expect(result).toContain('R$');
    });

    it('should handle 0', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0,00');
    });

    it('should handle large values', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1.234,56');
    });

    it('should NOT return NaN for valid numbers', () => {
      expect(formatCurrency(0)).not.toContain('NaN');
      expect(formatCurrency(100)).not.toContain('NaN');
      expect(formatCurrency(99.99)).not.toContain('NaN');
    });

    it('should handle NaN input gracefully', () => {
      // This documents the current behavior - NaN input should be caught before calling
      const result = formatCurrency(NaN);
      expect(result).toContain('NaN');
    });
  });

  describe('formatPhone', () => {
    it('should format 11-digit mobile number', () => {
      expect(formatPhone('11999887766')).toBe('(11) 99988-7766');
    });

    it('should format 10-digit landline number', () => {
      expect(formatPhone('1133445566')).toBe('(11) 3344-5566');
    });

    it('should return original for non-standard lengths', () => {
      expect(formatPhone('123')).toBe('123');
    });
  });

  describe('formatDate', () => {
    it('should format date as dd/mm/yyyy', () => {
      const result = formatDate(new Date(2025, 5, 15)); // Jun 15, 2025
      expect(result).toBe('15/06/2025');
    });
  });

  describe('formatTime', () => {
    it('should format time as HH:mm', () => {
      const result = formatTime(new Date(2025, 0, 1, 14, 30));
      expect(result).toBe('14:30');
    });
  });

  describe('formatDateTime', () => {
    it('should combine date and time format', () => {
      const result = formatDateTime(new Date(2025, 0, 15, 14, 30));
      expect(result).toContain('15/01/2025');
      expect(result).toContain('14:30');
    });
  });
});
