import React, { useState, useContext, useEffect, useMemo, useCallback } from "react";
import Aside from "../../components/aside";
import totalStudentIcon from "../../assets/totalstudent.svg";
import presentIcon from "../../assets/present.svg";
import absentIcon from "../../assets/absent.svg";
import generateIcon from "../../assets/generate.svg";
import { QRCodeCanvas } from "qrcode.react";
import { LoginContext } from "../../contexts/LoginContext";
import Notifications from "../../components/notifications";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCourse } from "../../contexts/CourseContext";
import { useAuth } from "../../contexts/AuthContext";
import { DateTime } from "luxon";

const STORAGE_KEY = "attendanceSettings";
const DEFAULT_SETTINGS = {
  qrCheckIn: true,
  autoLateMarking: true,
  latencyTime: "10min"
};
const LATENCY_TIME_MAP = {
  "5min": 5,
  "10min": 10,
  "15min": 15,
  "20min": 20,
  "30min": 30
};

export default function Dashboard() {
  const { user } = useContext(LoginContext);
  const { ongoingCourse, fetchCourses } = useCourse();
  const { accessToken } = useAuth();
  
  const [qrCode, setQrCode] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [groupStudents, setGroupStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [qrGenerated, setQrGenerated] = useState(false); // Track if QR has been generated
  const [stats, setStats] = useState([
    { title: "Total students", value: "0", icon: totalStudentIcon },
    { title: "Present today", value: "0", icon: presentIcon },
    { title: "Absent today", value: "0", icon: absentIcon },
  ]);

  const getLatencyMinutes = useCallback((latencyTime) => {
    return LATENCY_TIME_MAP[latencyTime] || 10;
  }, []);

  const shouldMarkAsLate = useCallback((checkInTime, courseStartTime) => {
    if (!settings.autoLateMarking || !checkInTime || !courseStartTime) {
      return false;
    }

    const checkIn = DateTime.fromISO(checkInTime);
    const courseStart = DateTime.fromISO(courseStartTime).plus({ hours: 1 });
    const latencyMinutes = getLatencyMinutes(settings.latencyTime);
    const lateThreshold = courseStart.plus({ minutes: latencyMinutes });

    console.log('Late check comparison:', {
      studentName: 'checking...',
      checkInTime: checkIn.toFormat('yyyy-MM-dd HH:mm:ss'),
      courseStartTime: courseStart.toFormat('yyyy-MM-dd HH:mm:ss'),
      lateThreshold: lateThreshold.toFormat('yyyy-MM-dd HH:mm:ss'),
      latencyMinutes: latencyMinutes,
      isLate: checkIn > lateThreshold
    });

    return checkIn > lateThreshold;
  }, [settings.autoLateMarking, settings.latencyTime, getLatencyMinutes]);

  const loadSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsedSettings
        });
        console.log('Dashboard loaded settings:', parsedSettings);
      }
    } catch (error) {
      console.error('Error loading settings in dashboard:', error);
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const updateAttendanceRecord = useCallback(async (recordId, status) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/home/attendance/${recordId}/update-status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ present_status: status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update attendance record. Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  }, [accessToken]);

  const fetchGroupStudents = useCallback(async (groupName) => {
    if (!groupName) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/home/students/?group_name=${groupName}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Error fetching group students");
        return;
      }

      const rawData = await response.json();
      
      if (!Array.isArray(rawData)) {
        console.error("Expected array but got:", typeof rawData);
        return;
      }

      const transformedGroupStudents = rawData
        .map((entry) => {
          const student = entry.student || entry;
          const user = student.user || student;
          
          return {
            id: student.id,
            full_name: user?.full_name || 'Unknown',
            email: user?.email || 'Unknown',
            student_group: student.student_group,
          };
        })
        .filter(student => student.id && student.full_name !== 'Unknown');

      setGroupStudents(transformedGroupStudents);
    } catch (error) {
      console.error("Error fetching group students:", error);
    }
  }, [accessToken]);

  const fetchAttendanceData = useCallback(async (courseId) => {
    if (!courseId) return;

    try {
      setRefreshing(true);

      const response = await fetch(
        `http://127.0.0.1:8000/home/attendance/?course_id=${courseId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Error fetching attendance data");
        return;
      }

      const rawData = await response.json();

      const transformed = await Promise.all(rawData.map(async (entry) => {
        let adjustedTime = entry.time;
        if (entry.time) {
          adjustedTime = DateTime.fromISO(entry.time)
            .minus({ hours: 2 })
            .toFormat("HH:mm:ss");
        }

        let finalStatus = entry.present_status;

        if (settings.autoLateMarking && 
            entry.present_status === "present" && 
            entry.time && 
            ongoingCourse?.date_time) {
          
          const shouldBeLate = shouldMarkAsLate(entry.time , ongoingCourse.date_time);
          
          if (shouldBeLate) {
            try {
              await updateAttendanceRecord(entry.id, "late");
              finalStatus = "late";
              console.log(`Successfully updated ${entry.student.user.full_name} to late status`);
            } catch (error) {
              console.error(`Failed to update ${entry.student.user.full_name} to late:`, error);
            }
          }
        }

        return {
          id: entry.student.id,
          recordId: entry.id,
          full_name: entry.student.user.full_name,
          email: entry.student.user.email,
          status: finalStatus,
          time: adjustedTime,
        };
      }));

      setStudents(transformed);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, settings.autoLateMarking, shouldMarkAsLate, updateAttendanceRecord, ongoingCourse?.date_time]);

  const studentListWithStatus = useMemo(() => {
    return groupStudents.map((groupStudent) => {
      const attendanceRecord = students.find((student) => student.id === groupStudent.id);
      return {
        ...groupStudent,
        status: attendanceRecord ? attendanceRecord.status : "absent",
        time: attendanceRecord ? attendanceRecord.time : "Not checked in",
        recordId: attendanceRecord ? attendanceRecord.recordId : null,
      };
    });
  }, [groupStudents, students]);

  const filteredStudents = useMemo(() => {
    return studentListWithStatus.filter(
      (student) =>
        student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [studentListWithStatus, searchQuery]);

  const computedStats = useMemo(() => {
    const presentStudents = students.filter((student) => 
      student.status === "present" || student.status === "late"
    );
    const totalGroupStudents = groupStudents.length;
    const presentCount = presentStudents.length;
    const absentCount = totalGroupStudents - presentCount;

    return [
      { title: "Total students", value: totalGroupStudents.toString(), icon: totalStudentIcon },
      { title: "Present today", value: presentCount.toString(), icon: presentIcon },
      { title: "Absent today", value: absentCount.toString(), icon: absentIcon },
    ];
  }, [groupStudents.length, students]);

  const handleRefresh = useCallback(() => {
    fetchCourses();
    if (ongoingCourse) {
      fetchGroupStudents(ongoingCourse.group.name);
      fetchAttendanceData(ongoingCourse.id);
    }
  }, [fetchCourses, ongoingCourse, fetchGroupStudents, fetchAttendanceData]);

  const generateNewQR = useCallback(() => {
    if (!settings.qrCheckIn) {
      alert("QR Code check-ins are disabled in settings. Please enable them to generate QR codes.");
      return;
    }
    
    if (!ongoingCourse) return;
    
    const { code, date_time } = ongoingCourse;
    const qrValue = `https://yourwebsite.com/attendance?code=${code}&time=${encodeURIComponent(date_time)}`;
    setQrCode(qrValue);
    setQrGenerated(true);
  }, [settings.qrCheckIn, ongoingCourse]);

  useEffect(() => {
    loadSettings();
    
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        loadSettings();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSettings]);

  useEffect(() => {
    fetchCourses();
    const intervalId = setInterval(fetchCourses, 60000);
    return () => clearInterval(intervalId);
  }, [fetchCourses]);

  useEffect(() => {
    if (ongoingCourse) {
      fetchGroupStudents(ongoingCourse.group.name);
      fetchAttendanceData(ongoingCourse.id);
      setQrGenerated(false);
      setQrCode("");
    } else {
      setStudents([]);
      setGroupStudents([]);
      setQrGenerated(false);
      setQrCode("");
    }
  }, [ongoingCourse, fetchGroupStudents, fetchAttendanceData]);

  useEffect(() => {
    setStats(computedStats);
  }, [computedStats]);

  const renderQRModal = () => {
    if (!showQRModal || !settings.qrCheckIn) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        onClick={() => setShowQRModal(false)}
      >
        <div 
          className="bg-white p-5 rounded-md shadow-lg flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-lg font-semibold mb-3">Scan QR Code</p>
          <QRCodeCanvas value={qrCode} size={220} />
          <button
            onClick={() => setShowQRModal(false)}
            className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = "px-2 py-1 text-sm font-medium rounded";
    switch (status) {
      case "present":
        return `${baseClass} text-green-800 bg-green-100`;
      case "late":
        return `${baseClass} text-orange-800 bg-orange-100`;
      case "absent":
        return `${baseClass} text-red-800 bg-red-100`;
      default:
        return `${baseClass} text-yellow-800 bg-yellow-100`;
    }
  };

  return (
    <div className="flex h-screen">
      <Aside />
      <div className="flex-1 h-screen w-full overflow-y-auto p-4 bg-gray-100">
        <header className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-900 text-xl font-semibold">
              Welcome back Professor {user?.lastName} {user?.firstName}
            </p>
            {ongoingCourse ? (
              <div>
                <p className="text-green-700 text-sm mt-1">
                  Ongoing course: {ongoingCourse.name} ({ongoingCourse.module}) —{" "}
                  {DateTime.fromISO(ongoingCourse.date_time)
                    .setZone("Africa/Algiers")
                    .toFormat("yyyy-MM-dd HH:mm")}
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Group: {ongoingCourse.group.name} ({ongoingCourse.group.section})
                </p>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className={`${settings.qrCheckIn ? 'text-green-600' : 'text-red-600'}`}>
                    QR Check-in: {settings.qrCheckIn ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className={`${settings.autoLateMarking ? 'text-green-600' : 'text-red-600'}`}>
                    Auto Late Marking: {settings.autoLateMarking ? `Enabled (${settings.latencyTime})` : 'Disabled'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-red-500 text-sm mt-1">No ongoing course currently.</p>
            )}
          </div>
          <div className="h-10 flex space-x-3">
            <button
              onClick={handleRefresh}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md transition disabled:opacity-50"
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <Notifications />
            <img src={user?.picture} className="w-10 h-10 rounded-full" alt="User" />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="border border-gray-300 bg-white rounded-md p-3 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-lg font-semibold">{stat.value}</p>
              </div>
              <img src={stat.icon} alt={stat.title} className="h-8 w-8" />
            </div>
          ))}
        </div>

        <div className="mt-4 border border-gray-300 bg-white rounded-md p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="text-lg font-semibold text-gray-800">Quick Attendance QR Code</p>
            {!settings.qrCheckIn && (
              <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                QR Check-ins Disabled
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {qrCode && settings.qrCheckIn && (
              <div className="border border-blue-700 rounded-sm p-2">
                <QRCodeCanvas value={qrCode} size={90} />
              </div>
            )}
            <div className="flex flex-1 flex-col h-full">
              <p className="text-gray-600 text-sm">
                {settings.qrCheckIn 
                  ? "Generate a QR code for quick student check-ins. Students can scan this code using their mobile devices to mark their attendance."
                  : "QR code generation is currently disabled in settings. Enable QR Check-ins in Settings to use this feature."
                }
              </p>
              <div className="flex space-x-3 mt-auto pt-4">
                {!qrGenerated && (
                  <button
                    className={`flex items-center p-2 rounded-md transition ${
                      ongoingCourse && settings.qrCheckIn 
                        ? "bg-gray-200 hover:bg-blue-200" 
                        : "bg-gray-100 cursor-not-allowed opacity-50"
                    }`}
                    onClick={generateNewQR}
                    disabled={!ongoingCourse || !settings.qrCheckIn}
                  >
                    <img src={generateIcon} alt="Generate" className="w-4 h-4" />
                    <p className="ml-2 text-sm">
                      {!settings.qrCheckIn ? "QR Disabled" : "Generate QR"}
                    </p>
                  </button>
                )}
                {qrCode && settings.qrCheckIn && (
                  <button
                    className="flex items-center bg-green-200 hover:bg-green-300 p-2 rounded-md transition"
                    onClick={() => setShowQRModal(true)}
                  >
                    <p className="ml-2 text-sm">Zoom QR</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {renderQRModal()}

        <div className="mt-4 border border-gray-300 bg-white rounded-md p-4 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <p className="text-lg font-semibold text-gray-800">Student Attendance Status</p>
            {ongoingCourse && (
              <button
                onClick={() => {
                  fetchGroupStudents(ongoingCourse.group.name);
                  fetchAttendanceData(ongoingCourse.id);
                }}
                className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-md transition disabled:opacity-50"
                disabled={refreshing}
              >
                {refreshing ? "Updating..." : "Update"}
              </button>
            )}
          </div>
          <Input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          {refreshing ? (
            <div className="text-center text-gray-500 py-4">Loading attendance data...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center text-gray-500 py-2 text-xs">No students found...</div>
          ) : (
            <div className="overflow-auto max-h-64">
              <Table className="min-w-full">
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Time of Scan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${student.email}`}
                          className="text-blue-600 hover:underline"
                          title="Send email"
                        >
                          {student.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className={getStatusBadgeClass(student.status)}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {student.time === "Not checked in" ? (
                          <span className="text-gray-500 text-sm">{student.time}</span>
                        ) : (
                          student.time
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}