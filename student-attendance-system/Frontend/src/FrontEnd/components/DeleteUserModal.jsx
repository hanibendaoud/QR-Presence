"use client"

import { useState } from "react"
import { toast } from "sonner"

const DeleteUserModal = ({ user, type, onClose, onDelete, accessToken }) => {
  const [loading, setLoading] = useState(false)

  // Build the display name
  const userName =
    type === "professor"
      ? `${user.user?.first_name || ""} ${user.user?.last_name || ""}`.trim()
      : `${user.first_name || ""} ${user.last_name || ""}`.trim()

  const handleDelete = async () => {
    setLoading(true)

    try {
      // Ensure trailing slash on your DRF endpoints
      const base =
        type === "professor"
          ? `http://127.0.0.1:8000/home/professors/${user.id}/`
          : `http://127.0.0.1:8000/home/students/${user.id}/`

      console.log(`DELETE ${type} →`, base)

      const response = await fetch(base, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`Response status: ${response.status}`)

      if (response.status === 204) {
        // No Content = success
        toast.success(`${type === "professor" ? "Professor" : "Student"} deleted successfully`)
        onDelete(user.id, type)
        return
      }

      // Some DRF configs return 200 + JSON
      if (response.ok) {
        const data = await response.json().catch(() => null)
        console.log("Delete response JSON:", data)
        toast.success(`${type === "professor" ? "Professor" : "Student"} deleted successfully`)
        onDelete(user.id, type)
        return
      }

      // Non-OK, non-204 → gather error info
      let errMsg = `HTTP ${response.status}: ${response.statusText}`
      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("application/json")) {
        const errData = await response.json().catch(() => null)
        if (errData?.message) errMsg = errData.message
      } else {
        // Likely HTML error page
        const text = await response.text().catch(() => "")
        console.error("Server error HTML:", text.substring(0, 200))
        errMsg = "Server error — please check your API implementation"
      }

      throw new Error(errMsg)
    } catch (error) {
      console.error(`Error deleting ${type}:`, error)

      let description = "Please try again or contact support."
      const msg = error.message || ""

      if (msg.includes("404")) {
        description = "This user might already have been deleted."
      } else if (msg.includes("403")) {
        description = "You don’t have permission to delete this user."
      } else if (msg.toLowerCase().includes("server error")) {
        description = "The delete API endpoint returned an error. Please check with your backend team."
      }

      toast.error(`Failed to delete ${type}`, { description })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete {type === "professor" ? "Professor" : "Student"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">Are you sure?</h4>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-gray-700">
              You are about to delete <strong>{userName || "this user"}</strong>. This will permanently remove all their data.
            </p>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> If this still fails, please contact your system administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteUserModal
