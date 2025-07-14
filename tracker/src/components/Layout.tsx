
import React, { useState, Fragment, useCallback } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Dialog, Transition } from '@headlessui/react';
import { 
  FiHome, FiCheckSquare, FiTarget, FiEdit3, FiUser, FiSettings, FiLogOut, FiMenu, FiX,
  FiSun, FiMoon, FiMonitor, FiDollarSign, FiMessageSquare
} from 'react-icons/fi';
import OptimizedImage from './OptimizedImage';

const SidebarContent = React.memo<{
  onLinkClick?: () => void,
  toggleTheme: () => void,
  getThemeIcon: () => JSX.Element
}>(({ onLinkClick, toggleTheme, getThemeIcon }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { to: '/dashboard', icon: FiHome, text: 'Dashboard' },
    { to: '/tasks', icon: FiCheckSquare, text: 'Tasks' },
    { to: '/goals', icon: FiTarget, text: 'Goals' },
    { to: '/habits', icon: FiEdit3, text: 'Habits' },
    { to: '/notes', icon: FiEdit3, text: 'Notes' },
    { to: '/expenses', icon: FiDollarSign, text: 'Expenses' },
    { to: '/ai-assistant', icon: FiMessageSquare, text: 'AI Assistant' },
  ];

  const bottomMenuItems = [
    { to: '/profile', icon: FiUser, text: 'Profile' },
    { to: '/settings', icon: FiSettings, text: 'Settings' },
  ];

  const handleLogout = useCallback(async () => {
    if (onLinkClick) onLinkClick();
    await logout();
    navigate('/login');
  }, [onLinkClick, logout, navigate]);

  const baseLinkClass = "flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200";
  const activeLinkClass = "bg-primary-500 text-white dark:bg-primary-600";

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center space-x-3 border-b border-gray-200 dark:border-gray-700">
        {user?.photoURL ? (
          <OptimizedImage
            src={user.photoURL}
            alt={user.displayName || 'User avatar'}
            className="h-10 w-10 rounded-full object-cover"
            width={40}
            height={40}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            email={user.email || ''}
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-lg font-bold">
            {user?.displayName?.charAt(0) || '?'}
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">{user?.displayName}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Productivity Tracker</p>
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-2">
        {menuItems.map(item => (
          <NavLink
            key={item.text}
            to={item.to}
            onClick={onLinkClick}
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.text}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {bottomMenuItems.map(item => (
          <NavLink
            key={item.text}
            to={item.to}
            onClick={onLinkClick}
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.text}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className={`${baseLinkClass} w-full text-red-500 dark:hover:bg-red-500 dark:hover:text-white`}
        >
          <FiLogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
        <button
          onClick={toggleTheme}
          className={`${baseLinkClass} w-full flex items-center justify-start mt-2`}
        >
          {getThemeIcon()}
          <span className="ml-3">Toggle Theme</span>
        </button>
      </div>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, setTheme } = useThemeContext();
  const location = useLocation();

  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <FiSun className="h-5 w-5" />;
      case 'dark':
        return <FiMoon className="h-5 w-5" />;
      default:
        return <FiMonitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <SidebarContent toggleTheme={toggleTheme} getThemeIcon={getThemeIcon} />
        </div>
      </div>

      {/* Mobile sidebar with transition */}
      <Transition.Root show={isSidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setIsSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <FiX className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent toggleTheme={toggleTheme} getThemeIcon={getThemeIcon} onLinkClick={() => setIsSidebarOpen(false)} />
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100 dark:bg-gray-900 flex items-center justify-between">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <FiMenu className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mr-4 p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {getThemeIcon()}
          </button>
        </div>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default React.memo(Layout); 
