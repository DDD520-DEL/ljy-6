import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeatherByCoords, getWindDirectionLabel } from '../weather';

describe('Weather Service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getWindDirectionLabel', () => {
    it('should return correct Chinese labels for all wind directions', () => {
      expect(getWindDirectionLabel('N', 'zh')).toBe('北风');
      expect(getWindDirectionLabel('NE', 'zh')).toBe('东北风');
      expect(getWindDirectionLabel('E', 'zh')).toBe('东风');
      expect(getWindDirectionLabel('SE', 'zh')).toBe('东南风');
      expect(getWindDirectionLabel('S', 'zh')).toBe('南风');
      expect(getWindDirectionLabel('SW', 'zh')).toBe('西南风');
      expect(getWindDirectionLabel('W', 'zh')).toBe('西风');
      expect(getWindDirectionLabel('NW', 'zh')).toBe('西北风');
    });

    it('should return correct English labels for all wind directions', () => {
      expect(getWindDirectionLabel('N', 'en')).toBe('North');
      expect(getWindDirectionLabel('NE', 'en')).toBe('Northeast');
      expect(getWindDirectionLabel('E', 'en')).toBe('East');
      expect(getWindDirectionLabel('SE', 'en')).toBe('Southeast');
      expect(getWindDirectionLabel('S', 'en')).toBe('South');
      expect(getWindDirectionLabel('SW', 'en')).toBe('Southwest');
      expect(getWindDirectionLabel('W', 'en')).toBe('West');
      expect(getWindDirectionLabel('NW', 'en')).toBe('Northwest');
    });

    it('should return the original direction for unknown directions', () => {
      expect(getWindDirectionLabel('XYZ', 'zh')).toBe('XYZ');
      expect(getWindDirectionLabel('XYZ', 'en')).toBe('XYZ');
    });
  });

  describe('fetchWeatherByCoords', () => {
    it('should return sunny weather for clear sky code 0', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          current: {
            temperature_2m: 25.3,
            weather_code: 0,
            wind_speed_10m: 10,
            wind_direction_10m: 0,
          },
        }),
      }));

      const result = await fetchWeatherByCoords(39.9087, 116.3975);

      expect(result.weather).toBe('sunny');
      expect(result.temperature).toBe(25);
      expect(result.windDirection).toBe('N');
      expect(result.windSpeed).toBe(10);
    });

    it('should map weather codes correctly', async () => {
      const testCases = [
        { code: 0, expected: 'sunny' },
        { code: 1, expected: 'sunny' },
        { code: 2, expected: 'cloudy' },
        { code: 3, expected: 'cloudy' },
        { code: 45, expected: 'foggy' },
        { code: 48, expected: 'foggy' },
        { code: 51, expected: 'rainy' },
        { code: 61, expected: 'rainy' },
        { code: 71, expected: 'snowy' },
        { code: 95, expected: 'rainy' },
        { code: 99, expected: 'rainy' },
        { code: 999, expected: 'sunny' },
      ];

      for (const { code, expected } of testCases) {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            current: {
              temperature_2m: 20,
              weather_code: code,
              wind_speed_10m: 5,
              wind_direction_10m: 90,
            },
          }),
        }));
        const result = await fetchWeatherByCoords(0, 0);
        expect(result.weather).toBe(expected);
      }
    });

    it('should convert wind degrees to cardinal directions correctly', async () => {
      const testCases = [
        { degrees: 0, expected: 'N' },
        { degrees: 45, expected: 'NE' },
        { degrees: 90, expected: 'E' },
        { degrees: 135, expected: 'SE' },
        { degrees: 180, expected: 'S' },
        { degrees: 225, expected: 'SW' },
        { degrees: 270, expected: 'W' },
        { degrees: 315, expected: 'NW' },
        { degrees: 350, expected: 'N' },
        { degrees: 22, expected: 'N' },
        { degrees: 67, expected: 'NE' },
      ];

      for (const { degrees, expected } of testCases) {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            current: {
              temperature_2m: 20,
              weather_code: 0,
              wind_speed_10m: 5,
              wind_direction_10m: degrees,
            },
          }),
        }));
        const result = await fetchWeatherByCoords(0, 0);
        expect(result.windDirection).toBe(expected);
      }
    });

    it('should round temperature to nearest integer', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          current: {
            temperature_2m: 18.7,
            weather_code: 0,
            wind_speed_10m: 5,
            wind_direction_10m: 0,
          },
        }),
      }));

      const result = await fetchWeatherByCoords(0, 0);
      expect(result.temperature).toBe(19);
    });

    it('should handle fetch error gracefully with fallback values', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      const result = await fetchWeatherByCoords(0, 0);

      expect(result.weather).toBe('sunny');
      expect(result.temperature).toBe(20);
      expect(result.windDirection).toBe('N');
      expect(result.windSpeed).toBe(0);
    });

    it('should handle non-ok response gracefully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }));

      const result = await fetchWeatherByCoords(0, 0);

      expect(result.weather).toBe('sunny');
      expect(result.temperature).toBe(20);
      expect(result.windDirection).toBe('N');
    });

    it('should use the provided coordinates in the API call', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          current: {
            temperature_2m: 20,
            weather_code: 0,
            wind_speed_10m: 5,
            wind_direction_10m: 0,
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetchWeatherByCoords(39.9087, 116.3975);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('latitude=39.9087'),
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('longitude=116.3975'),
        expect.any(Object),
      );
    });
  });
});
