import dayjs from "dayjs";
import { CourseSchedule } from "@/types/courses/Course";

/**
 * Generates all dates that match the course schedule
 * @param schedules - Array of course schedule items
 * @returns Array of dates (Date objects) that match the schedule, sorted
 */
export function getCourseScheduleDates(schedules: CourseSchedule[]): Date[] {
  if (!schedules || schedules.length === 0) {
    return [];
  }

  const dateSet = new Set<string>();

  schedules.forEach((schedule) => {
    const startDate = dayjs(schedule.startDate);
    const endDate = dayjs(schedule.endDate);
    const dayOfWeek = schedule.dayOfWeek;

    // Iterate through all dates from startDate to endDate
    let currentDate = startDate;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
      // Check if current date matches the day of week
      if (currentDate.day() === dayOfWeek) {
        // Store as ISO string for uniqueness
        dateSet.add(currentDate.format("YYYY-MM-DD"));
      }
      currentDate = currentDate.add(1, "day");
    }
  });

  // Convert back to Date objects and sort
  return Array.from(dateSet)
    .map((dateStr) => dayjs(dateStr).toDate())
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Gets the default attendance date - today if it matches schedule, otherwise next scheduled date
 * @param schedules - Array of course schedule items
 * @returns Date object for the default attendance date
 */
export function getDefaultAttendanceDate(schedules: CourseSchedule[]): Date {
  if (!schedules || schedules.length === 0) {
    return new Date();
  }

  const today = dayjs().startOf("day");
  const scheduleDates = getCourseScheduleDates(schedules);

  // Check if today matches any schedule date
  const todayMatches = scheduleDates.some((date) =>
    dayjs(date).isSame(today, "day")
  );

  if (todayMatches) {
    return today.toDate();
  }

  // Find next scheduled date
  const nextDate = scheduleDates.find((date) => dayjs(date).isAfter(today));

  // If no future date found, return the last scheduled date (or today as fallback)
  return nextDate || scheduleDates[scheduleDates.length - 1] || today.toDate();
}

/**
 * Checks if a date matches the course schedule
 * @param date - Date to check
 * @param schedules - Array of course schedule items
 * @returns true if date matches schedule, false otherwise
 */
export function isDateInSchedule(date: Date, schedules: CourseSchedule[]): boolean {
  if (!schedules || schedules.length === 0) {
    return false;
  }

  const dateToCheck = dayjs(date).startOf("day");
  const scheduleDates = getCourseScheduleDates(schedules);

  return scheduleDates.some((scheduleDate) =>
    dayjs(scheduleDate).isSame(dateToCheck, "day")
  );
}

