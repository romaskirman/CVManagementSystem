import { useEffect, useRef, useState } from 'react';
import { profileApi } from '../../../shared/api/profile.api';
import { ProfileSavePayload } from '../types';

type UseProfileAutosaveParams = {
  enabled: boolean;
  payload: ProfileSavePayload | null;
  onSaved: (nextVersion: number) => void;
  onConflict: () => void;
};

export function useProfileAutosave({
  enabled,
  payload,
  onSaved,
  onConflict
}: UseProfileAutosaveParams) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const latestPayloadRef = useRef<ProfileSavePayload | null>(payload);

  useEffect(() => {
    latestPayloadRef.current = payload;
  }, [payload]);

  const markDirty = () => {
    setIsDirty(true);
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(async () => {
      const currentPayload = latestPayloadRef.current;

      if (!currentPayload || !isDirty || isSaving) {
        return;
      }

      try {
        setIsSaving(true);
        const saved = await profileApi.saveMine(currentPayload);
        if (typeof saved.version === 'number') {
          onSaved(saved.version);
        }
        setIsDirty(false);
        setLastSavedAt(new Date().toISOString());
      } catch (error: any) {
        if (error?.response?.status === 409) {
          onConflict();
        }
      } finally {
        setIsSaving(false);
      }
    }, 7000);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, isDirty, isSaving, onSaved, onConflict]);

  return {
    isDirty,
    isSaving,
    lastSavedAt,
    markDirty
  };
}
