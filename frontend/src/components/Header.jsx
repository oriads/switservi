import { Bell, User } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

export default function Header({ title = 'HelpDesk IBM i' }) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <DarkModeToggle />
          
          {/* Notificaciones */}
          <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Usuario */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Administrador</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@helpdesk.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
