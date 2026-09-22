import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { friendlyError } from '@/lib/errors';
import type { Profile, Role, Shop } from '@/types';

interface AuthState {
  /** True only while we check for a saved login when the app opens. */
  initializing: boolean;
  /** True once we know if this user already has a shop (or the check failed). */
  profileReady: boolean;
  session: Session | null;
  profile: Profile | null;
  shop: Shop | null;
  role: Role | null;
  isOwner: boolean;
  /** Set when loading the profile failed (for example no internet). */
  profileError: string | null;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  createShop: (shopName: string, ownerName: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateShopLocal: (shop: Shop) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

type ProfileWithShop = Profile & { shops: Shop | null };

/** Result of loading the profile. It remembers WHICH user it belongs to. */
interface Loaded {
  userId: string;
  profile: Profile | null;
  shop: Shop | null;
  error: string | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(isSupabaseConfigured);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const userId = session?.user.id ?? null;
  // Data of a previous user is never shown to the next user who logs in.
  const current = loaded && loaded.userId === userId ? loaded : null;
  const profile = current?.profile ?? null;
  const shop = current?.shop ?? null;
  const profileError = current?.error ?? null;

  // 1. Restore the saved login and listen for login / logout.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setInitializing(false));

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (id: string) => {
    setLoadingProfile(true);
    // A retry starts from a clean slate (hides the old error while loading).
    setLoaded((prev) =>
      prev && prev.userId === id && prev.error ? { ...prev, error: null } : prev,
    );
    try {
      const fetchOnce = async (): Promise<ProfileWithShop | null> => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, shops(*)')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data as ProfileWithShop | null;
      };

      let row = await fetchOnce();
      if (!row) {
        // New login: maybe the owner already added this phone as staff.
        const { data: joined, error } = await supabase.rpc('claim_staff_invite');
        if (error) throw error;
        if (joined) row = await fetchOnce();
      }

      if (row) {
        const { shops, ...rest } = row;
        setLoaded({ userId: id, profile: rest, shop: shops, error: null });
      } else {
        setLoaded({ userId: id, profile: null, shop: null, error: null });
      }
    } catch (error) {
      const message = friendlyError(error);
      setLoaded((prev) =>
        prev && prev.userId === id
          ? { ...prev, error: message }
          : { userId: id, profile: null, shop: null, error: message },
      );
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // 2. Whenever a user logs in, load their profile + shop.
  useEffect(() => {
    // Fetching from the server on login is exactly what an effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) void loadProfile(userId);
  }, [userId, loadProfile]);

  const sendOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: code,
      type: 'sms',
    });
    if (error) throw error;
  }, []);

  const createShop = useCallback(
    async (shopName: string, ownerName: string) => {
      const { error } = await supabase.rpc('create_shop', {
        p_shop_name: shopName,
        p_owner_name: ownerName,
      });
      if (error) throw error;
      if (userId) await loadProfile(userId);
    },
    [userId, loadProfile],
  );

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId);
  }, [userId, loadProfile]);

  const updateShopLocal = useCallback((next: Shop) => {
    setLoaded((prev) => (prev ? { ...prev, shop: next } : prev));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setLoaded(null);
  }, []);

  // While a retry is running and there is no profile yet, we are not "ready".
  const profileReady = current !== null && (current.profile !== null || !loadingProfile);

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      profileReady,
      session,
      profile,
      shop,
      role: profile?.role ?? null,
      isOwner: profile?.role === 'owner',
      profileError,
      sendOtp,
      verifyOtp,
      createShop,
      refreshProfile,
      updateShopLocal,
      signOut,
    }),
    [
      initializing,
      profileReady,
      session,
      profile,
      shop,
      profileError,
      sendOtp,
      verifyOtp,
      createShop,
      refreshProfile,
      updateShopLocal,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** For screens that only run when a shop is loaded (all screens in the (main) group). */
export function useShop(): { shop: Shop; profile: Profile; isOwner: boolean } {
  const { shop, profile, isOwner } = useAuth();
  if (!shop || !profile) throw new Error('useShop needs a logged in user with a shop');
  return { shop, profile, isOwner };
}
