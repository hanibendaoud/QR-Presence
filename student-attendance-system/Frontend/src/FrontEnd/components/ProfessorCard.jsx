"use client"

const ProfessorCard = ({ professor, onEdit, onDelete }) => {
  const fullName =
    professor.user?.full_name || `${professor.user?.first_name || ""} ${professor.user?.last_name || ""}`.trim()
  const email = professor.user?.email || "No email"
  const module = professor.module || "No module assigned"

  // Handle groups - might be in different formats
  const groups = professor.groups || professor.student_groups || []

  // Handle courses/modules - might be in different formats
  const courses = professor.courses || (professor.module ? [{ name: professor.module }] : [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "P"}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{fullName || "Unknown Professor"}</h3>
            <p className="text-sm text-gray-600">{email}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit Professor"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Professor"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Module/Subject */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Module</h4>
        {module ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {module}
          </span>
        ) : (
          <p className="text-sm text-gray-500">No module assigned</p>
        )}
      </div>

      {/* Groups */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Groups</h4>
        {groups.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {groups.map((group, index) => (
              <span
                key={group.id || index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {group.name || `Group ${group.id}`}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No groups assigned</p>
        )}
      </div>

      {/* Courses */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Courses</h4>
        {courses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {courses.map((course, index) => (
              <span
                key={course.id || index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {course.name || course}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No courses assigned</p>
        )}
      </div>

    </div>
  )
}

export default ProfessorCard
