import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, XCircle, Clock, Server } from 'lucide-react';

const chartData = [
  { time: '12:00', latency: 120 }, { time: '13:00', latency: 132 },
  { time: '14:00', latency: 101 }, { time: '15:00', latency: 144 },
  { time: '16:00', latency: 90 }, { time: '17:00', latency: 110 },
];

const monitors = [
  { id: 1, name: 'Auth Service', url: 'auth.api.acme.com', status: 'Healthy', response: '42ms', uptime: '99.99%', last: '2 min ago' },
  { id: 2, name: 'Payments API', url: 'pay.api.acme.com', status: 'Down', response: '0ms', uptime: '94.20%', last: '1 min ago' },
  { id: 3, name: 'User Profile', url: 'users.api.acme.com', status: 'Healthy', response: '124ms', uptime: '99.95%', last: '5 min ago' },
];

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground dark">
      <Sidebar />
      <main className="flex-1">
        <Header onAddClick={() => setIsModalOpen(true)} />
        
        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total APIs" value="24" icon={<Server size={20}/>} />
            <StatCard title="Healthy" value="21" icon={<CheckCircle2 className="text-green-500" size={20}/>} />
            <StatCard title="Down" value="3" icon={<XCircle className="text-red-500" size={20}/>} />
            <StatCard title="Avg Latency" value="84ms" icon={<Clock size={20}/>} />
          </div>

          {/* Chart Section */}
          <div className="bg-card border border-border p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-6">Global Response Time (Last 6 Hours)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="latency" stroke="#ffffff" fillOpacity={1} fill="url(#colorLatency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-accent/50 text-zinc-400 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">API Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Response Time</th>
                  <th className="px-6 py-4">Uptime %</th>
                  <th className="px-6 py-4">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monitors.map((m) => (
                  <tr key={m.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-zinc-500">{m.url}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        m.status === 'Healthy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-300">{m.response}</td>
                    <td className="px-6 py-4 text-sm text-zinc-300">{m.uptime}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{m.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Monitor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold">Add New Monitor</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">API Name</label>
                <input className="w-full bg-accent/50 border border-border rounded-md p-2" placeholder="e.g. Stripe Webhook" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">URL</label>
                <input className="w-full bg-accent/50 border border-border rounded-md p-2" placeholder="https://api.domain.com/v1" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Check Interval</label>
                <select className="w-full bg-accent/50 border border-border rounded-md p-2">
                  <option>Every 1 minute</option>
                  <option>Every 5 minutes</option>
                  <option>Every 15 minutes</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-accent hover:bg-zinc-800 rounded-md"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-white text-black rounded-md font-bold">
                Create Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-card border border-border p-6 rounded-xl space-y-2">
      <div className="flex justify-between items-center text-zinc-400">
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}