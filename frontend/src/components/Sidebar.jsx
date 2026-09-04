import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, AlertTriangle, BarChart3, Settings, Zap } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { name: 'Monitors', icon: Activity, to: '/monitors' },
  { name: 'Incidents', icon: AlertTriangle, to: '/incidents' },
  { name: 'Analytics', icon: BarChart3, to: '/analytics' },
  { name: 'Settings', icon: Settings, to: '/settings' },
];

export default function Sidebar() {
  return (
    <div className="w-64 border-r border-border bg-card h-screen sticky top-0 flex flex-col">
      <div className="p-6 flex items-center gap-2 font-bold text-xl text-white">
        <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        <span>PulseMonitor</span>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-accent text-white' : 'text-zinc-400 hover:text-white hover:bg-accent/50'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}