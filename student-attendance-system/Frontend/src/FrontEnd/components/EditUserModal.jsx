"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

const EditUserModal = ({ user, type, onClose, onUpdate, accessToken }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    group: "",
    module: "",
  })
  const [availableGroups, setAvailableGroups] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    setFormData({
      first_name: user.user?.first_name || user.first_name || "",
      last_name: user.user?.last_name || user.last_name || "",
      email: user.user?.email || user.email || "",
      group: user.student_group?.id?.toString() || "",
      module: user.module || "",
    })

    if (type === "student") fetchGroups()
  }, [user, type, accessToken])

  const fetchGroups = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/home/groups/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error(res.statusText)
      const groups = await res.json()
      setAvailableGroups(groups)
    } catch (err) {
      console.error("Failed to load groups:", err)
      toast.error("Failed to load groups")
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const { first_name, last_name, email } = formData
    
    if (!first_name.trim() || !last_name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    return true
  }

  const detectChanges = () => {
    const originalFirstName = user.user?.first_name || user.first_name || ""
    const originalLastName = user.user?.last_name || user.last_name || ""
    const originalEmail = user.user?.email || user.email || ""
    const originalGroup = user.student_group?.id?.toString() || ""
    const originalModule = user.module || ""

    return {
      hasUserChanges: 
        formData.first_name !== originalFirstName ||
        formData.last_name !== originalLastName ||
        formData.email !== originalEmail,
      hasGroupChange: type === "student" && formData.group !== originalGroup,
      hasModuleChange: type === "professor" && formData.module !== originalModule
    }
  }

  const buildUpdatePayload = () => {
    if (type === "student") {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
      }
      
      // Only include student_group_id if a group is selected
      if (formData.group) {
        payload.student_group_id = parseInt(formData.group)
      } else {
        payload.student_group_id = null
      }
      
      return payload
    }

    if (type === "professor") {
      return {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        module: formData.module.trim() || "",
      }
    }

    return {}
  }

  const handleSubmit = async () => {
    
    if (!validateForm()) return

    const changes = detectChanges()
    if (!changes.hasUserChanges && !changes.hasGroupChange && !changes.hasModuleChange) {
      toast.info("No changes detected")
      return
    }

    setLoading(true)

    try {
      const url = `http://127.0.0.1:8000/home/${type === "student" ? "students" : "professors"}/${user.id}/`
      const payload = buildUpdatePayload()

      console.log('Update payload:', payload) // Debug log

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Update failed: ${response.status} ${response.statusText}`)
      }

      // Parse response if available
      let updatedUser
      const contentType = response.headers.get("content-type")
      
      if (contentType?.includes("application/json")) {
        updatedUser = await response.json()
      } else {
        // Construct updated user object based on the expected structure
        updatedUser = {
          ...user,
          user: {
            ...user.user,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            full_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
          },
        }

        if (type === "student") {
          if (formData.group) {
            const selectedGroup = availableGroups.find(g => g.id === parseInt(formData.group))
            updatedUser.student_group = selectedGroup || null
          } else {
            updatedUser.student_group = null
          }
        } else if (type === "professor") {
          updatedUser.module = formData.module.trim()
        }
      }

      onUpdate(updatedUser, type)
      toast.success(`${type === "student" ? "Student" : "Professor"} updated successfully`)
      onClose()
      
    } catch (error) {
      console.error(`Error updating ${type}:`, error)
      toast.error(`Failed to update ${type}`, {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit {type === "student" ? "Student" : "Professor"}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter last name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter email address"
              />
            </div>

            {/* Student Group Selection */}
            {type === "student" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group
                </label>
                <select
                  value={formData.group}
                  onChange={(e) => handleInputChange("group", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Group</option>
                  {availableGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {group.section}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Professor Module */}
            {type === "professor" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module
                </label>
                <input
                  type="text"
                  value={formData.module}
                  onChange={(e) => handleInputChange("module", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter module name"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Updating..." : "Update"}
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
    </div>
  )
}

export default EditUserModal