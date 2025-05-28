import { useState } from "react";
import AdminAside from "../../components/adminAside";
import StudentForm from "../../components/StudentForm";
import ProfessorForm from "../../components/ProfessorForm";
import CourseForm from "../../components/CourseForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersRound, GraduationCap, BookOpen } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export default function AdminDashboard() {
const [activeTab, setActiveTab] = useState("students");

return (
    <div className="flex h-screen bg-gray-50">
    <AdminAside />
    <div className="flex-1 h-screen w-full overflow-y-auto p-6">
        <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Dashboard
            </h1>
            <p className="text-gray-500 mt-2">
                Add users and courses in the DataBase
            </p>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-lg shadow-md">
            <p className="text-white font-medium">Administrator Panel</p>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <Tabs
            defaultValue="students"
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
            >
            <TabsList className="w-full mb-4 bg-gray-100 p-2 rounded-lg flex justify-around">
                <TabsTrigger
                value="students"
                className={`flex items-center justify-center gap-2 text-base py-3 px-4 rounded-md transition-all duration-200 ${
                    activeTab === "students"
                    ? "bg-white text-blue-600 shadow-sm font-medium"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
                >
                <UsersRound size={18} />
                <span>Students</span>
                </TabsTrigger>
                <TabsTrigger
                value="professors"
                className={`flex items-center justify-center gap-2 text-base py-3 px-4 rounded-md transition-all duration-200 ${
                    activeTab === "professors"
                    ? "bg-white text-blue-600 shadow-sm font-medium"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
                >
                <GraduationCap size={18} />
                <span>Professors</span>
                </TabsTrigger>
                <TabsTrigger
                value="courses"
                className={`flex items-center justify-center gap-2 text-base py-3 px-4 rounded-md transition-all duration-200 ${
                    activeTab === "courses"
                    ? "bg-white text-blue-600 shadow-sm font-medium"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
                >
                <BookOpen size={18} />
                <span>Courses</span>
                </TabsTrigger>
            </TabsList>

            <div className="">
                <TabsContent
                value="students"
                className="animate-in fade-in-50 slide-in-from-bottom-5"
                >
                <div className="p-1">
                    <StudentForm />
                </div>
                </TabsContent>
                <TabsContent
                value="professors"
                className="animate-in fade-in-50 slide-in-from-bottom-5"
                >
                <div className="p-1">
                    <ProfessorForm />
                </div>
                </TabsContent>
                <TabsContent
                value="courses"
                className="animate-in fade-in-50 slide-in-from-bottom-5"
                >
                <div className="p-1">
                    <CourseForm />
                </div>
                </TabsContent>
            </div>
            </Tabs>
        </div>

        <div className="py-4 text-center text-gray-500 text-sm">
            <p>Student Attendance Management System - Administrator Panel</p>
        </div>
        </div>
    </div>
    <Toaster position="top-right" richColors />
    </div>
);
}
