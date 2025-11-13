export interface AttendanceShift {
  _id?: string;
  employeeName: string;
  reportedDate: string; // DD/MM/YYYY
  startTime: string; // HH:MM:SS
  pauseTime: string | null; // HH:MM:SS
  resumeTime: string | null; // HH:MM:SS
  stopTime: string | null; // HH:MM:SS
  totalTime: string; // HH:MM:SS
}

