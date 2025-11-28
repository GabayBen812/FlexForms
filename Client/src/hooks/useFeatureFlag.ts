import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { featureFlagCache } from '@/services/featureFlagCache';

export function useFeatureFlag(key: string) {
  const { user } = useAuth();
  // If no key provided, consider it enabled immediately (no feature flag check needed)
  const hasKey = key && key.trim() !== "";
  const [isEnabled, setIsEnabled] = useState(!hasKey);
  const [isLoading, setIsLoading] = useState(hasKey);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      // If no key provided, consider it enabled (no feature flag check needed)
      if (!key || key.trim() === "") {
        setIsEnabled(true);
        setIsLoading(false);
        return;
      }

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

/**
 * Hook to check multiple feature flags at once
 * Returns a map of feature flag keys to their enabled status
 */
export function useFeatureFlags(keys: string[]) {
  const { user } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFeatureFlags = async () => {
      if (!user?.organizationId) {
        const defaultFlags: Record<string, boolean> = {};
        keys.forEach(key => {
          defaultFlags[key] = false;
        });
        setFlags(defaultFlags);
        setIsLoading(false);
        return;
      }

      const flagResults: Record<string, boolean> = {};
      const uncachedKeys: string[] = [];

      // Check cache first for all keys
      keys.forEach(key => {
        const cacheKey = `${key}_${user.organizationId}`;
        const cachedValue = featureFlagCache.get(cacheKey);
        if (cachedValue !== null) {
          flagResults[key] = cachedValue;
        } else {
          uncachedKeys.push(key);
        }
      });

      // Fetch uncached flags
      if (uncachedKeys.length > 0) {
        try {
          const promises = uncachedKeys.map(async (key) => {
            try {
              const response = await apiClient.get(`/feature-flags/check/${key}/${user.organizationId}`);
              const value = response.data;
              const cacheKey = `${key}_${user.organizationId}`;
              featureFlagCache.set(cacheKey, value);
              return { key, value };
            } catch (error) {
              console.error(`Error checking feature flag ${key}:`, error);
              return { key, value: false };
            }
          });

          const results = await Promise.all(promises);
          results.forEach(({ key, value }) => {
            flagResults[key] = value;
          });
        } catch (error) {
          console.error('Error checking feature flags:', error);
          uncachedKeys.forEach(key => {
            flagResults[key] = false;
          });
        }
      }

      setFlags(flagResults);
      setIsLoading(false);
    };

    if (keys.length === 0) {
      setFlags({});
      setIsLoading(false);
      return;
    }

    checkFeatureFlags();
  }, [JSON.stringify([...keys].sort()), user?.organizationId]);

  return { flags, isLoading };
} 