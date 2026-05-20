import { useCallback, useState } from "react";
import { apiLogin } from "../lib/api";
import {
  clearSession,
  formatMobileDisplay,
  getRegisteredUsers,
  getSession,
  normalizeMobile,
  registerUser,
  setSession,
} from "../lib/auth";

export function useAuth() {
  const [session, setSessionState] = useState(getSession);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const login = useCallback(async (input: string) => {
    setLoginError(null);
    const normalized = normalizeMobile(input);
    if (!normalized) {
      setLoginError("Enter a 10-digit mobile number.");
      return false;
    }

    setLoggingIn(true);
    try {
      const result = await apiLogin(normalized);
      registerUser(normalized);
      setSession(result.mobile, result.token);
      setSessionState({
        mobile: result.mobile,
        token: result.token,
        loggedInAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      setLoginError(
        e instanceof Error ? e.message : "Could not connect to server"
      );
      return false;
    } finally {
      setLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
    setLoginError(null);
  }, []);

  const mobile = session?.mobile ?? null;
  const token = session?.token ?? null;

  return {
    mobile,
    token,
    isLoggedIn: !!mobile && !!token,
    login,
    logout,
    loginError,
    loggingIn,
    recentUsers: getRegisteredUsers(),
    displayMobile: mobile ? formatMobileDisplay(mobile) : "",
  };
}
