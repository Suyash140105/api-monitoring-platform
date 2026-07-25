import { Bell, Search, User, Plus } from 'lucide-react';

export default function Header({ onAddClick }) {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          className="w-full bg-accent/50 border border-border rounded-md py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="Search APIs..."
        />
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onAddClick}
          className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} /> Add Monitor
        </button>
        <button className="p-2 text-zinc-400 hover:text-white"><Bell size={20} /></button>
        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-zinc-400 cursor-pointer">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}