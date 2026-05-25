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
import {
  isApiUnreachableError,
  LOCAL_TOKEN,
  useCloudApi,
} from "../lib/devMode";

export function useAuth() {
  const [session, setSessionState] = useState(getSession);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [localOnly, setLocalOnly] = useState(
    () => getSession()?.token === LOCAL_TOKEN
  );

  const login = useCallback(async (input: string) => {
    setLoginError(null);
    const normalized = normalizeMobile(input);
    if (!normalized) {
      setLoginError("Enter a 10-digit mobile number.");
      return false;
    }

    setLoggingIn(true);

    const finishLocal = () => {
      registerUser(normalized);
      setSession(normalized, LOCAL_TOKEN);
      setSessionState({
        mobile: normalized,
        token: LOCAL_TOKEN,
        loggedInAt: new Date().toISOString(),
      });
      setLocalOnly(true);
      return true;
    };

    if (!useCloudApi()) {
      setLoggingIn(false);
      return finishLocal();
    }

    try {
      const result = await apiLogin(normalized);
      registerUser(normalized);
      setSession(result.mobile, result.token);
      setSessionState({
        mobile: result.mobile,
        token: result.token,
        loggedInAt: new Date().toISOString(),
      });
      setLocalOnly(false);
      return true;
    } catch (e) {
      if (import.meta.env.DEV && isApiUnreachableError(e)) {
        setLoggingIn(false);
        return finishLocal();
      }
      const msg =
        e instanceof Error ? e.message : "Could not connect to server";
      if (msg === "Not Found") {
        setLoginError(
          "API not found. Open YOUR-VERCEL-URL/api/health in browser — if 404, redeploy latest code from GitHub."
        );
      } else if (msg.includes("MONGODB_URI") || msg.includes("JWT_SECRET")) {
        setLoginError(`Server config: ${msg}. Add env vars on Vercel → Redeploy.`);
      } else {
        setLoginError(msg);
      }
      return false;
    } finally {
      setLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
    setLoginError(null);
    setLocalOnly(false);
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
    localOnly,
    recentUsers: getRegisteredUsers(),
    displayMobile: mobile ? formatMobileDisplay(mobile) : "",
  };
}
