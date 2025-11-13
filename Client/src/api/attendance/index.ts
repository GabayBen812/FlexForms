import apiClient from "@/api/apiClient";
import { AttendanceShift } from "@/types/attendance";

export async function fetchAttendanceByOrganization(
  organizationId: string
): Promise<AttendanceShift[]> {
  const response = await apiClient.get<AttendanceShift[]>(
    `/emp/attendance/organization/${organizationId}`
  );
  return response.data;
}

