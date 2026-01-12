import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Package, HardHat, Settings, X, Truck, Activity, Users } from 'lucide-react';
import { UserContext } from '../context/UserContext';
import { UserRole, UserPermission } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useContext(UserContext);
  const location = useLocation();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: [UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.CLIENT] },
    { to: '/work-orders', icon: ClipboardList, label: 'Work Orders', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { to: '/assets', icon: Truck, label: 'Assets', roles: [UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.CLIENT] },
    { to: '/inventory', icon: Package, label: 'Inventory', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { to: '/users', icon: Users, label: 'Team', roles: [UserRole.ADMIN], permission: UserPermission.MANAGE_TEAM },
  ];

  const hasAccess = (link: any) => {
    if (!user) return false;
    if (link.roles.includes(user.role)) return true;
    if (link.permission && user.permissions?.includes(link.permission)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900 bg-opacity-50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transition-transform transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <HardHat className="w-8 h-8 text-secondary" />
            <span className="text-xl font-bold tracking-tight">ConstructMate</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-4 py-6 space-y-2">
          {links.filter(hasAccess).map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive 
                    ? 'bg-secondary text-primary' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                {link.label}
              </NavLink>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-700">
            <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System
            </div>
            <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
              <Settings className="w-5 h-5 mr-3 text-slate-400" />
              Settings
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
               <Activity className="w-5 h-5 mr-3 text-slate-400" />
               Reports
            </a>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;