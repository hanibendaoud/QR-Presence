import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';
import { LoginContext } from '../contexts/LoginContext';
import logo from '../assets/logo_esi_blanc.png';
import { LayoutDashboard, Users, Settings, LogOut, BookOpen } from 'lucide-react';

function Nav({ name, icon, isActive }) {
  return (
    <div className={`flex items-center space-x-3 px-4 py-2 hover:bg-blue-800 ${isActive ? 'bg-blue-900 text-white' : 'text-gray-300'}`}>
      <div>
        {icon}
      </div>
      <p className="text-sm font-medium">{name}</p>
    </div>
  );
}

function Aside() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(LoginContext);

  const handleLogout = () => {
    googleLogout();
    logout();
    navigate('/');
  };

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <aside style={{ width: '19%', minWidth: '170px' }} className="h-screen bg-[#1A237E] shadow-lg flex flex-col justify-between">
      <div className="p-4 h-[7rem] border-b-2 border-[#1E40AF] flex justify-center items-center">
        <img src={logo} alt="Logo ESI" className="w-[5rem] h-[5rem] object-contain" />
      </div>

      <div className="text-center text-gray-300 mt-2 p-2 text-xs">
        <p className="font-semibold">
          📅 {time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p className="font-bold text-sm">
          ⏰ {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>

      <nav className="mt-2 flex-grow flex flex-col">
        <Link to="/dashboard">
          <Nav 
            isActive={location.pathname === "/dashboard"} 
            name="Dashboard" 
            icon={<LayoutDashboard size={18} />} 
          />
        </Link>
        <Link to="/ManageAttendance">
          <Nav 
            isActive={location.pathname === "/ManageAttendance"} 
            name="Manage Attendance" 
            icon={<Users size={18} />} 
          />
        </Link>
        <Link to="/courses">
          <Nav 
            isActive={location.pathname === "/courses"} 
            name="Courses" 
            icon={<BookOpen size={18} />} 
          />
        </Link>
        <Link to="/Settings">
          <Nav 
            isActive={location.pathname === "/Settings"} 
            name="Settings" 
            icon={<Settings size={18} />} 
          />
        </Link>
      </nav>

    <div className="flex justify-center mb-3">
        <button 
        className="cursor-pointer w-[85%] bg-red-600 hover:bg-red-500 flex items-center justify-center p-2 rounded transition-colors duration-200" 
        onClick={handleLogout}
        >
        <LogOut size={16} className="text-gray-300 mr-2" />
        <p className="text-gray-300 font-medium text-sm">Logout</p>
        </button>
      </div>
    </aside>
  );
}

export default Aside;
