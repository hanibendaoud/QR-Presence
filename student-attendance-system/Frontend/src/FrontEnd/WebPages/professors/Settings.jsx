import Aside from "../../components/aside.jsx";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useContext, useEffect } from "react";
import { LoginContext } from "../../contexts/LoginContext.jsx";

export default function Settings() {
  const { user } = useContext(LoginContext);
  const [autoLateMarking, setAutoLateMarking] = useState(true);
  const [qrCheckIn, setQrCheckIn] = useState(true);
  const [latencyTime, setLatencyTime] = useState("10min");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const loadSettingsFromStorage = () => {
      try {
        const savedSettings = localStorage.getItem('attendanceSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          if (parsedSettings.autoLateMarking !== undefined) {
            setAutoLateMarking(parsedSettings.autoLateMarking);
          }
          if (parsedSettings.qrCheckIn !== undefined) {
            setQrCheckIn(parsedSettings.qrCheckIn);
          }
          if (parsedSettings.latencyTime !== undefined) {
            setLatencyTime(parsedSettings.latencyTime);
          }
        } else {
          console.log('No saved settings found, using defaults');
        }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadSettingsFromStorage();
  }, []);

  useEffect(() => {
    if (isInitialLoad) {
      return;
    }

    const saveSettingsToStorage = () => {
      const settings = {
        autoLateMarking,
        qrCheckIn,
        latencyTime,
        lastUpdated: new Date().toISOString() 
      };
      
      try {
        localStorage.setItem('attendanceSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);
      }
    };

    saveSettingsToStorage();
  }, [autoLateMarking, qrCheckIn, latencyTime, isInitialLoad]);

  const handleAutoLateMarkingChange = (checked) => {
    setAutoLateMarking(checked);
  };

  const handleQrCheckInChange = (checked) => {
    setQrCheckIn(checked);
  };

  const handleLatencyTimeChange = (value) => {
    setLatencyTime(value);
  };

  return (
    <div className="flex">
      <Aside />
      <div className="flex-1 h-screen w-full overflow-y-auto p-6 bg-gray-100">
        <h1 className="text-gray-900 text-xl font-semibold">Settings</h1>

        <div className="mt-4 border border-gray-300 bg-white rounded-md p-6 shadow-sm">
          <p className="text-lg font-semibold text-gray-800">Profile Settings</p>
          <div className="flex items-center gap-6 mt-4">
            <div className="relative w-20 h-20">
              <img
                src={user.picture}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border"
              />
              <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full cursor-pointer shadow-md">
                <input type="file" className="hidden" />
                📷
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <label className="text-sm text-gray-600">Full Name</label>
                <Input defaultValue={`Dr. ${user.lastName} ${user.firstName}`} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <Input defaultValue={user.email} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <Input defaultValue="" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Department</label>
                <Input defaultValue="Computer Science" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border border-gray-300 bg-white rounded-md p-6 shadow-sm">
          <p className="text-lg font-semibold text-gray-800">Attendance Preferences</p>
          
          <div className="flex justify-between items-center mt-3">
            <div>
              <p className="font-medium text-gray-700">QR Code Check-ins</p>
              <p className="text-sm text-gray-500">Enable QR code-based attendance tracking</p>
            </div>
            <Switch checked={qrCheckIn} onCheckedChange={handleQrCheckInChange} />
          </div>
                    
          <div className="flex justify-between items-center mt-3">
            <div>
              <p className="font-medium text-gray-700">Automatic Late Marking</p>
              <p className="text-sm text-gray-500">Mark students as late after a specified time</p>
            </div>
            <div className="flex items-center space-x-2">
              {autoLateMarking && (
                <Select value={latencyTime} onValueChange={handleLatencyTimeChange}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Latency time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">5min</SelectItem>
                    <SelectItem value="10min">10min</SelectItem>
                    <SelectItem value="15min">15min</SelectItem>
                    <SelectItem value="20min">20min</SelectItem>
                    <SelectItem value="30min">30min</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Switch checked={autoLateMarking} onCheckedChange={handleAutoLateMarkingChange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}