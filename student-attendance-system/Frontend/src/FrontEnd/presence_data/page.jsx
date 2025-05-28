import { useState, useRef, useEffect } from "react"
import { Loader2, MoreVertical, Check, X, Clock, FileText, Upload, Eye, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../contexts/AuthContext"

export default function DemoPage({ students, setStudents, pageLoading, fetchError, getData, sd: selectedDate }) {
  const { accessToken } = useAuth()
  const [loadingStudentId, setLoadingStudentId] = useState(null)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [justificationDialog, setJustificationDialog] = useState({
    open: false,
    studentId: null,
    studentName: ""
  })

  const [justificationData, setJustificationData] = useState({
    detail: "",
    file: null
  })
  const [justificationViewDialog, setJustificationViewDialog] = useState({
    open: false,
    studentName: "",
    detail: "",
    fileName: "",
    timestamp: "",
    fileData: null // Added to store file data for download
  })
  const dropdownRefs = useRef({});
  const [dropdownDirectionMap, setDropdownDirectionMap] = useState({});
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideAny = Object.values(dropdownRefs.current).some(
        (ref) => ref && ref.contains(event.target)
      );
      if (!isClickInsideAny) {
        setOpenDropdownId(null);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper function to save justification to local storage
  const saveJustificationToLocalStorage = (studentId, date, detail, fileName, fileData = null) => {
    const key = `justification_${studentId}_${date}`;
    const now = new Date();
    // Decrease one hour from the current time
    now.setHours(now.getHours() - 1);
    
    const justificationInfo = {
      detail,
      fileName,
      fileData, // Store file data if available
      timestamp: now.toISOString()
    };
    localStorage.setItem(key, JSON.stringify(justificationInfo));
  };

  // Helper function to get justification from local storage
  const getJustificationFromLocalStorage = (studentId, date) => {
    const key = `justification_${studentId}_${date}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  };

  const updateStudentStatus = async (studentId, newStatus) => {
    if (!studentId || !selectedDate) return

    setLoadingStudentId(studentId)

    try {
      const existingRecord = await findAttendanceRecord(studentId, selectedDate)
      
      if (newStatus === 'absent') {
        if (existingRecord) {
          await deleteAttendanceRecord(existingRecord.id)
        }
      } else {
        const backendStatus = newStatus        
        if (existingRecord) {
          await updateAttendanceRecord(existingRecord.id, backendStatus)
        } else {
          const doubleCheckRecord = await findAttendanceRecord(studentId, selectedDate)
          if (doubleCheckRecord) {
            await updateAttendanceRecord(doubleCheckRecord.id, backendStatus)
          } else {
            await createAttendanceRecord(studentId, selectedDate, backendStatus)
          }
        }
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
      )

      toast.success("Status updated", {
        description: `Marked as "${newStatus}"`,
      })

      getData()
    } catch (error) {
      let errorMessage = "Unable to change attendance status. Try again."
      
      if (error.message.includes('400')) {
        errorMessage = "Bad request - there might be a validation error or duplicate record issue."
      } else if (error.message.includes('409')) {
        errorMessage = "Attendance record conflict - record may already exist."
      } else if (error.message.includes('404')) {
        errorMessage = "Course or student not found for the selected date."
      }
      
      toast.error("Update failed", {
        description: error.message || errorMessage,
      })
    } finally {
      setLoadingStudentId(null)
    }
  }

  const createAttendanceRecord = async (studentId, date, status) => {
    try {
      const course = await findCourseForDate(date)
      if (!course) {
        throw new Error("No course found for the selected date")
      }

      const payload = {
        student_id: studentId,
        course_id: course.id,
        present_status: status,
        time: date
      }

      const response = await fetch('http://127.0.0.1:8000/home/attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorDetails = errorText
        try {
          const errorJson = JSON.parse(errorText)
          errorDetails = JSON.stringify(errorJson, null, 2)
        } catch (e) {
          return e
        }
        
        throw new Error(`Failed to create attendance record. Status: ${response.status}\nDetails: ${errorDetails}`)
      }

      return await response.json()
    } catch (error) {
      return error
    }
  }

  const updateAttendanceRecord = async (recordId, status) => {
    try {
      const payload = { present_status: status }

      const response = await fetch(`http://127.0.0.1:8000/home/attendance/${recordId}/update-status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update attendance record. Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      return error
    }
  }

  const deleteAttendanceRecord = async (recordId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/home/attendance/${recordId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to delete attendance record. Status: ${response.status}`)
      }
    } catch (error) {
      return error
    }
  }

  const findCourseForDate = async (date) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/home/courses/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const courses = await response.json()
      const targetDate = new Date(date)
      
      const matchingCourse = courses.find((course) => {
        if (!course.date_time) return false
        
        const courseDate = new Date(course.date_time)
        return (
          courseDate.getFullYear() === targetDate.getFullYear() &&
          courseDate.getMonth() === targetDate.getMonth() &&
          courseDate.getDate() === targetDate.getDate()
        )
      })

      return matchingCourse
    } catch (error) {
      return error
    }
  }

  const updateStatusWithJustification = async (studentId, newStatus, justificationDetail, justificationFile) => {
    if (!studentId || !selectedDate) return

    setLoadingStudentId(studentId)

    try {
      let record = await findAttendanceRecord(studentId, selectedDate)
      
      const backendStatus = newStatus
      
      // Convert file to base64 for storage
      let fileData = null;
      if (justificationFile) {
        const reader = new FileReader();
        fileData = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(justificationFile);
        });
      }
      
      // Save justification to localStorage with file data
      const fileName = justificationFile ? justificationFile.name : null;
      saveJustificationToLocalStorage(studentId, selectedDate, justificationDetail, fileName, fileData);
      
      if (!record) {
        // Create new attendance record with just the status (no justification in backend)
        await createAttendanceRecord(studentId, selectedDate, backendStatus)
      } else {
        // Update existing record with just the status (no justification in backend)
        await updateAttendanceRecord(record.id, backendStatus)
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
      )

      toast.success("Status updated with justification", {
        description: `Marked as "${newStatus}" with justification details saved locally.`,
      })

      getData()
    } catch (error) {
      toast.error("Update failed", {
        description: error.message || "Unable to update attendance status with justification. Try again.",
      })
    } finally {
      setLoadingStudentId(null)
    }
  }

  const findAttendanceRecord = async (studentId, date) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/home/attendance/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      
      if (!res.ok) throw new Error("Fetch failed")

      const records = await res.json()
      const targetDate = new Date(date)

      const matchingRecord = records.find((record) => {
        if (record.student?.id !== studentId) return false
        if (!record.course?.date_time) return false

        const recordDate = new Date(record.course.date_time)
        return (
          recordDate.getFullYear() === targetDate.getFullYear() &&
          recordDate.getMonth() === targetDate.getMonth() &&
          recordDate.getDate() === targetDate.getDate()
        )
      })

      return matchingRecord
    } catch (err) {
      return err
    }
  }

  const handleJustificationSubmit = async () => {
    if (!justificationData.detail && !justificationData.file) {
      toast.error("Please provide justification details or upload a file")
      return
    }

    await updateStatusWithJustification(
      justificationDialog.studentId,
      "justified",
      justificationData.detail,
      justificationData.file
    )

    setJustificationDialog({ open: false, studentId: null, studentName: "" })
    setJustificationData({ detail: "", file: null })
  }

  const openJustificationDialog = (studentId, studentName) => {
    setJustificationDialog({
      open: true,
      studentId,
      studentName
    })
    setJustificationData({ detail: "", file: null })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size too large", {
          description: "Please select a file smaller than 10MB."
        })
        return
      }
      setJustificationData(prev => ({ ...prev, file }))
    }
  }

  const getStatusIcon = (status) => {
    const icons = {
      present: <Check className="h-4 w-4 text-green-600" />,
      absent: <X className="h-4 w-4 text-red-600" />,
      late: <Clock className="h-4 w-4 text-orange-600" />,
      justified: <FileText className="h-4 w-4 text-blue-600" />,  
    }
    return icons[status] || null
  }

  const getStatusColor = (status) => {
    const colors = {
      present: "text-green-600 bg-green-50",
      absent: "text-red-600 bg-red-50", 
      late: "text-orange-600 bg-orange-50", 
      justified: "text-blue-600 bg-blue-50", 
    }
    return colors[status] || "text-gray-600 bg-gray-50"
  }

  const viewJustification = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      const studentName = student ? student.full_name : "Unknown Student";

      // First, try to get justification from localStorage
      const localJustification = getJustificationFromLocalStorage(studentId, selectedDate);
      
      if (localJustification) {
        const adjustedTimestamp = new Date(localJustification.timestamp);
        setJustificationViewDialog({
          open: true,
          studentName: studentName,
          detail: localJustification.detail || "No details provided",
          fileName: localJustification.fileName || "",
          timestamp: adjustedTimestamp.toLocaleString(),
          fileData: localJustification.fileData || null
        });
        return;
      }

      // Fallback to backend if no local justification found
      const record = await findAttendanceRecord(studentId, selectedDate)
      if (!record) {
        toast.error("Attendance record not found")
        return
      }
  
      const response = await fetch(`http://127.0.0.1:8000/home/attendance/${record.id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
  
      if (!response.ok) throw new Error("Failed to fetch attendance details")
  
      const attendanceData = await response.json()
      
      if (attendanceData.justification_detail || attendanceData.justification_file) {
        setJustificationViewDialog({
          open: true,
          studentName: studentName,
          detail: attendanceData.justification_detail || "No details provided",
          fileName: attendanceData.justification_file ? "Backend file" : "",
          timestamp: "From backend",
          fileData: null
        });

        // Open backend file in new tab if exists
        if (attendanceData.justification_file) {
          window.open(attendanceData.justification_file, '_blank')
        }
      } else {
        toast.info("No justification details found")
      }
    } catch (error) {
      toast.error("Failed to load justification details")
    }
  }

  const handleFileView = () => {
    if (justificationViewDialog.fileData) {
      const byteCharacters = atob(justificationViewDialog.fileData.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = justificationViewDialog.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (justificationViewDialog.fileName === "Backend file") {
      // For backend files, this would typically be handled by the backend URL
      toast.info("Backend file would be opened from server");
    }
  };

  const handleStatusClick = (studentId, status) => {
    setOpenDropdownId(null)
    updateStudentStatus(studentId, status)
  }

  const handleDropdownToggle = (studentId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    const isOpen = openDropdownId === studentId;
    const newId = isOpen ? null : studentId;
    setOpenDropdownId(newId);
  
    if (!isOpen) {
      setTimeout(() => {
        const el = dropdownRefs.current[studentId];
        if (el) {
          const rect = el.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const spaceBelow = viewportHeight - rect.bottom;
          const dropdownHeight = 200;
  
          setDropdownDirectionMap(prev => ({
            ...prev,
            [studentId]: spaceBelow < dropdownHeight ? "up" : "down"
          }));
  
          el.scrollIntoView({ 
            block: "nearest", 
            behavior: "smooth",
            inline: "nearest"
          });
        }
      }, 10);
    }
  };

  return (
    <>
      {fetchError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{fetchError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {selectedDate && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <span className="mt-2 text-gray-500">Loading students...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No students found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {getStatusIcon(student.status)}
                          <span className="ml-1 capitalize">{student.status}</span>
                        </span>
                        {student.status === 'justified' && (
                          <button
                            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={() => viewJustification(student.id)}
                            title="View justification details"
                          >
                            <Eye className="h-4 w-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </td>
                    {selectedDate && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div
                          className="relative"
                          ref={(el) => (dropdownRefs.current[student.id] = el)}
                        >
                          <button
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => handleDropdownToggle(student.id, e)}
                            disabled={loadingStudentId === student.id}
                            aria-label="More actions"
                          >
                            {loadingStudentId === student.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </button>
                    
                          {openDropdownId === student.id && (
                            <div
                              className={`absolute right-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 ${
                                dropdownDirectionMap[student.id] === "up" ? "bottom-full mb-2" : "mt-2"
                              }`}
                              style={{
                                animation: 'fadeIn 0.15s ease-out'
                              }}
                            >
                              <div className="py-1" role="menu">
                                <div className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 border-b border-gray-100">
                                  Change Status
                                </div>
                    
                                {["present", "absent", "late"].map((status) => (
                                  <button
                                    key={status}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleStatusClick(student.id, status);
                                    }}
                                    disabled={loadingStudentId === student.id}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {getStatusIcon(status)}
                                    <span className="ml-2 capitalize">Mark as {status}</span>
                                  </button>
                                ))}
                    
                                <div className="border-t border-gray-100 my-1"></div>
                    
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openJustificationDialog(student.id, student.full_name);
                                    setOpenDropdownId(null);
                                  }}
                                  disabled={loadingStudentId === student.id}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <span className="ml-2">Add Justification</span>
                                </button>
                    
                                {student.status === "justified" && (
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      viewJustification(student.id);
                                      setOpenDropdownId(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="ml-2">View Justification</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {justificationViewDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  Justification Details
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Justification for <span className="font-medium">{justificationViewDialog.studentName}</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {justificationViewDialog.detail}
                  </p>
                </div>
                
                {justificationViewDialog.fileName && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attached File</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-900">{justificationViewDialog.fileName}</span>
                      </div>
                      <button
                        onClick={handleFileView}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Info
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  <span>Recorded: {justificationViewDialog.timestamp}</span>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setJustificationViewDialog({
                    open: false,
                    studentName: "",
                    detail: "",
                    fileName: "",
                    timestamp: ""
                  })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {justificationDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  Add Justification
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Add justification details for <span className="font-medium">{justificationDialog.studentName}</span>'s absence.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="justification-detail" className="block text-sm font-medium text-gray-700 mb-2">
                    Justification Details
                  </label>
                  <textarea
                    id="justification-detail"
                    placeholder="Enter reason for absence (e.g., medical appointment, family emergency)..."
                    value={justificationData.detail}
                    onChange={(e) => setJustificationData(prev => ({ ...prev, detail: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
                
                <div>
                  <label htmlFor="justification-file" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Document (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        id="justification-file"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <Upload className="h-5 w-5 text-gray-400" />
                  </div>
                  {justificationData.file && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {justificationData.file.name}
                        <span className="ml-auto text-xs text-blue-600">
                          ({(justificationData.file.size / 1024).toFixed(1)} KB)
                        </span>
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX, JPG, PNG, TXT (Max 10MB)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setJustificationDialog({ open: false, studentId: null, studentName: "" })
                    setJustificationData({ detail: "", file: null })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  disabled={loadingStudentId === justificationDialog.studentId}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleJustificationSubmit}
                  disabled={loadingStudentId === justificationDialog.studentId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingStudentId === justificationDialog.studentId ? (
                    <>
                      <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Justification'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {<style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>}
    </>
  )
}