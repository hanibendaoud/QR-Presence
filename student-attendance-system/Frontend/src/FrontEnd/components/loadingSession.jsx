const AuthLoading = () => {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin animation-delay-150"></div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xl font-semibold text-gray-800">Verifying your session...</p>
        <p className="text-sm text-gray-600">Please wait while we authenticate your account</p>
      </div>

      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-100"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-200"></div>
      </div>
    </div>
  )
}

export default AuthLoading
