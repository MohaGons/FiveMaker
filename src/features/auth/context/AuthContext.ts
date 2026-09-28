import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
