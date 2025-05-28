import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';
import { LoginContext } from '../contexts/LoginContext.jsx';
import logo from '../assets/logo_esi_blanc.png';
import dashboardIcon from '../assets/dashboard.svg';
import dashboardHover from '../assets/dashboardHover.svg';
import manageIcon from '../assets/manage.svg';
import manageHover from '../assets/ManageHover.svg';
import logoutIcon from '../assets/logout.svg';
import Nav from '../components/nav_aside.jsx';

export default function AdminAside(){
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(LoginContext);
  
  const handleLogout = () => {
      googleLogout();
      logout();
      navigate('/');
  };
  return(
    <aside style={{ width: '19%', minWidth: '170px' }} className="h-screen bg-[#1A237E] shadow-lg flex flex-col justify-between">
    <div className="p-4 h-[7rem] border-b-2 border-[#1E40AF] flex justify-center items-center">
        <img src={logo} alt="Logo ESI" className="w-[5rem] h-[5rem] object-contain" />
    </div>
    <nav className="mt-4 flex-grow flex flex-col">
        <Link to="/admin/dashboard">
            <Nav isActive={location.pathname==="/admin/dashboard"} name="Dashboard" logo={location.pathname==="/admin/dashboard"?dashboardHover:dashboardIcon} />
        </Link>
        <Link to="/admin/users">
            <Nav isActive={location.pathname==="/admin/users"} name="Manage Users" logo={location.pathname==="/admin/users"?manageHover:manageIcon} />
        </Link>
    </nav>
    <div className="flex justify-center mb-3">
        <button 
            className="cursor-pointer w-[85%] bg-red-600 hover:bg-red-500 flex items-center justify-center p-2 rounded transition-colors duration-200" 
            onClick={handleLogout}
        >
            <img src={logoutIcon} alt="Logout" className="w-4 h-4 mr-2" />
            <p className="text-gray-300 font-medium text-sm">Logout</p>
        </button>
    </div>
</aside>
  )
}