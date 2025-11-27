import type { AttendanceRecord } from '../api/attendance';

/**
 * Calculates the total worked time in milliseconds from attendance records.
 * Only counts time from the most recent shift cycle (start -> stop).
 * Handles pause/resume cycles within the shift.
 *
 * @param records - Array of attendance records, should be sorted by timestamp
 * @param currentTime - Current time to use for active shifts (defaults to now)
 * @returns Total worked time in milliseconds
 */
export function calculateWorkedTime(
  records: AttendanceRecord[],
  currentTime: Date = new Date()
): number {
  if (records.length === 0) {
    return 0;
  }

  // Sort records by timestamp (oldest first)
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Find the most recent shift cycle (start -> stop)
  // We look for the last 'start' action and track from there
  let lastStartIndex = -1;
  for (let i = sortedRecords.length - 1; i >= 0; i--) {
    if (sortedRecords[i].action === 'start') {
      lastStartIndex = i;
      break;
    }
  }

  // If no start found, return 0
  if (lastStartIndex === -1) {
    return 0;
  }

  const startTime = new Date(sortedRecords[lastStartIndex].timestamp);
  let totalWorkedMs = 0;
  let currentPeriodStart: Date | null = startTime;
  let isPaused = false;

  // Process records from the start index onwards
  for (let i = lastStartIndex + 1; i < sortedRecords.length; i++) {
    const record = sortedRecords[i];
    const recordTime = new Date(record.timestamp);

    if (record.action === 'pause') {
      if (currentPeriodStart && !isPaused) {
        // Add time from period start to pause
        totalWorkedMs += recordTime.getTime() - currentPeriodStart.getTime();
        isPaused = true;
        currentPeriodStart = null;
      }
    } else if (record.action === 'resume') {
      if (isPaused) {
        // Start new period from resume
        currentPeriodStart = recordTime;
        isPaused = false;
      }
    } else if (record.action === 'stop') {
      if (currentPeriodStart && !isPaused) {
        // Add time from period start to stop
        totalWorkedMs += recordTime.getTime() - currentPeriodStart.getTime();
      }
      // Shift ended, return total
      return totalWorkedMs;
    }
  }

  // If we reach here, the shift is still active (no stop found)
  // If not paused, add time from last period start to now
  if (currentPeriodStart && !isPaused) {
    totalWorkedMs += currentTime.getTime() - currentPeriodStart.getTime();
  }

  return totalWorkedMs;
}

/**
 * Determines the current shift state based on attendance records.
 * @param records - Array of attendance records
 * @returns 'active' | 'paused' | 'idle' | 'finished'
 */
export function getShiftStateFromRecords(records: AttendanceRecord[]): 'active' | 'paused' | 'idle' | 'finished' {
  if (records.length === 0) {
    return 'idle';
  }

  // Sort records by timestamp (oldest first) to process chronologically
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Find the most recent start action
  let lastStartIndex = -1;
  for (let i = sortedRecords.length - 1; i >= 0; i--) {
    if (sortedRecords[i].action === 'start') {
      lastStartIndex = i;
      break;
    }
  }

  // If no start found, return idle
  if (lastStartIndex === -1) {
    return 'idle';
  }

  // Check actions after the last start
  let isPaused = false;
  for (let i = lastStartIndex + 1; i < sortedRecords.length; i++) {
    const record = sortedRecords[i];
    if (record.action === 'stop') {
      return 'finished';
    }
    if (record.action === 'pause') {
      isPaused = true;
    }
    if (record.action === 'resume') {
      isPaused = false;
    }
  }

  // If we reach here, shift is still active (no stop found)
  return isPaused ? 'paused' : 'active';
}

