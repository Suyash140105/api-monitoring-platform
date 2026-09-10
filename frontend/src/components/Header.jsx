import { Bell, Search, User, Plus, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Header({
  onAddClick,
  searchTerm,
  setSearchTerm,
}) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="relative w-96">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          size={18}
        />

        <input
          className="w-full bg-accent/50 border border-border rounded-md py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="Search APIs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onAddClick}
          className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} />
          Add Monitor
        </button>

        <button className="p-2 text-zinc-400 hover:text-white" title="Notifications">
          <Bell size={20} />
        </button>

        {user && (
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-zinc-400">
              <User size={18} />
            </div>
            <span className="hidden md:inline font-medium text-xs">{user.name || user.email}</span>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-accent/40 hover:bg-accent border border-border px-3 py-1.5 rounded-md transition-colors"
          title="Sign Out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}