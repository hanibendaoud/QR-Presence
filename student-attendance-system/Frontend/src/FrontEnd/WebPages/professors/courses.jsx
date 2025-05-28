import { useEffect, useState, useContext } from "react";
import Aside from "../../components/aside";
import Notifications from "../../components/notifications";
import { LoginContext } from "../../contexts/LoginContext";
import { useCourse } from "../../contexts/CourseContext";
import { DateTime } from 'luxon'; 

export default function Courses() {
  const { user } = useContext(LoginContext);
  const { 
    courses, 
    loading, 
    fetchCourses, 
    categorizeCourses 
  } = useCourse();
  
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCourses();
    const refreshInterval = setInterval(fetchCourses, 300000);
    return () => clearInterval(refreshInterval);
  }, [fetchCourses]);

  const { upcomingCourses, ongoingCourses, pastCourses } = categorizeCourses();

  const renderCourseList = (title, list) => (
    <div className="bg-white p-4 rounded shadow mb-4">
      <p className="text-lg font-semibold mb-2">{title}</p>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading courses...</p>
      ) : list.length === 0 ? (
        <p className="text-gray-500 text-sm">No courses.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((course) => (
            <li key={course.id} className="p-2 bg-gray-100 rounded border text-sm">
              <p className="font-medium">{course.name} ({course.module})</p>
              <p className="text-gray-600">
                {course.start instanceof Date ? course.start.toLocaleDateString() : 'Invalid date'}{" "}
                {course.start instanceof Date ? course.start.toLocaleTimeString() : 'Invalid time'} - 
                {course.end instanceof Date ? course.end.toLocaleTimeString() : 'Invalid time'}
              </p>
              <p className="text-gray-500 text-xs">
                Code: {course.code} | Group: {course.group?.name || "N/A"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="flex h-screen">
      <Aside />
      <div className="flex-1 h-screen w-full overflow-y-auto p-4 bg-gray-100">
        <header className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-900 text-xl font-semibold">
              Hello Professor {user?.lastName} {user?.firstName}
            </p>
            <p className="text-sm text-gray-500">
              Today is {time instanceof Date ? time.toLocaleDateString() : 'Invalid date'}, 
              {time instanceof Date ? time.toLocaleTimeString() : 'Invalid time'}
            </p>
          </div>
          <div className="h-10 flex space-x-3">
            <button 
              onClick={fetchCourses} 
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md transition"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <Notifications />
            <img src={user?.picture} className="w-10 h-10 rounded-full" alt="User" />
          </div>
        </header>

        {renderCourseList("Ongoing Courses", ongoingCourses)}
        {renderCourseList("Upcoming Courses", upcomingCourses)}
        {renderCourseList("Past Courses", pastCourses)}
      </div>
    </div>
  );
}