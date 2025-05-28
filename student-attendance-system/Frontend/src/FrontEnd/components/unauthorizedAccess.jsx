"use client"

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "sonner"

export default function UnauthorizedAccess({ error, onRetry }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [countdown, setCountdown] = useState(5)
  const [toastShown, setToastShown] = useState(false)

  useEffect(() => {
    if (!toastShown) {
      setToastShown(true)
      toast.error("Access Denied", {
        description: error || "You don't have permission to access this resource",
        duration: 4000,
      })
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleAutoRedirect()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, []) 

  const handleAutoRedirect = () => {
    localStorage.clear()
    sessionStorage.clear()

    navigate("/", { replace: true })
  }

  const handleGoBack = () => {
    if (location.pathname === "/" || window.history.length <= 1) {
      navigate("/", { replace: true })
    } else {
      navigate(-1)
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-3">Access Denied</h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">{error || "You don't have permission to access this resource."}</p>
          <p className="text-sm text-gray-500">Redirecting to login in {countdown} seconds...</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Try Again
          </button>

          <button
            onClick={handleGoBack}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            {location.pathname === "/" ? "Stay Here" : "Go Back"}
          </button>

          <button
            onClick={() => navigate("/", { replace: true })}
            className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 text-sm"
          >
            Return to Home
          </button>
        </div>

        
      </div>
    </div>
  )
}
