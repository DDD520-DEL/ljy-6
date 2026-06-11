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
  order: string;
  family: string;
  size: BirdSize;
  beakShape: BeakShape;
  featherColors: string[];
  habitat: string[];
  description: string;
  imageUrl: string;
  rarity: number;
  migrationPattern: MigrationPattern;
  birdCallUrl?: string;
  birdCallDescription?: string;
}

export interface Collection {
  id: number;
  userId: number;
  speciesId: number;
  createdAt: string;
  species?: Species;
}

export interface LocationFavorite {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  locationName: string;
  note?: string;
  createdAt: string;
  speciesName?: string;
  observationId?: number;
  thumbnailUrl?: string;
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

export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface ObservationTag {
  id: number;
  observationId: number;
  tagId: number;
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
  temperature?: number;
  windDirection?: string;
  behavior: string;
  photoUrls: string[];
  thumbnailUrls: string[];
  description: string;
  likes: number;
  createdAt: string;
  user?: User;
  species?: Species | null;
  comments?: Comment[];
  isLiked?: boolean;
  tags?: Tag[];
}

export interface WeatherInfo {
  weather: WeatherType;
  temperature: number;
  windDirection: string;
  windSpeed?: number;
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

export type NotificationType = 'comment' | 'reply' | 'follow' | 'badge_earned';

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

export type ChallengeType = 'species_count' | 'city_count' | 'observation_count' | 'rarity_sum' | 'habitat_variety';

export interface Challenge {
  id: number;
  month: string;
  year: number;
  type: ChallengeType;
  title: string;
  description: string;
  target: number;
  unit: string;
  badgeId: number;
  createdAt: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

export interface UserChallengeProgress {
  id: number;
  userId: number;
  challengeId: number;
  currentValue: number;
  completed: boolean;
  completedAt: string | null;
  badgeAwarded: boolean;
}

export interface ChallengeWithProgress extends Challenge {
  progress: UserChallengeProgress | null;
}

export interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  challengeId: number;
  awardedAt: string;
  badge?: Badge;
  challenge?: Challenge;
}

export type ActivityType = 'publish_observation' | 'comment' | 'follow';

export interface Activity {
  id: number;
  userId: number;
  type: ActivityType;
  targetId?: number;
  targetType?: 'observation' | 'comment' | 'user';
  metadata?: Record<string, any>;
  createdAt: string;
  user?: User;
  observation?: Observation;
  comment?: Comment;
  targetUser?: User;
}

export interface ChallengeRankingItem {
  userId: number;
  user: User;
  completedCount: number;
  totalProgress: number;
  rank: number;
}

export interface Feedback {
  id: number;
  userId: number;
  content: string;
  contact: string;
  status: 'pending' | 'processing' | 'resolved';
  reply?: string;
  createdAt: string;
  user?: User;
}

export interface BirdingEvent {
  id: number;
  userId: number;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  registeredCount: number;
  imageUrl?: string;
  contactInfo?: string;
  createdAt: string;
  user?: User;
  registrations?: BirdingEventRegistration[];
  isRegistered?: boolean;
}

export interface BirdingEventRegistration {
  id: number;
  eventId: number;
  userId: number;
  registeredAt: string;
  user?: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}
