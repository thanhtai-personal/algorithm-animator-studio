import { useMutation } from '@tanstack/react-query';
import { updateUserSettings } from '../services/user';
import type { UserSettings } from '@/types/userSettings';

export function useUpdateUserSettingsMutation() {
  return useMutation({
    mutationKey: ['updateUserSettings'],
    mutationFn: (settings: Partial<UserSettings>) => updateUserSettings(settings),
  });
}
