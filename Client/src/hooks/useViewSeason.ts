import { useState, useEffect, useCallback } from "react";
import { useOrganization } from "./useOrganization";
import { useAuth } from "./useAuth";

interface UseViewSeasonReturn {
  viewSeasonId: string | null;
  setViewSeasonId: (seasonId: string | null) => void;
  isViewingDifferentSeason: boolean;
}

/**
 * Hook to manage the "view season" for system_admin users.
 * This allows admins to view historical data without changing the organization's current season.
 * 
 * For system_admin users:
 * - Reads/writes to localStorage with key `viewSeasonId_${organizationId}`
 * - Returns the selected view season ID
 * 
 * For other users:
 * - Always returns the organization's current season
 * - Ignores localStorage
 */
export function useViewSeason(): UseViewSeasonReturn {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const isSystemAdmin = user?.role === "system_admin";
  const organizationId = organization?._id;
  const orgCurrentSeasonId = organization?.currentSeasonId || null;

  // Get the localStorage key for this organization
  const getStorageKey = useCallback(() => {
    if (!organizationId) return null;
    return `viewSeasonId_${organizationId}`;
  }, [organizationId]);

  // Initialize state from localStorage (only for system_admin)
  const [viewSeasonId, setViewSeasonIdState] = useState<string | null>(() => {
    if (!isSystemAdmin || !organizationId) {
      return orgCurrentSeasonId;
    }
    
    const storageKey = `viewSeasonId_${organizationId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored || orgCurrentSeasonId;
    } catch (error) {
      console.error("Error reading viewSeasonId from localStorage:", error);
      return orgCurrentSeasonId;
    }
  });

  // Update localStorage when viewSeasonId changes (only for system_admin)
  useEffect(() => {
    if (!isSystemAdmin || !organizationId) return;
    
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      if (viewSeasonId) {
        localStorage.setItem(storageKey, viewSeasonId);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error("Error writing viewSeasonId to localStorage:", error);
    }
  }, [viewSeasonId, organizationId, isSystemAdmin, getStorageKey]);

  // Sync with organization's current season when it changes (fallback)
  useEffect(() => {
    if (!isSystemAdmin) {
      // For non-admin users, always use org's current season
      setViewSeasonIdState(orgCurrentSeasonId);
    } else if (!viewSeasonId && orgCurrentSeasonId) {
      // For admin users, if no view season is set, use org's current season
      setViewSeasonIdState(orgCurrentSeasonId);
    }
  }, [orgCurrentSeasonId, isSystemAdmin, viewSeasonId]);

  // Setter function that respects user role
  const setViewSeasonId = useCallback((seasonId: string | null) => {
    if (!isSystemAdmin) {
      // Non-admin users cannot change the view season
      return;
    }
    setViewSeasonIdState(seasonId);
  }, [isSystemAdmin]);

  // Check if viewing a different season than the organization's current season
  const isViewingDifferentSeason = isSystemAdmin && 
    viewSeasonId !== null && 
    orgCurrentSeasonId !== null && 
    viewSeasonId !== orgCurrentSeasonId;

  return {
    viewSeasonId: isSystemAdmin ? viewSeasonId : orgCurrentSeasonId,
    setViewSeasonId,
    isViewingDifferentSeason,
  };
}



