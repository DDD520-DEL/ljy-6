import type { WeatherInfo, WeatherType } from '../../shared/types';

const WMO_WEATHER_MAP: Record<number, WeatherType> = {
  0: 'sunny',
  1: 'sunny',
  2: 'cloudy',
  3: 'cloudy',
  45: 'foggy',
  48: 'foggy',
  51: 'rainy',
  53: 'rainy',
  55: 'rainy',
  56: 'rainy',
  57: 'rainy',
  61: 'rainy',
  63: 'rainy',
  65: 'rainy',
  66: 'rainy',
  67: 'rainy',
  71: 'snowy',
  73: 'snowy',
  75: 'snowy',
  77: 'snowy',
  80: 'rainy',
  81: 'rainy',
  82: 'rainy',
  85: 'snowy',
  86: 'snowy',
  95: 'rainy',
  96: 'rainy',
  99: 'rainy',
};

const WIND_DIRECTION_MAP = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function degreesToDirection(degrees: number): string {
  const index = Math.round(degrees / 45) % 8;
  return WIND_DIRECTION_MAP[index];
}

export async function fetchWeatherByCoords(lat: number, lng: number): Promise<WeatherInfo> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Weather API request failed: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    const weatherCode = current.weather_code ?? 0;
    const temperature = Math.round(current.temperature_2m ?? 20);
    const windSpeed = current.wind_speed_10m;
    const windDegrees = current.wind_direction_10m ?? 0;
    const windDirection = degreesToDirection(windDegrees);

    const weather: WeatherType = WMO_WEATHER_MAP[weatherCode] ?? 'sunny';

    return {
      weather,
      temperature,
      windDirection,
      windSpeed,
    };
  } catch (error) {
    console.warn('获取天气信息失败，使用默认值:', error);
    return {
      weather: 'sunny',
      temperature: 20,
      windDirection: 'N',
      windSpeed: 0,
    };
  }
}

export function getWindDirectionLabel(direction: string, lang: 'zh' | 'en' = 'zh'): string {
  const labels: Record<string, { zh: string; en: string }> = {
    N: { zh: '北风', en: 'North' },
    NE: { zh: '东北风', en: 'Northeast' },
    E: { zh: '东风', en: 'East' },
    SE: { zh: '东南风', en: 'Southeast' },
    S: { zh: '南风', en: 'South' },
    SW: { zh: '西南风', en: 'Southwest' },
    W: { zh: '西风', en: 'West' },
    NW: { zh: '西北风', en: 'Northwest' },
  };
  return labels[direction]?.[lang] ?? direction;
}
