import React from 'react';

function Nav({ name, logo, isActive = false }) {
  return (
    <button 
      className={` 
        cursor-pointer
        flex items-center 
        w-[85%]  p-[0.5rem]
        ml-[1rem] mt-[1.2rem] 
        rounded-[0.5rem]
        transition-colors duration-200
        ${isActive ? 'bg-[#1E40AF] cursor-alias' : 'hover:bg-blue-700'}
      `}
    >
      <img 
        src={logo} 
        alt={name}
        className="w-[16px] h-[16px] mr-[1rem]" 
      />
      <p className={`${isActive ?"text-white font-medium" : "text-gray-300 font-medium"}`}>{name}</p>
    </button>
  );
}
export default Nav;