"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useLogin } from "../../contexts/LoginContext"
import AdminAside from "../../components/adminAside"
import UserTabs from "../../components/UserTabs"
import SearchAndFilter from "../../components/SearchAndFilter"
import ProfessorCard from "../../components/ProfessorCard"
import StudentCard from "../../components/StudentCard"
import EditUserModal from "../../components/EditUserModal"
import DeleteUserModal from "../../components/DeleteUserModal"
import LoadingSpinner from "../../components/LoadingSpinner"
import { toast } from "sonner"

export default function ManageUsers() {
  const { accessToken } = useAuth()
  const { user } = useLogin()

  // State management
  const [activeTab, setActiveTab] = useState("professors")
  const [professors, setProfessors] = useState([])
  const [students, setStudents] = useState([])
  const [availableGroups, setAvailableGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("all")

  // Modal states
  const [editModal, setEditModal] = useState({ isOpen: false, user: null, type: null })
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null, type: null })

  // Fetch professors
  const fetchProfessors = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/home/professors", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch professors: ${response.status}`)
      }

      const data = await response.json()
      setProfessors(data)
    } catch (error) {
      console.error("Error fetching professors:", error)
      toast.error("Failed to fetch professors", {
        description: error.message,
      })
    }
  }

  // Fetch available groups
  const fetchGroups = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/home/groups/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.status}`)
      }

      const data = await response.json()
      setAvailableGroups(data)
    } catch (error) {
      console.error("Error fetching groups:", error)
      toast.error("Failed to fetch groups", {
        description: error.message,
      })
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/home/students", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`)
      }

      const data = await response.json()
      setStudents(data)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch students", {
        description: error.message,
      })
    }
  }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchProfessors(), fetchStudents(), fetchGroups()])
      setLoading(false)
    }

    if (accessToken) {
      fetchData()
    }
  }, [accessToken])

  // Filter and search logic
  const filterUsers = (users, type) => {
    return users.filter((user) => {
      // Handle search for both professors and students
      const firstName = user.user?.first_name || user.first_name || ""
      const lastName = user.user?.last_name || user.last_name || ""
      const email = user.user?.email || user.email || ""
      const fullName = user.user?.full_name || `${firstName} ${lastName}` || ""

      const matchesSearch =
        firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase())

      if (filterBy === "all") return matchesSearch

      // Only filter students by specific group
      if (type === "students") {
        if (filterBy.startsWith("group-")) {
          const groupId = parseInt(filterBy.replace("group-", ""))
          const userGroupId = user.student_group?.id
          return matchesSearch && userGroupId === groupId
        }
      }

      return matchesSearch
    })
  }

  // Handle edit user
  const handleEditUser = (user, type) => {
    setEditModal({ isOpen: true, user, type })
  }

  // Handle delete user
  const handleDeleteUser = (user, type) => {
    setDeleteModal({ isOpen: true, user, type })
  }

  // Update user after edit
  const handleUserUpdate = (updatedUser, type) => {
    if (type === "professor") {
      setProfessors((prev) => prev.map((prof) => (prof.id === updatedUser.id ? updatedUser : prof)))
    } else {
      setStudents((prev) => prev.map((student) => (student.id === updatedUser.id ? updatedUser : student)))
    }
    setEditModal({ isOpen: false, user: null, type: null })
    toast.success("User updated successfully")
  }

  // Delete user
  const handleUserDelete = (deletedUserId, type) => {
    if (type === "professor") {
      setProfessors((prev) => prev.filter((prof) => prof.id !== deletedUserId))
    } else {
      setStudents((prev) => prev.filter((student) => student.id !== deletedUserId))
    }
    setDeleteModal({ isOpen: false, user: null, type: null })
    toast.success("User deleted successfully")
  }

  const filteredProfessors = filterUsers(professors, "professors")
  const filteredStudents = filterUsers(students, "students")

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminAside />

      <div className="flex-1 h-screen overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200 p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent mb-2">
                User Management System
              </h1>
              <p className="text-gray-600">Manage professors and students in your attendance system</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Tabs */}
              <UserTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Search and Filter */}
              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterBy={filterBy}
                onFilterChange={setFilterBy}
                activeTab={activeTab}
                availableGroups={availableGroups}
              />

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">{professors.length}</div>
                  <div className="text-sm text-gray-600">Total Professors</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">{students.length}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {activeTab === "professors" ? filteredProfessors.length : filteredStudents.length}
                  </div>
                  <div className="text-sm text-gray-600">Filtered Results</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-orange-600">{professors.length + students.length}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
              </div>

              {/* User Cards */}
              {loading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  {activeTab === "professors" ? (
                    filteredProfessors.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProfessors.map((professor) => (
                          <ProfessorCard
                            key={professor.id}
                            professor={professor}
                            onEdit={() => handleEditUser(professor, "professor")}
                            onDelete={() => handleDeleteUser(professor, "professor")}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-lg">No professors found</div>
                        <div className="text-gray-500 text-sm">
                          {professors.length === 0
                            ? "No professors in the system"
                            : "Try adjusting your search criteria"}
                        </div>
                      </div>
                    )
                  ) : filteredStudents.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredStudents.map((student) => (
                        <StudentCard
                          key={student.id}
                          student={student}
                          onEdit={() => handleEditUser(student, "student")}
                          onDelete={() => handleDeleteUser(student, "student")}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-lg">No students found</div>
                      <div className="text-gray-500 text-sm">
                        {students.length === 0
                          ? "No students in the system"
                          : "Try adjusting your search or filter criteria"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editModal.isOpen && (
        <EditUserModal
          user={editModal.user}
          type={editModal.type}
          onClose={() => setEditModal({ isOpen: false, user: null, type: null })}
          onUpdate={handleUserUpdate}
          accessToken={accessToken}
        />
      )}

      {deleteModal.isOpen && (
        <DeleteUserModal
          user={deleteModal.user}
          type={deleteModal.type}
          onClose={() => setDeleteModal({ isOpen: false, user: null, type: null })}
          onDelete={handleUserDelete}
          accessToken={accessToken}
        />
      )}
    </div>
  )
}