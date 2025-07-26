import { describe, it, expect } from 'vitest';
import { 
  validateAndCapNumber, 
  capNumberValue, 
  createNumberChangeHandler,
  createNumberBlurHandler,
  MAX_ALLOWED_NUMBER 
} from './number-validation';

describe('number-validation', () => {
  describe('capNumberValue', () => {
    it('should return null for null input', () => {
      expect(capNumberValue(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(capNumberValue(undefined)).toBe(null);
    });

    it('should return null for NaN input', () => {
      expect(capNumberValue(NaN)).toBe(null);
    });

    it('should return null for non-number input', () => {
      expect(capNumberValue('string' as any)).toBe(null);
    });

    it('should cap negative numbers to 0', () => {
      expect(capNumberValue(-100)).toBe(0);
      expect(capNumberValue(-1)).toBe(0);
      expect(capNumberValue(-0.5)).toBe(0);
    });

    it('should return the same value for valid numbers within range', () => {
      expect(capNumberValue(0)).toBe(0);
      expect(capNumberValue(1000)).toBe(1000);
      expect(capNumberValue(MAX_ALLOWED_NUMBER - 1)).toBe(MAX_ALLOWED_NUMBER - 1);
    });

    it('should cap values above the maximum', () => {
      expect(capNumberValue(MAX_ALLOWED_NUMBER + 1)).toBe(MAX_ALLOWED_NUMBER);
      expect(capNumberValue(99999999999)).toBe(MAX_ALLOWED_NUMBER);
      expect(capNumberValue(Number.MAX_SAFE_INTEGER)).toBe(MAX_ALLOWED_NUMBER);
    });

    it('should use custom maxValue when provided', () => {
      const customMax = 1000;
      expect(capNumberValue(500, customMax)).toBe(500);
      expect(capNumberValue(1500, customMax)).toBe(customMax);
      expect(capNumberValue(-100, customMax)).toBe(0);
    });
  });

  describe('validateAndCapNumber', () => {
    it('should strip non-numeric characters when decimals not allowed', () => {
      expect(validateAndCapNumber('abc123def')).toBe('123');
      expect(validateAndCapNumber('1a2b3c')).toBe('123');
      expect(validateAndCapNumber('$1,000')).toBe('1000');
      expect(validateAndCapNumber('1.23', false)).toBe('123'); // Strips decimal when not allowed
    });

    it('should allow decimals when enabled', () => {
      expect(validateAndCapNumber('123.45', true)).toBe('123.45');
      expect(validateAndCapNumber('$1,000.50', true)).toBe('1000.50');
      expect(validateAndCapNumber('abc123.45def', true)).toBe('123.45');
    });

    it('should handle multiple decimal points by keeping only the first', () => {
      expect(validateAndCapNumber('123.45.67', true)).toBe('123.4567');
      expect(validateAndCapNumber('1.2.3.4', true)).toBe('1.234');
    });

    it('should cap values at the maximum', () => {
      const largeNumber = (MAX_ALLOWED_NUMBER + 1000).toString();
      expect(validateAndCapNumber(largeNumber)).toBe(MAX_ALLOWED_NUMBER.toString());
    });

    it('should handle empty strings', () => {
      expect(validateAndCapNumber('')).toBe('');
      expect(validateAndCapNumber('   ')).toBe('');
    });

    it('should handle zero values', () => {
      expect(validateAndCapNumber('0')).toBe('0');
      expect(validateAndCapNumber('0.00', true)).toBe('0.00');
    });

    it('should use custom maxValue when provided', () => {
      expect(validateAndCapNumber('1500', false, 1000)).toBe('1000');
      expect(validateAndCapNumber('500', false, 1000)).toBe('500');
    });

    it('should strip scientific notation characters', () => {
      expect(validateAndCapNumber('1e10')).toBe('110'); // e stripped out
      expect(validateAndCapNumber('5e+45')).toBe('545'); // e and + stripped out
    });

    describe('comma formatting', () => {
      it('should format numbers with commas when formatWithCommas is true', () => {
        expect(validateAndCapNumber('1000', false, MAX_ALLOWED_NUMBER, true)).toBe('1,000');
        expect(validateAndCapNumber('12345', false, MAX_ALLOWED_NUMBER, true)).toBe('12,345');
        expect(validateAndCapNumber('1234567', false, MAX_ALLOWED_NUMBER, true)).toBe('1,234,567');
      });

      it('should handle input already containing commas', () => {
        expect(validateAndCapNumber('1,500', false, MAX_ALLOWED_NUMBER, true)).toBe('1,500');
        expect(validateAndCapNumber('1,234,567', false, MAX_ALLOWED_NUMBER, true)).toBe('1,234,567');
        expect(validateAndCapNumber('$1,000', false, MAX_ALLOWED_NUMBER, true)).toBe('1,000');
      });

      it('should not format with commas when formatWithCommas is false', () => {
        expect(validateAndCapNumber('1000', false, MAX_ALLOWED_NUMBER, false)).toBe('1000');
        expect(validateAndCapNumber('1,500', false, MAX_ALLOWED_NUMBER, false)).toBe('1500');
      });

      it('should handle empty and zero values with comma formatting', () => {
        expect(validateAndCapNumber('', false, MAX_ALLOWED_NUMBER, true)).toBe('');
        expect(validateAndCapNumber('0', false, MAX_ALLOWED_NUMBER, true)).toBe('0');
      });
    });
  });

  describe('createNumberChangeHandler', () => {
    it('should create a function that validates input on change', () => {
      const mockOnChange = vi.fn();
      const handler = createNumberChangeHandler(mockOnChange, false);
      
      const mockEvent = {
        target: { value: 'abc123def' }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handler(mockEvent);
      
      expect(mockOnChange).toHaveBeenCalledWith('123');
    });

    it('should handle decimal validation based on allowDecimals parameter', () => {
      const mockOnChange = vi.fn();
      
      // Test with decimals not allowed
      const handlerNoDecimals = createNumberChangeHandler(mockOnChange, false);
      handlerNoDecimals({ target: { value: '123.45' } } as React.ChangeEvent<HTMLInputElement>);
      expect(mockOnChange).toHaveBeenCalledWith('12345');
      
      mockOnChange.mockClear();
      
      // Test with decimals allowed
      const handlerWithDecimals = createNumberChangeHandler(mockOnChange, true);
      handlerWithDecimals({ target: { value: '123.45' } } as React.ChangeEvent<HTMLInputElement>);
      expect(mockOnChange).toHaveBeenCalledWith('123.45');
    });

    it('should cap values using custom maxValue', () => {
      const mockOnChange = vi.fn();
      const handler = createNumberChangeHandler(mockOnChange, false, 1000);
      
      handler({ target: { value: '1500' } } as React.ChangeEvent<HTMLInputElement>);
      
      expect(mockOnChange).toHaveBeenCalledWith('1000');
    });

    it('should format values with commas when formatWithCommas is true', () => {
      const mockOnChange = vi.fn();
      const handler = createNumberChangeHandler(mockOnChange, false, MAX_ALLOWED_NUMBER, true);
      
      handler({ target: { value: '1500' } } as React.ChangeEvent<HTMLInputElement>);
      
      expect(mockOnChange).toHaveBeenCalledWith('1,500');
    });

    it('should handle input with existing commas when formatWithCommas is true', () => {
      const mockOnChange = vi.fn();
      const handler = createNumberChangeHandler(mockOnChange, false, MAX_ALLOWED_NUMBER, true);
      
      handler({ target: { value: '12,345' } } as React.ChangeEvent<HTMLInputElement>);
      
      expect(mockOnChange).toHaveBeenCalledWith('12,345');
    });
  });

  describe('createNumberBlurHandler', () => {
    it('should call onChange when value changes after validation', () => {
      const mockOnChange = vi.fn();
      const mockOnCapped = vi.fn();
      
      const handler = createNumberBlurHandler('abc123', mockOnChange, false, mockOnCapped);
      handler();
      
      expect(mockOnChange).toHaveBeenCalledWith('123');
      expect(mockOnCapped).toHaveBeenCalledWith('abc123', '123');
    });

    it('should not call onChange when value is already valid', () => {
      const mockOnChange = vi.fn();
      const mockOnCapped = vi.fn();
      
      const handler = createNumberBlurHandler('123', mockOnChange, false, mockOnCapped);
      handler();
      
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockOnCapped).not.toHaveBeenCalled();
    });

    it('should call onCapped callback when value is capped', () => {
      const mockOnChange = vi.fn();
      const mockOnCapped = vi.fn();
      
      const largeValue = (MAX_ALLOWED_NUMBER + 1000).toString();
      const handler = createNumberBlurHandler(largeValue, mockOnChange, false, mockOnCapped);
      handler();
      
      expect(mockOnChange).toHaveBeenCalledWith(MAX_ALLOWED_NUMBER.toString());
      expect(mockOnCapped).toHaveBeenCalledWith(largeValue, MAX_ALLOWED_NUMBER.toString());
    });

    it('should work without onCapped callback', () => {
      const mockOnChange = vi.fn();
      
      const handler = createNumberBlurHandler('abc123', mockOnChange, false);
      handler();
      
      expect(mockOnChange).toHaveBeenCalledWith('123');
      // Should not throw error when onCapped is undefined
    });

    it('should use custom maxValue', () => {
      const mockOnChange = vi.fn();
      const mockOnCapped = vi.fn();
      
      const handler = createNumberBlurHandler('1500', mockOnChange, false, mockOnCapped, 1000);
      handler();
      
      expect(mockOnChange).toHaveBeenCalledWith('1000');
      expect(mockOnCapped).toHaveBeenCalledWith('1500', '1000');
    });

    it('should format value with commas on blur when formatWithCommas is true', () => {
      const mockOnChange = vi.fn();
      const mockOnCapped = vi.fn();
      
      const handler = createNumberBlurHandler('1500', mockOnChange, false, mockOnCapped, MAX_ALLOWED_NUMBER, true);
      handler();
      
      expect(mockOnChange).toHaveBeenCalledWith('1,500');
      expect(mockOnCapped).toHaveBeenCalledWith('1500', '1,500');
    });

    it('should handle already formatted value on blur', () => {
      const mockOnChange = vi.fn();
      const mockOnCapped = vi.fn();
      
      const handler = createNumberBlurHandler('1,500', mockOnChange, false, mockOnCapped, MAX_ALLOWED_NUMBER, true);
      handler();
      
      // Should not call onChange if value is already properly formatted
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockOnCapped).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and security', () => {
    it('should handle extremely large numbers', () => {
      const extremelyLarge = '999999999999999999999999999999999999999999999';
      expect(validateAndCapNumber(extremelyLarge)).toBe(MAX_ALLOWED_NUMBER.toString());
    });

    it('should strip scientific notation characters', () => {
      expect(validateAndCapNumber('1e10')).toBe('110'); // e stripped out
      expect(validateAndCapNumber('5e+45')).toBe('545'); // e and + stripped out
      expect(validateAndCapNumber('1.5e3')).toBe('153'); // e stripped out
    });

    it('should strip negative signs and scientific notation', () => {
      expect(validateAndCapNumber('-1e10')).toBe('110'); // - and e stripped out
    });

    it('should handle malformed input gracefully', () => {
      expect(validateAndCapNumber('NaN')).toBe('');
      expect(validateAndCapNumber('Infinity')).toBe('');
      expect(validateAndCapNumber('-Infinity')).toBe('');
      expect(validateAndCapNumber('undefined')).toBe('');
    });

    it('should prevent database overflow scenarios', () => {
      // Test the exact scenario that caused the 5e+45 error
      const problematicInput = '5e+45';
      const result = validateAndCapNumber(problematicInput);
      
      expect(result).toBe('545'); // Characters stripped, not parsed as scientific notation
      expect(parseInt(result)).toBeLessThanOrEqual(MAX_ALLOWED_NUMBER);
    });
  });
});