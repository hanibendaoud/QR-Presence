import { useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserPlus, BookOpen } from "lucide-react";
import {useAuth} from "../contexts/AuthContext"
const ProfessorForm = () => {
  const [professorData, setProfessorData] = useState({
    user: {
      email: '',
      first_name: '',
      last_name: '',
    },
    module: '',
  });
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (['email', 'first_name', 'last_name'].includes(name)) {
      setProfessorData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          [name]: value,
        }
      }));
    } else {
      setProfessorData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      user: {
        email: professorData.user.email,
        first_name: professorData.user.first_name,
        last_name: professorData.user.last_name,
      },
      module: professorData.module,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/register/professor/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}` ,
          "Content-Type": "application/json",
        },
        
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      toast.success(`Professor ${payload.user.first_name} ${payload.user.last_name} has been successfully registered.`);

      setProfessorData({
        user: { email: '', first_name: '', last_name: '' },
        module: '',
      });
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-md border-0 overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Professor Registration</CardTitle>
            <CardDescription className="text-blue-100 mt-1 text-sm">Register a new professor account</CardDescription>
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
              value={professorData.user.first_name}
              onChange={handleChange}
              placeholder="Alice"
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
              value={professorData.user.last_name}
              onChange={handleChange}
              placeholder="Johnson"
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="email" className="font-medium text-sm">Email address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={professorData.user.email}
              onChange={handleChange}
              placeholder="alice.johnson@university.edu"
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Module */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="module" className="font-medium text-sm">Module *</Label>
            <Input
              id="module"
              name="module"
              value={professorData.module}
              onChange={handleChange}
              placeholder="Software Engineering"
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              required
            />
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
              Register Professor
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProfessorForm;
