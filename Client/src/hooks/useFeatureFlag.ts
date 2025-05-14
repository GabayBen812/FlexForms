import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { featureFlagCache } from '@/services/featureFlagCache';

export function useFeatureFlag(key: string) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      if (!user?.organizationId) {
        setIsEnabled(false);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `${key}_${user.organizationId}`;
      const cachedValue = featureFlagCache.get(cacheKey);
      
      if (cachedValue !== null) {
        setIsEnabled(cachedValue);
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/feature-flags/check/${key}/${user.organizationId}`);
        const value = response.data;
        setIsEnabled(value);
        featureFlagCache.set(cacheKey, value);
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeatureFlag();
  }, [key, user?.organizationId]);

  return { isEnabled, isLoading };
} 