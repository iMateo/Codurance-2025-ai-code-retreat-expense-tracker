import { DateUtils } from '../dateUtils';

describe('DateUtils', () => {
  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = DateUtils.formatDate(date);
      expect(result).toBe('2024-01-15');
    });
  });

  describe('parseDate', () => {
    it('should parse date string correctly', () => {
      const dateString = '2024-01-15';
      const result = DateUtils.parseDate(dateString);
      expect(result instanceof Date).toBe(true);
    });
  });
});