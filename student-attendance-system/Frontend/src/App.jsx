import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './FrontEnd/contexts/LoginContext';
import { ProtectedRoute, NonAuthRoute } from './FrontEnd/components/ProtectedRoutes';
import { CourseProvider } from "./FrontEnd/contexts/CourseContext"
import Login from './FrontEnd/WebPages/Login';

import Dashboard from './FrontEnd/WebPages/professors/dashboard';
import Courses from './FrontEnd/WebPages/professors/courses';
import ManageAttendance from './FrontEnd/WebPages/professors/ManageAttendance';
import Settings from './FrontEnd/WebPages/professors/Settings';

import AdminDashboard from './FrontEnd/WebPages/admin/AdminDashboard';
import ManageUsers from './FrontEnd/WebPages/admin/ManageUsers';
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <UserProvider>
      <CourseProvider>
        <Routes>
          <Route element={<NonAuthRoute />}>
            <Route path="/" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['professor']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/ManageAttendance" element={<ManageAttendance />} />
            <Route path="/Settings" element={<Settings />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </CourseProvider>
    </UserProvider>
  );
}

export default App;
