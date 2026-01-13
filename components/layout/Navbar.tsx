
import React, { useContext, useState } from 'react';
import { Menu, Bell, Search, LogOut, CheckSquare } from 'lucide-react';
import { UserContext } from '../../context/UserContext';
import UserTaskLogModal from '../shared/UserTaskLogModal';
import ProfileModal from '../profile/ProfileModal';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useContext(UserContext);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-700 focus:outline-none lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:block ml-4">
               <div className="relative">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                   <Search className="w-4 h-4 text-slate-400" />
                 </span>
                 <input 
                    type="text" 
                    placeholder="Search orders, assets..." 
                    className="w-64 py-2 pl-10 pr-4 text-sm text-slate-700 bg-slate-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-secondary/50"
                 />
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3">
               <div 
                 className="text-right hidden sm:block cursor-pointer hover:opacity-80 transition-opacity"
                 onClick={() => setShowProfile(true)}
               >
                 <div className="text-sm font-medium text-slate-900">{user?.name}</div>
                 <div className="text-xs text-slate-500">{user?.role}</div>
               </div>
               
               <div className="relative group cursor-pointer">
                  <img 
                    src={user?.avatar} 
                    alt={user?.name} 
                    className="w-8 h-8 rounded-full ring-2 ring-slate-100 object-cover"
                    onClick={() => setShowProfile(true)}
                  />
               </div>
               
               <button onClick={() => setShowMyTasks(true)} className="ml-1 p-1 text-slate-400 hover:text-primary" title="My Tasks">
                  <CheckSquare className="w-5 h-5" />
               </button>

               <button onClick={logout} className="ml-2 p-1 text-slate-400 hover:text-danger" title="Logout">
                  <LogOut className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      </div>
      
      {showMyTasks && user && (
        <UserTaskLogModal 
          user={user} 
          onClose={() => setShowMyTasks(false)} 
        />
      )}

      {showProfile && (
        <ProfileModal 
          onClose={() => setShowProfile(false)}
        />
      )}
    </header>
  );
};

export default Navbar;
