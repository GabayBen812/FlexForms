export interface FeatureFlag {
  _id: string;
  key: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  organizationIds: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | { _id: string; name: string };
  updatedBy?: string | { _id: string; name: string };
} 