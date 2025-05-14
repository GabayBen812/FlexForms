export class CreateOrganizationDto {
    name!: string;
    description?: string;
  }
  
export class AssignFeatureFlagsDto {
  featureFlagIds!: string[];
}

export class RemoveFeatureFlagDto {
  featureFlagId!: string;
}
  