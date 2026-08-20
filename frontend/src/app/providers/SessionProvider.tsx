import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Organization } from '../../types/domain';
import { setAccessToken, clearAccessToken } from '../../lib/authTokenStore';
import { refresh as refreshApi, getCurrentUser as getCurrentUserApi, logout as logoutApi } from '../../api/auth';

export interface SessionContextValue {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, organization: Organization, token: string) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // App boot hydration sequence
  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        // Step 1: Attempt refresh
        const refreshRes = await refreshApi();
        const token = refreshRes.data?.accessToken;

        if (token) {
          setAccessToken(token);

          // Step 2: Fetch current user
          const meRes = await getCurrentUserApi();
          if (isMounted && meRes.data?.user) {
            const currentUser = meRes.data.user;
            setUser(currentUser);
            if (currentUser.organization) {
              setOrganization(currentUser.organization);
            }
          }
        } else {
          clearAccessToken();
          if (isMounted) {
            setUser(null);
            setOrganization(null);
          }
        }
      } catch {
        clearAccessToken();
        if (isMounted) {
          setUser(null);
          setOrganization(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((newUser: User, newOrg: Organization, token: string) => {
    setAccessToken(token);
    setUser(newUser);
    setOrganization(newOrg);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors during logout
    } finally {
      clearAccessToken();
      setUser(null);
      setOrganization(null);
    }
  }, []);

  const contextValue: SessionContextValue = {
    user,
    organization,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
