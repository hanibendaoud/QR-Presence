import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { DateTime } from 'luxon';  

async function fetchWithAuth(url, accessToken, options = {}) {
  if (!accessToken) {
    throw new Error("Access token not available");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  return fetch(url, { ...options, headers });
}

function CourseForm() {
  const { accessToken } = useAuth();

  const [course, setCourse] = useState({
    name: '',
    date_time: '',
    module: '',
    professor_id: '',
    group_id: '',
  });

  const [professors, setProfessors] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      setIsDataLoading(true);
      try {
        const [profResponse, groupResponse] = await Promise.all([
          fetchWithAuth("http://127.0.0.1:8000/home/professors/", accessToken),
          fetchWithAuth("http://127.0.0.1:8000/home/groups/", accessToken),
        ]);

        if (!profResponse.ok || !groupResponse.ok) {
          throw new Error("Failed to fetch required data.");
        }

        const professorsData = await profResponse.json();
        const groupsData = await groupResponse.json();

        setProfessors(Array.isArray(professorsData) ? professorsData : []);
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error(`Error loading form data: ${err.message}`);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!course.name.trim()) newErrors.name = "Course name is required";
    if (!course.module.trim()) newErrors.module = "Module is required";
    if (!course.professor_id) newErrors.professor_id = "Please select a professor";
    if (!course.group_id) newErrors.group_id = "Please select a group";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateCourseCode = () => {
    const namePart = course.name.trim().split(" ").map(w => w[0]).join("").toUpperCase();
    const modulePart = course.module.trim().split(" ").map(w => w[0]).join("").toUpperCase();
    const timestamp = Date.now().toString().slice(-5);
    return `${namePart}${modulePart}${timestamp}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const payload = {
      ...course,
      code: generateCourseCode(),
    };


    if (course.date_time) {
      const localDateTime = DateTime.fromISO(course.date_time);
      payload.date_time = localDateTime.toUTC().toISO();
    }

    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/home/courses/", accessToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const serverErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          serverErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        setErrors(serverErrors);
        throw new Error("Please correct the errors in the form.");
      }

      toast.success(`${course.name} has been successfully added.`);
      setCourse({
        name: '',
        date_time: '',
        module: '',
        professor_id: '',
        group_id: '',
      });
      setErrors({});
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSelect = (id, label, value, options, placeholder) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={errors[id] ? "text-red-500" : ""}>{label} *</Label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={handleChange}
        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          errors[id] ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
        }`}
        disabled={isDataLoading}
      >
        <option value="">{isDataLoading ? "Loading..." : placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {id === "professor_id"
              ? `${option.user?.first_name ?? ""} ${option.user?.last_name ?? ""}`
              : option.name}
          </option>
        ))}
      </select>
      {errors[id] && <p className="text-red-500 text-sm mt-1">{errors[id]}</p>}
    </div>
  );

  const renderInput = (id, label, type = "text", placeholder = "", required = true) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={errors[id] ? "text-red-500" : ""}>
        {label} {required && "*"}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={course[id]}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={errors[id] ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
      />
      {errors[id] && <p className="text-red-500 text-sm mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <Card className="w-full shadow-md border-0 overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Add New Course</CardTitle>
            <CardDescription className="text-blue-100 mt-1 text-sm">
              Enter course details to add it to the curriculum
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {isDataLoading ? (
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
          <p className="text-gray-500">Loading form data...</p>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="p-5 pt-1 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {renderInput("name", "Course Name", "text", "Introduction to Programming")}
              {renderInput("module", "Module", "text", "Programming Fundamentals")}
              {renderSelect("professor_id", "Professor", course.professor_id, professors, "Select a professor")}
              {renderSelect("group_id", "Group", course.group_id, groups, "Select a group")}
              {renderInput("date_time", "Date & Time", "datetime-local", "", false)}
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <p className="text-red-600 text-sm font-medium">
                  Please correct the errors above before submitting
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end p-5 bg-gray-50 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCourse({
                  name: '',
                  date_time: '',
                  module: '',
                  professor_id: '',
                  group_id: '',
                });
                setErrors({});
              }}
              className="px-6 py-2 rounded-md"
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Submitting..." : "Add Course"}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

export default CourseForm;