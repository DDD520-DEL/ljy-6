export type BirdSize = 'small' | 'medium' | 'large' | 'xlarge';
export type BeakShape = 'short' | 'slender' | 'curved' | 'hooked' | 'conical';
export type MigrationPattern = 'resident' | 'summer' | 'winter' | 'passage';
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'snowy' | 'windy';

export interface User {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  observationsCount: number;
  speciesCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  createdAt: string;
}

export interface Species {
  id: number;
  name: string;
  scientificName: string;
  size: BirdSize;
  beakShape: BeakShape;
  featherColors: string[];
  habitat: string[];
  description: string;
  imageUrl: string;
  rarity: number;
  migrationPattern: MigrationPattern;
}

export interface SpeciesMatch extends Species {
  matchScore: number;
}

export interface Comment {
  id: number;
  observationId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: User;
}

export interface Observation {
  id: number;
  userId: number;
  speciesId: number | null;
  speciesName: string;
  latitude: number;
  longitude: number;
  locationName: string;
  observationTime: string;
  weather: WeatherType | string;
  behavior: string;
  photoUrls: string[];
  description: string;
  likes: number;
  createdAt: string;
  user?: User;
  species?: Species | null;
  comments?: Comment[];
  isLiked?: boolean;
}

export interface YearListItem {
  speciesId: number;
  speciesName: string;
  scientificName: string;
  count: number;
  firstDate: string;
  imageUrl: string;
}

export interface FrequencyItem {
  speciesId: number;
  speciesName: number;
  count: number;
  imageUrl: string;
}

export interface SeasonalItem {
  month: number;
  count: number;
}

export type HeatmapPoint = [number, number, number];

export type NotificationType = 'comment' | 'reply' | 'follow';

export interface Notification {
  id: number;
  type: NotificationType;
  fromUserId: number;
  toUserId: number;
  observationId?: number;
  commentId?: number;
  read: boolean;
  createdAt: string;
  fromUser?: User;
  observation?: Observation;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}
