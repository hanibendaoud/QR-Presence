"use client"

import { Search, Filter, X } from "lucide-react"

const SearchAndFilter = ({ searchTerm, onSearchChange, filterBy, onFilterChange, activeTab, availableGroups = [] }) => {
  const professorFilters = [
    { value: "all", label: "All Professors" },
  ]

  const studentFilters = [
    { value: "all", label: "All Students" },
    ...availableGroups.map(group => ({
      value: `group-${group.id}`,
      label: `${group.name} - ${group.section}`
    }))
  ]

  const filters = activeTab === "professors" ? professorFilters : studentFilters
  const hasActiveFilters = searchTerm || filterBy !== "all"

  const getFilterLabel = (value) => {
    const filter = filters.find(f => f.value === value)
    return filter?.label || value
  }

  const handleClearFilters = () => {
    onSearchChange("")
    onFilterChange("all")
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab === "professors" ? "professors" : "students"} by name or email...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdown - Only show for students */}
        {activeTab === "students" && (
          <div className="sm:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterBy}
                onChange={(e) => onFilterChange(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {filters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors flex items-center gap-2"
            type="button"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchTerm && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              <span>Search: "{searchTerm}"</span>
              <button
                onClick={() => onSearchChange("")}
                className="text-blue-600 hover:text-blue-800"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filterBy !== "all" && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              <span>{getFilterLabel(filterBy)}</span>
              <button
                onClick={() => onFilterChange("all")}
                className="text-green-600 hover:text-green-800"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchAndFilter