import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useLogin } from "../contexts/LoginContext"
import AuthLoading from "./loadingSession"
import UnauthorizedAccess from "./unauthorizedAccess"

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isLoading, isAuthenticated, isUnauthorized, authState } = useLogin()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoading />
  }

  if (isUnauthorized) {
    return <UnauthorizedAccess />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <UnauthorizedAccess error={`Access denied. Required role: ${allowedRoles.join(" or ")}`} />
  }

  return <Outlet />
}

export const NonAuthRoute = () => {
  const { user, isLoading, isAuthenticated } = useLogin()

  if (isLoading) {
    return <AuthLoading />
  }

  if (isAuthenticated && user) {
    const redirectPath = user.role === "admin" ? "/admin/dashboard" : "/dashboard"
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}

export const withRoleProtection = (Component, allowedRoles = []) => {
  return function ProtectedComponent(props) {
    const { user, isLoading, isAuthenticated } = useLogin()

    if (isLoading) {
      return <AuthLoading />
    }

    if (!isAuthenticated || !user) {
      return <Navigate to="/" replace />
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <UnauthorizedAccess error={`Access denied. Required role: ${allowedRoles.join(" or ")}`} />
    }

    return <Component {...props} />
  }
}

export default ProtectedRoute
