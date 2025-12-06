import { useState, useCallback } from 'react';

import { getCurrentUserProfile, loginUser, registerUser, logoutUser } from '../services/auth';
import type { UserProfile } from '../types/index.ts';
import { User } from '../types.ts';

function mapProfileToUser(profile: UserProfile): User {
  const fallbackName = profile.username || '未命名用户'
  const fallbackUid = profile.uid != null ? profile.uid.toString() : profile.id.slice(0, 8)

  return {
    id: profile.id,
    email: '',
    username: fallbackName,
    uid: fallbackUid,
    avatar: profile.avatar_url || undefined,
    createdAt: profile.created_at || ''
  }
}

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const profile = await getCurrentUserProfile();
      setCurrentUser(mapProfileToUser(profile));
      return profile;
    } catch {
      setCurrentUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsAuthLoading(true);
    try {
      await loginUser(email, password);
      return await fetchCurrentUser();
    } finally {
      setIsAuthLoading(false);
    }
  }, [fetchCurrentUser]);

  const register = useCallback(async (email: string, password: string, username: string) => {
    await registerUser(email, password, username);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    setCurrentUser,
    isAuthLoading,
    setIsAuthLoading,
    fetchCurrentUser,
    login,
    register,
    logout
  };
};
