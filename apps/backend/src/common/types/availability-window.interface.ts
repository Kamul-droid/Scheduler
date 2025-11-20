export interface AvailabilityWindow {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone?: string;
}

export interface AvailabilityPattern {
  type: 'weekly' | 'custom';
  windows: AvailabilityWindow[];
  exceptions?: {
    date: string; // ISO date
    available: boolean;
  }[];
}

