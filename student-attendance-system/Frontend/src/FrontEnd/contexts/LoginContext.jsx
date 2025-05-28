"use client"

import { createContext, useState, useEffect, useCallback, useMemo, useContext, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { toast } from "sonner"
import AuthLoading from "../components/loadingSession"
import UnauthorizedAccess from "../components/unauthorizedAccess"

export const LoginContext = createContext()

const AUTH_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHORIZED: "unauthorized",
  ERROR: "error",
}

export const UserProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken } = useAuth()

  const [state, setState] = useState(() => {
    try {
      const storedToken = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      return {
        user: storedUser ? JSON.parse(storedUser) : null,
        token: storedToken ? JSON.parse(storedToken) : null,
        authState: AUTH_STATES.IDLE,
        error: null,
        debugInfo: { lastCheck: null, attempts: 0 },
      }
    } catch (error) {
      console.error("Failed to parse stored auth data:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      return {
        user: null,
        token: null,
        authState: AUTH_STATES.ERROR,
        error: "Failed to load session data - corrupted storage",
        debugInfo: { lastCheck: new Date().toISOString(), attempts: 0 },
      }
    }
  })

  const hasShownErrorToast = useRef(false)

  const { user, token, authState, error, debugInfo } = state

  const updateState = useCallback((updates) => {
    setState((prev) => ({
      ...prev,
      ...updates,
      debugInfo: {
        ...prev.debugInfo,
        lastCheck: new Date().toISOString(),
        ...(updates.debugInfo || {}),
      },
    }))
  }, [])

  const logout = useCallback(
    (errorMessage = null, shouldRedirect = true) => {
      console.log("Logout triggered:", { errorMessage, shouldRedirect })

      localStorage.removeItem("token")
      localStorage.removeItem("user")
      sessionStorage.clear()

      updateState({
        user: null,
        token: null,
        authState: AUTH_STATES.IDLE,
        error: errorMessage,
        debugInfo: {
          lastLogout: new Date().toISOString(),
          reason: errorMessage || "Manual logout",
        },
      })

      if (errorMessage && !hasShownErrorToast.current) {
        hasShownErrorToast.current = true
        toast.error("Authentication Error", {
          description: errorMessage,
          duration: 4000,
        })
      } else if (!errorMessage) {
        toast.success("Logged Out", {
          description: "You have been successfully logged out",
          duration: 3000,
        })
      }

      if (shouldRedirect) {
        navigate("/", { replace: true })
      }
    },
    [navigate, updateState],
  )

  const validateToken = useCallback((tokenToValidate) => {
    if (!tokenToValidate || typeof tokenToValidate !== "object") {
      console.log("Token validation failed: Invalid token structure")
      return false
    }

    if (!tokenToValidate.access_token) {
      console.log("Token validation failed: Missing access_token")
      return false
    }

    if (tokenToValidate.expires_at && Date.now() > tokenToValidate.expires_at * 1000) {
      console.log("Token validation failed: Token expired")
      return false
    }

    return true
  }, [])

  const verifyUserRole = useCallback(
    async (email) => {
      if (!email || !accessToken) {
        throw new Error("Missing email or access token for role verification")
      }

      console.log("Verifying role for email:", email)

      try {
        const adminRequest = fetch("http://127.0.0.1:8000/admins/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        })
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])

        const profRequest = fetch("http://127.0.0.1:8000/home/professors/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        })
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])

        const [adminData, profData] = await Promise.all([adminRequest, profRequest])

        console.log("Role verification data:", {
          adminCount: adminData.length,
          profCount: profData.length,
          email,
        })

        if (Array.isArray(adminData) && adminData.some((admin) => admin.email === email)) {
          console.log("User verified as admin")
          return "admin"
        }

        if (Array.isArray(profData) && profData.some((prof) => prof.user?.email === email)) {
          console.log("User verified as professor")
          return "professor"
        }

        console.log("User not found in any role")
        return null
      } catch (error) {
        console.error("Role verification error:", error)
        throw new Error(`Role verification failed: ${error.message}`)
      }
    },
    [accessToken],
  )

  const fetchGoogleUserInfo = useCallback(async (accessToken) => {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`)
    }

    const userInfo = await response.json()

    if (!userInfo?.email) {
      throw new Error("Invalid user data received from Google")
    }

    return userInfo
  }, [])

  const initializeAuth = useCallback(async () => {
    console.log("Initializing authentication...")

    updateState({
      authState: AUTH_STATES.LOADING,
      debugInfo: { attempts: debugInfo.attempts + 1 },
    })

    try {
      if (!token) {
        console.log("No token found, setting to idle state")
        updateState({ authState: AUTH_STATES.IDLE })
        return
      }

      if (user && validateToken(token)) {
        console.log("User already authenticated, verifying session...")

        try {
          await fetchGoogleUserInfo(token.access_token)
          updateState({ authState: AUTH_STATES.AUTHENTICATED })

          hasShownErrorToast.current = false

          if (location.pathname === "/") {
            const redirectPath = user.role === "admin" ? "/admin/dashboard" : "/dashboard"
            navigate(redirectPath, { replace: true })
          }
          return
        } catch (error) {
          console.log("Session validation failed, re-authenticating..."+error)
        }
      }

      if (!validateToken(token)) {
        throw new Error("Invalid or expired token")
      }

      console.log("Fetching user info from Google...")
      const googleUserInfo = await fetchGoogleUserInfo(token.access_token)

      console.log("Verifying user role...")
      const userRole = await verifyUserRole(googleUserInfo.email)

      if (!userRole) {
        throw new Error("User not authorized - no valid role found")
      }

      const userData = {
        email: googleUserInfo.email,
        firstName: googleUserInfo.given_name,
        lastName: googleUserInfo.family_name,
        picture: googleUserInfo.picture,
        role: userRole,
        lastLogin: new Date().toISOString(),
      }

      console.log("Authentication successful:", { email: userData.email, role: userData.role })

      hasShownErrorToast.current = false

      updateState({
        user: userData,
        authState: AUTH_STATES.AUTHENTICATED,
        error: null,
      })

      localStorage.setItem("user", JSON.stringify(userData))

      if (location.pathname === "/") {
        const redirectPath = userRole === "admin" ? "/admin/dashboard" : "/dashboard"
        navigate(redirectPath, { replace: true })
      }
    } catch (error) {
      console.error("Authentication initialization failed:", error)

      updateState({
        authState: AUTH_STATES.UNAUTHORIZED,
        error: error.message,
      })

      setTimeout(() => {
        logout(error.message)
      }, 2000)
    }
  }, [
    token,
    user,
    validateToken,
    verifyUserRole,
    fetchGoogleUserInfo,
    navigate,
    location.pathname,
    updateState,
    logout,
    debugInfo.attempts,
  ])

  useEffect(() => {
    if (
      authState === AUTH_STATES.IDLE ||
      (token && authState !== AUTH_STATES.LOADING && authState !== AUTH_STATES.AUTHENTICATED)
    ) {
      initializeAuth()
    }
  }, [token, authState, initializeAuth])

  const contextValue = useMemo(
    () => ({
      user,
      token,
      authState,
      error,
      debugInfo,
      isLoading: authState === AUTH_STATES.LOADING,
      isAuthenticated: authState === AUTH_STATES.AUTHENTICATED && !!user && validateToken(token),
      isUnauthorized: authState === AUTH_STATES.UNAUTHORIZED,
      hasRole: (role) => user?.role === role,
      setUser: (newUser) => {
        updateState({ user: newUser })
        if (newUser) {
          localStorage.setItem("user", JSON.stringify(newUser))
        }
      },
      setToken: (newToken) => {
        updateState({ token: newToken, authState: AUTH_STATES.IDLE })
        if (newToken) {
          localStorage.setItem("token", JSON.stringify(newToken))
        }
      },
      logout,
      retry: () => {
        hasShownErrorToast.current = false
        updateState({ authState: AUTH_STATES.IDLE, error: null })
      },
    }),
    [user, token, authState, error, debugInfo, updateState, logout, validateToken],
  )

  if (authState === AUTH_STATES.LOADING) {
    return <AuthLoading />
  }

  if (authState === AUTH_STATES.UNAUTHORIZED || authState === AUTH_STATES.ERROR) {
    return <UnauthorizedAccess error={error} onRetry={contextValue.retry} />
  }

  return <LoginContext.Provider value={contextValue}>{children}</LoginContext.Provider>
}

export const useLogin = () => {
  const context = useContext(LoginContext)
  if (!context) {
    throw new Error("useLogin must be used within a UserProvider")
  }
  return context
}
