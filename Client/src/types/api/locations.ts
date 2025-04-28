export interface Location {
  id: number;
  name: {
    he: string;
    en: string;
  };
  roomNumber?: number | null;
  organizationId: number;
}
