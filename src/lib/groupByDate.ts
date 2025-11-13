// src/lib/groupByDate.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Groups a list of logs by date string ("YYYY-MM-DD").
 */
export function groupByDate<T extends { timestamp?: Timestamp | Date }>(
  logs: T[]
): Record<string, T[]> {
  return logs.reduce((acc, log) => {
    if (!log.timestamp) return acc;

    const date = (
      log.timestamp instanceof Timestamp
        ? log.timestamp.toDate()
        : log.timestamp
    )
      .toISOString()
      .split('T')[0]; // YYYY-MM-DD

    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, T[]>);
}
