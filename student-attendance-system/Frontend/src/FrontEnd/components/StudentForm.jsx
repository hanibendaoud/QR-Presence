import { useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, UserPlus, Mail, Users } from "lucide-react";

const StudentForm = () => {
  const [studentData, setStudentData] = useState({
    user: {
      email: '',
      first_name: '',
      last_name: '',
    },
    student_group_id: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        [name]: value,
      }
    }));
  };

  const handleGroupChange = (value) => {
    setStudentData(prev => ({
      ...prev,
      student_group_id: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!studentData.student_group_id) {
      toast.error("Please select a student group.");
      setIsLoading(false);
      return;
    }

    const payload = {
      user: {
        email: studentData.user.email,
        first_name: studentData.user.first_name,
        last_name: studentData.user.last_name,
      },
      student_group_id: parseInt(studentData.student_group_id),
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/register/student/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();

      toast.success(`Student ${payload.user.first_name} ${payload.user.last_name} has been successfully registered.`);

      setStudentData({
        user: { email: '', first_name: '', last_name: '' },
        student_group_id: '',
      });

      console.log('Registration successful:', data);
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-md border-0 overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Student Registration</CardTitle>
            <CardDescription className="text-blue-100 mt-1 text-sm">Register a new student account</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-1 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">

          {/* First Name */}
          <div className="space-y-1.5">
            <Label htmlFor="first_name" className="font-medium text-sm">First name *</Label>
            <Input
              id="first_name"
              name="first_name"
              type="text"
              value={studentData.user.first_name}
              onChange={handleChange}
              placeholder="John"
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <Label htmlFor="last_name" className="font-medium text-sm">Last name *</Label>
            <Input
              id="last_name"
              name="last_name"
              type="text"
              value={studentData.user.last_name}
              onChange={handleChange}
              placeholder="Doe"
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="email" className="font-medium flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-blue-500" />
              Email address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={studentData.user.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Student Group */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="studentGroupId" className="font-medium flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-500" />
              Student group *
            </Label>
            <Select value={studentData.student_group_id} onValueChange={handleGroupChange}>
              <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select a group..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">G1 - Section 1</SelectItem>
                <SelectItem value="2">G2 - Section 1</SelectItem>
                <SelectItem value="3">G3 - Section 2</SelectItem>
                <SelectItem value="4">G4 - Section 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end items-center p-5 bg-gray-50 gap-4">
        <Button
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Register Student
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentForm;
