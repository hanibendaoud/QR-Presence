import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { LoginContext } from "./LoginContext";
import { DateTime } from "luxon";

const CourseContext = createContext();

export function CourseProvider({ children }) {
  const { accessToken } = useAuth();
  const { user } = useContext(LoginContext);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ongoingCourse, setOngoingCourse] = useState(null);

  const fetchCourses = useCallback(async () => {
    if (!accessToken || !user?.email) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/home/courses/?module=&group_name=&professor_email=${user.email}&section_name=`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();

      const now = new Date();
      const updatedCourses = data.map(course => {
        const start = DateTime.fromISO(course.date_time)
          .setZone('Africa/Algiers')
          .toJSDate();
        const end = new Date(start.getTime() + 90 * 60000);
        return { ...course, start, end };
      });

      const ongoing = updatedCourses.find(c => now >= c.start && now <= c.end) || null;

      setCourses(updatedCourses);
      setOngoingCourse(ongoing);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user]);

  const categorizeCourses = useCallback(() => {
    const now = new Date();
    const upcomingCourses = [];
    const ongoingCourses = [];
    const pastCourses = [];

    courses.forEach(course => {
      if (course.start > now) {
        upcomingCourses.push(course);
      } else if (course.start <= now && course.end >= now) {
        ongoingCourses.push(course);
      } else {
        pastCourses.push(course);
      }
    });

    return { upcomingCourses, ongoingCourses, pastCourses };
  }, [courses]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <CourseContext.Provider
      value={{
        courses,
        loading,
        fetchCourses,
        categorizeCourses,
        ongoingCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  return useContext(CourseContext);
}
