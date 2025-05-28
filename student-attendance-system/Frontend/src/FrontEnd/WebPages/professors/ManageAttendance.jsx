"use client"

import { useState, useCallback, useEffect, useMemo, useContext } from "react"
import Aside from "../../components/aside"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import DemoPage from "../../presence_data/page"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginContext } from "../../contexts/LoginContext.jsx"
import { useAuth } from "../../contexts/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"


export default function ManageAttendance() {
  const { user } = useContext(LoginContext)
  const { accessToken } = useAuth()
  const [attendanceData, setAttendanceData] = useState([])
  const [allStudentsData, setAllStudentsData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState(null)
  const [studentsError, setStudentsError] = useState(null)

  const [selectedGroup, setSelectedGroup] = useState("")
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [searchStudent, setSearchStudent] = useState("")
  const [processedStudents, setProcessedStudents] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [showDetailedChart, setShowDetailedChart] = useState(false)
  const rowsPerPage = 5

  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("http://127.0.0.1:8000/home/attendance/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const fetchedData = await response.json()
      setAttendanceData(fetchedData)
    } catch (err) {
      console.error("Error fetching attendance data:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  const fetchStudentsByGroup = useCallback(
    async (groupName) => {
      if (!groupName) return

      setStudentsError(null)
      try {
        const url = `http://127.0.0.1:8000/home/students/?group_name=${encodeURIComponent(groupName)}`
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const students = await response.json()
        setAllStudentsData(students)
        return students
      } catch (err) {
        console.error(`Error fetching students for group ${groupName}:`, err)
        setStudentsError(err.message)
        return []
      }
    },
    [accessToken],
  )

  useEffect(() => {
    fetchAttendanceData()
  }, [fetchAttendanceData])

  useEffect(() => {
    if (selectedGroup) {
      fetchStudentsByGroup(selectedGroup)
    } else {
      setAllStudentsData([])
    }
  }, [selectedGroup, fetchStudentsByGroup])

  const availableGroups = useMemo(() => {
    const groups = new Set()
    attendanceData.forEach((record) => {
      if (record.student?.student_group?.name) {
        groups.add(record.student.student_group.name)
      }
    })
    return Array.from(groups).sort()
  }, [attendanceData])

  const groupDates = useMemo(() => {
    if (!selectedGroup) return []

    const dateSet = new Set()

    attendanceData.forEach((record) => {
      const groupName = record?.student?.student_group?.name
      const rawDate = record?.course?.date_time

      if (groupName === selectedGroup && rawDate) {
        try {
          const parsed = parseISO(rawDate)
          if (isValid(parsed)) {
            const formatted = format(parsed, "yyyy-MM-dd")
            dateSet.add(formatted)
          }
        } catch (error) {
          console.warn("Invalid date format:", rawDate + error)
        }
      }
    })

    return Array.from(dateSet)
      .map((d) => parseISO(d))
      .filter((d) => d instanceof Date && isValid(d))
      .sort((a, b) => a - b)
  }, [attendanceData, selectedGroup])

  const processAttendanceForDate = (date, groupRecords) => {
    if (!date) return []

    const formattedDate = format(date, "yyyy-MM-dd")

    const dateRecords = groupRecords.filter((record) => {
      if (!record.course?.date_time) return false
      try {
        const parsedDate = parseISO(record.course.date_time)
        if (!isValid(parsedDate)) return false

        const recordDate = format(parsedDate, "yyyy-MM-dd")
        return recordDate === formattedDate
      } catch (error) {
        return error
      }
    })

    const attendanceMap = {}
    dateRecords.forEach((record) => {
      if (record.student?.id) {
        attendanceMap[record.student.id] = record.present_status || "unknown"
      }
    })

    return allStudentsData.map((student) => ({
      id: student.id,
      full_name: student.user?.full_name || "",
      email: student.user?.email || "",
      group: student.student_group?.name || "",
      status: attendanceMap[student.id] || "absent", 
    }))
  }

  const processOverallAttendance = (groupRecords) => {
    const studentStats = {}
  
    allStudentsData.forEach((student) => {
      studentStats[student.id] = {
        id: student.id,
        full_name: student.user?.full_name || "",
        email: student.user?.email || "",
        group: student.student_group?.name || "",
        totalSessions: 0,
        presentSessions: 0,
      }
    })
  
    const sessionDates = new Set()
    groupRecords.forEach((record) => {
      if (record.course?.date_time) {
        try {
          const parsedDate = parseISO(record.course.date_time)
          if (isValid(parsedDate)) {
            sessionDates.add(format(parsedDate, "yyyy-MM-dd"))
          }
        } catch (z) {
          return z
        }
      }
    })
  
    const totalSessionCount = sessionDates.size
  
    Object.values(studentStats).forEach((student) => {
      student.totalSessions = totalSessionCount
    })
  
    groupRecords.forEach((record) => {
      const studentId = record.student?.id
      if (!studentId || !studentStats[studentId]) return
  
      if (
        record.present_status === "present" ||
        record.present_status === "justified" ||
        record.present_status === "late"
      ) {
        studentStats[studentId].presentSessions++
      }
    })
  
    return Object.values(studentStats).map((student) => ({
      ...student,
      status:
        student.totalSessions > 0
          ? `${Math.round((student.presentSessions / student.totalSessions) * 100)}% Present (${student.presentSessions}/${student.totalSessions})`
          : "No Sessions",
    }))
  }

  useEffect(() => {
    setCurrentPage(0)

    if (!selectedGroup) {
      setProcessedStudents([])
      return
    }

    const groupRecords = attendanceData.filter((record) => record.student?.student_group?.name === selectedGroup)

    let students = []

    if (selectedDate) {
      students = processAttendanceForDate(selectedDate, groupRecords)
    } else {
      students = processOverallAttendance(groupRecords)
    }

    if (searchStudent) {
      students = students.filter(
        (student) =>
          (student.full_name && student.full_name.toLowerCase().includes(searchStudent.toLowerCase())) ||
          (student.email && student.email.toLowerCase().includes(searchStudent.toLowerCase())),
      )
    }

    if (selectedStatus !== "All Status") {
      students = students.filter((student) => {
        if (selectedDate) {
          return student.status && student.status.toLowerCase() === selectedStatus.toLowerCase()
        } else {
          return student.status && student.status.toLowerCase().includes(selectedStatus.toLowerCase())
        }
      })
    }

    setProcessedStudents(students)
  }, [selectedGroup, selectedDate, selectedStatus, searchStudent, attendanceData, allStudentsData])

  const resetFilters = () => {
    setSelectedDate(null)
    setSelectedStatus("All Status")
    setSearchStudent("")
    setIsCalendarOpen(false)
  }

  const paginatedStudents = useMemo(() => {
    const start = currentPage * rowsPerPage
    return processedStudents.slice(start, start + rowsPerPage)
  }, [processedStudents, currentPage])

  const totalPages = Math.ceil(processedStudents.length / rowsPerPage)

  const chartData = useMemo(() => {
    if (!selectedGroup || allStudentsData.length === 0) return []

    const groupRecords = attendanceData.filter((record) => record.student?.student_group?.name === selectedGroup)
    const totalStudentsInGroup = allStudentsData.length

    const sessionMap = {}

    groupRecords.forEach((record) => {
      if (!record.course?.date_time || !record.course?.id) return

      try {
        const parsedDate = parseISO(record.course.date_time)
        if (!isValid(parsedDate)) return

        const dateKey = format(parsedDate, "yyyy-MM-dd")
        const courseId = record.course.id
        const sessionKey = `${dateKey}-${courseId}`

        if (!sessionMap[sessionKey]) {
          sessionMap[sessionKey] = {
            date: format(parsedDate, "MMM dd") + (record.course?.name ? ` (${record.course.name})` : ""),
            fullDate: parsedDate,
            courseId: courseId,
            presentCount: 0,
            totalStudents: totalStudentsInGroup,
            studentIds: new Set(),
            presentStudentIds: new Set(),
          }
        }

        if (record.student?.id) {
          sessionMap[sessionKey].studentIds.add(record.student.id)

          if (record.present_status === "present" || record.present_status === "late" || record.present_status === "justified") {
            sessionMap[sessionKey].presentStudentIds.add(record.student.id)
            sessionMap[sessionKey].presentCount++
          }
        }
      } catch (error) {
        console.warn("Error processing date for chart:", record.course.date_time + error)
      }
    })

    const sessionData = Object.values(sessionMap)
      .map((session) => {
        const attendanceRate = Math.round((session.presentStudentIds.size / totalStudentsInGroup) * 100)

        return {
          date: session.date,
          fullDate: session.fullDate,
          courseId: session.courseId,
          presentCount: session.presentStudentIds.size,
          totalStudents: totalStudentsInGroup,
          attendanceRate: attendanceRate,
          uniqueStudents: session.studentIds.size,
          uniquePresent: session.presentStudentIds.size,
        }
      })
      .sort((a, b) => {
        const dateCompare = a.fullDate - b.fullDate
        if (dateCompare !== 0) return dateCompare
        return a.courseId - b.courseId
      })

    return sessionData
  }, [selectedGroup, attendanceData, allStudentsData])

  const overallStats = useMemo(() => {
    if (!selectedGroup || allStudentsData.length === 0) return null

    const totalStudents = allStudentsData.length
    const totalSessions = groupDates.length

    if (totalSessions === 0) return null

    let totalPresent = 0
    let totalRecords = 0

    attendanceData.forEach((record) => {
      if (record.student?.student_group?.name === selectedGroup) {
        totalRecords++
        if (record.present_status === "present" || record.present_status === "late" || record.present_status === "justified") {
          totalPresent++
        }
      }
    })

    const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0

    const potentialAttendance = totalStudents * totalSessions

    const actualRate = potentialAttendance > 0 ? Math.round((totalPresent / potentialAttendance) * 100) : 0

    return {
      totalStudents,
      totalSessions,
      totalPresent,
      totalRecords,
      overallRate,
      actualRate,
      potentialAttendance,
    }
  }, [selectedGroup, attendanceData, allStudentsData, groupDates])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
          <p className="font-bold">{label}</p>
          <p className="text-blue-600">Attendance Rate: {data.attendanceRate}%</p>
          <p className="text-gray-600 text-sm">
            {data.uniquePresent}/{data.totalStudents} students present
          </p>
          <p className="text-gray-600 text-sm">{data.uniqueStudents} students recorded</p>
        </div>
      )
    }
    return null
  }

  const handleExportPDF = async () => {
    if (!selectedGroup || processedStudents.length === 0) {
      alert("No data to export!")
      return
    }
  
    setIsExporting(true)
  
    try {
      const groupName = selectedGroup
      const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "all-dates"
      const fileName = `${groupName.replace(/\s+/g, "-")}_${dateString}`
  
      const exportData = processedStudents.map((student) => ({
        ID: student.id,
        Name: student.full_name,
        Email: student.email,
        Status: selectedDate
          ? student.status
          : student.totalSessions
            ? `${Math.round((student.presentSessions / student.totalSessions) * 100)}% (${student.presentSessions}/${student.totalSessions})`
            : "No sessions",
      }))
  
      const doc = new jsPDF()
  
      doc.setFillColor(25, 118, 210)
      doc.rect(0, 0, 210, 25, "F")
  
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("ESI - Sidi Bel Abbes", 14, 16)
  
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text(`Attendance Report: ${selectedGroup}`, 14, 35)
  
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(selectedDate ? `Date: ${format(selectedDate, "MM/dd/yyyy")}` : "All Sessions", 14, 45)
      doc.text(`Generated: ${format(new Date(), "MM/dd/yyyy HH:mm")}`, 14, 52)
  
      autoTable(doc, {
        startY: 60,
        head: [["ID", "Name", "Email", "Attendance"]],
        body: exportData.map((item) => [item.ID, item.Name, item.Email, item.Status]),
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: "linebreak",
          columnWidth: "wrap",
        },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 70 },
          3: { cellWidth: 35 },
        },
      })
  
      const finalY = doc.lastAutoTable.finalY + 15
      doc.setFont("helvetica", "italic")
      doc.setFontSize(9)
      doc.text("Certified by:", 150, finalY)
      doc.setFont("helvetica", "bold")
      doc.text(`${user?.firstName || ""} ${user?.lastName || ""}`, 150, finalY + 8)
  
      // Updated to count both present and justified as present
      const presentCount = selectedDate
        ? processedStudents.filter((s) => s.status === "present" || s.status === "justified").length
        : processedStudents.reduce((acc, s) => acc + (s.presentSessions || 0), 0)
  
      const totalCount = selectedDate
        ? processedStudents.length
        : processedStudents.reduce((acc, s) => acc + (s.totalSessions || 0), 0)
  
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(
        `Summary: ${presentCount} present out of ${totalCount} (${Math.round((presentCount / (totalCount || 1)) * 100)}%)`,
        14,
        finalY,
      )
  
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text(`Page 1 - Generated on ${format(new Date(), "MM/dd/yyyy")}`, 14, 285)
  
      doc.save(`${fileName}.pdf`)
    } catch (error) {
      console.error("PDF export failed:", error)
      alert("Failed to export PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }
  
  const handleExportExcel = async () => {
    if (!selectedGroup || processedStudents.length === 0) {
      alert("No data to export!")
      return
    }
  
    setIsExporting(true)
  
    try {
      const groupName = selectedGroup
      const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "all-dates"
      const fileName = `${groupName.replace(/\s+/g, "-")}_${dateString}`
  
      const exportData = processedStudents.map((student) => ({
        ID: student.id,
        Name: student.full_name,
        Email: student.email,
        Group: student.group,
        Attendance: selectedDate
          ? student.status
          : student.totalSessions
            ? `${Math.round((student.presentSessions / student.totalSessions) * 100)}% (${student.presentSessions}/${student.totalSessions})`
            : "No sessions",
      }))
  
      const presentCount = selectedDate
        ? processedStudents.filter((s) => 
          s.status === "present" || 
          s.status === "justified" || 
          s.status === "late"
        ).length
        : processedStudents.reduce((acc, s) => acc + (s.presentSessions || 0), 0)
  
      exportData.push({
        ID: "",
        Name: "SUMMARY",
        Email: `Total Students: ${processedStudents.length}`,
        Group: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "All Sessions",
        Attendance: selectedDate
          ? `Present: ${presentCount}/${processedStudents.length} (${Math.round((presentCount / (processedStudents.length || 1)) * 100)}%)`
          : `Avg: ${Math.round(processedStudents.reduce((acc, s) => acc + (s.totalSessions > 0 ? (s.presentSessions / s.totalSessions) * 100 : 0), 0) / (processedStudents.length || 1))}%`,
      })
  
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")
  
      const cols = [
        { wch: 10 }, // ID
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // Group
        { wch: 20 }, // Attendance
      ]
      worksheet["!cols"] = cols
  
      XLSX.writeFile(workbook, `${fileName}.xlsx`)
    } catch (error) {
      console.error("Excel export failed:", error)
      alert("Failed to export Excel file. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = (type) => {
    if (type === "pdf") {
      handleExportPDF()
    } else if (type === "excel") {
      handleExportExcel()
    }
  }

  const toggleCalendar = () => {
    if (groupDates.length === 0) return
    setIsCalendarOpen(!isCalendarOpen)
  }

  const toggleDetailedChart = () => {
    setShowDetailedChart(!showDetailedChart)
  }

  return (
    <div className="flex h-screen">
      <Aside />
      <div className="flex-1 w-full overflow-y-auto p-2 bg-gray-100">
        <div className="mt-2 border border-gray-300 bg-white rounded-md p-2 shadow-sm text-sm">
          <h1 className="text-lg font-semibold text-gray-800 mb-4">Student Attendance Tracker</h1>

          {(error || studentsError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || studentsError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2 items-center mb-4 justify-between">
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value)
                resetFilters()
              }}
              className="border rounded px-2 py-1 text-xs h-8 w-[200px]"
              disabled={isLoading}
            >
              <option value="">Select Group</option>
              {availableGroups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>

            {selectedGroup && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="h-8 px-2 text-xs flex items-center"
                  disabled={processedStudents.length === 0 || isExporting}
                  onClick={() => handleExport("pdf")}
                >
                  {isExporting ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-3 w-3" />
                  )}
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-2 text-xs flex items-center"
                  disabled={processedStudents.length === 0 || isExporting}
                  onClick={() => handleExport("excel")}
                >
                  {isExporting ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-3 w-3" />
                  )}
                  Export Excel
                </Button>
              </div>
            )}
          </div>

          {selectedGroup && (
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="Search by name or email"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="h-8 text-xs px-2 py-1 max-w-[200px]"
              />

              <div className="relative">
                <Button
                  variant="outline"
                  className="h-8 px-2 text-xs flex items-center justify-start"
                  disabled={groupDates.length === 0}
                  onClick={toggleCalendar}
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {selectedDate ? format(selectedDate, "MM/dd/yyyy") : "Pick a date"}
                </Button>

                {isCalendarOpen && (
                  <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg">
                    <div className="p-2">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setIsCalendarOpen(false)
                          setCurrentPage(0)
                        }}
                        disabled={(date) => {
                          if (!selectedGroup || groupDates.length === 0) return true
                          return !groupDates.some((sessionDate) => {
                            try {
                              return format(sessionDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                            } catch (error) {
                              return error
                            }
                          })
                        }}
                        initialFocus
                        className="rounded-md border"
                      />
                      {selectedDate && (
                        <div className="p-2 border-t mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDate(null)
                              setIsCalendarOpen(false)
                              setCurrentPage(0)
                            }}
                            className="w-full"
                          >
                            Clear Selection
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedDate && (
                <>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border rounded px-2 py-1 text-xs h-8 w-[200px]"
                  >
                    <option value="All Status">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="justified">Justified Absence</option>
                  </select>
                </>
              )}

              <Button variant="outline" onClick={resetFilters} className="h-8 px-2 text-xs flex items-center">
                <X className="mr-1 h-3 w-3" />
                Reset
              </Button>

              {/* Show selected filters info */}
              {(selectedDate || selectedStatus !== "All Status" || searchStudent) && (
                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  Filters active: {selectedDate && `Date: ${format(selectedDate, "MM/dd/yyyy")}`}
                  {selectedStatus !== "All Status" && ` | Status: ${selectedStatus}`}
                  {searchStudent && ` | Search: "${searchStudent}"`}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading attendance data...</span>
            </div>
          ) : (
            <>
              <DemoPage
                students={paginatedStudents}
                setStudents={setProcessedStudents}
                pageLoading={isLoading}
                fetchError={error}
                getData={fetchAttendanceData}
                sd={selectedDate}
                sg={selectedGroup}
              />

              {processedStudents.length > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-xs">
                    Showing {processedStudents.length} student{processedStudents.length !== 1 ? "s" : ""} - Page{" "}
                    {currentPage + 1} of {totalPages || 1}
                  </span>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                      className="h-6 px-2 text-xs"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages - 1 || totalPages === 0}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                      className="h-6 px-2 text-xs"
                    >
                      Next
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedGroup && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>Select a group to view attendance data</p>
            </div>
          )}

          {selectedGroup && groupDates.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <p>No attendance sessions found for {selectedGroup}</p>
            </div>
          )}

          {selectedGroup && processedStudents.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <p>No students match the current filters</p>
              <Button variant="link" onClick={resetFilters} className="text-blue-500 mt-2">
                Reset Filters
              </Button>
            </div>
          )}
        </div>

        {selectedGroup && overallStats && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Overall Attendance Statistics</CardTitle>
                <Button variant="ghost" size="sm" onClick={toggleDetailedChart} className="text-xs">
                  {showDetailedChart ? "Show Summary" : "Show All Sessions"}
                </Button>
              </div>
              <CardDescription>
                Attendance summary for {selectedGroup} - {overallStats.totalSessions} sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                  <div className="text-sm text-blue-700 font-medium">Overall Attendance Rate</div>
                  <div className="text-2xl font-bold text-blue-800">{overallStats.overallRate}%</div>
                  <div className="text-xs text-blue-600">
                    {overallStats.totalPresent} present out of {overallStats.totalRecords} records
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-md border border-green-100">
                  <div className="text-sm text-green-700 font-medium">Actual Attendance Rate</div>
                  <div className="text-2xl font-bold text-green-800">{overallStats.actualRate}%</div>
                  <div className="text-xs text-green-600">
                    {overallStats.totalPresent} present out of {overallStats.potentialAttendance} potential
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-md border border-purple-100">
                  <div className="text-sm text-purple-700 font-medium">Group Summary</div>
                  <div className="text-2xl font-bold text-purple-800">{overallStats.totalStudents} students</div>
                  <div className="text-xs text-purple-600">Across {overallStats.totalSessions} sessions</div>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 12,
                      bottom: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      interval={chartData.length > 15 && !showDetailedChart ? "preserveStartEnd" : 0}
                      angle={chartData.length > 10 ? -45 : 0}
                      height={chartData.length > 10 ? 60 : 30}
                      textAnchor={chartData.length > 10 ? "end" : "middle"}
                    />
                    <YAxis
                      tickMargin={10}
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                      label={{
                        value: "Attendance Rate (%)",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip cursor={false} content={<CustomTooltip />} />
                    <Line
                      name="Session Attendance"
                      dataKey="attendanceRate"
                      type="monotone"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{
                        fill: "#2563eb",
                        strokeWidth: 2,
                        r: 4,
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#2563eb",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 font-medium leading-none">
                {(() => {
                  if (chartData.length < 2) return "Insufficient data for trend analysis"
                  const latest = chartData[chartData.length - 1]?.attendanceRate || 0
                  const previous = chartData[chartData.length - 2]?.attendanceRate || 0
                  const change = latest - previous
                  const isUp = change > 0
                  return (
                    <>
                      {isUp ? "Trending up" : change < 0 ? "Trending down" : "No change"} by{" "}
                      {Math.abs(change).toFixed(1)}% in the last session
                      <TrendingUp
                        className={`h-4 w-4 ${isUp ? "text-green-600" : change < 0 ? "text-red-600 rotate-180" : "text-gray-600"}`}
                      />
                    </>
                  )
                })()}
              </div>
              <div className="leading-none text-muted-foreground">
                <span className="text-blue-600 font-medium">Session Attendance</span>: Each point shows the attendance
                rate for a specific session
              </div>
            </CardFooter>
          </Card>
        )}
        
      </div>
    </div>
  )
};