import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface WithFeatureFlagProps {
  featureFlag: string;
  fallback?: React.ReactNode;
}

export function withFeatureFlag<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  { featureFlag, fallback = null }: WithFeatureFlagProps
) {
  return function WithFeatureFlagComponent(props: P) {
    const { isEnabled, isLoading } = useFeatureFlag(featureFlag);

    if (isLoading) {
      return null; // or a loading spinner if you prefer
    }

    if (!isEnabled) {
      return <>{fallback}</>;
    }

    return <WrappedComponent {...props} />;
  };
} 