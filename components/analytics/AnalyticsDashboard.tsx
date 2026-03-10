"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

export function StatCard({ title, value, change, icon, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm"
    >
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl`} />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="mt-1 text-3xl font-black text-white">{value}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-2xl shadow-lg`}>
            {icon}
          </div>
        </div>
        
        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <span className={`flex items-center gap-1 text-sm font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Activity Chart Component
interface ActivityChartProps {
  data: { name: string; value: number }[];
  title: string;
  color?: string;
}

export function ActivityChart({ data, title, color = "#3b82f6" }: ActivityChartProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-white">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#color${color.replace('#', '')})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Performance Metrics Chart
interface PerformanceMetricsProps {
  data: { category: string; current: number; target: number }[];
}

export function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-white">Performance vs Goals</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" stroke="#64748b" fontSize={12} />
            <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={12} width={100} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="current" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Current" />
            <Bar dataKey="target" fill="#10b981" radius={[0, 4, 4, 0]} name="Target" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Conversion Funnel Component
interface ConversionFunnelProps {
  data: { stage: string; count: number; percentage: number }[];
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-white">Recruitment Funnel</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.stage} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-300">{item.stage}</span>
              <span className="text-sm font-bold text-white">{item.count}</span>
            </div>
            <div className="h-8 overflow-hidden rounded-lg bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full rounded-lg"
                style={{ backgroundColor: colors[index % colors.length] }}
              >
                <span className="flex h-full items-center justify-end pr-2 text-xs font-bold text-white">
                  {item.percentage}%
                </span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Geographic Distribution Component
interface GeographicDistributionProps {
  data: { country: string; count: number; percentage: number }[];
}

export function GeographicDistribution({ data }: GeographicDistributionProps) {
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
  
  const pieData = data.map(item => ({ name: item.country, value: item.count }));
  
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-white">Geographic Distribution</h3>
      <div className="flex items-center gap-6">
        <div className="h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div key={item.country} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-slate-300">{item.country}</span>
              </div>
              <span className="text-sm font-semibold text-white">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Recent Activity List
interface RecentActivityProps {
  activities: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: { name: string; avatar?: string };
  }[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'application': return '📝';
      case 'view': return '👁️';
      case 'save': return '🔖';
      case 'message': return '💬';
      case 'invite': return '✉️';
      default: return '📌';
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-white">Recent Activity</h3>
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg">
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 leading-relaxed">{activity.description}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Goal Progress Component
interface GoalProgressProps {
  goals: {
    id: string;
    goal_type: string;
    current_value: number;
    target_value: number;
    end_date: string;
  }[];
}

export function GoalProgress({ goals }: GoalProgressProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-white">Active Goals</h3>
      <div className="space-y-4">
        {goals.map((goal) => {
          const percentage = Math.min(100, (goal.current_value / goal.target_value) * 100);
          const isCompleted = percentage >= 100;
          
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300 capitalize">
                  {goal.goal_type.replace(/_/g, ' ')}
                </span>
                <span className={`text-sm font-semibold ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                  {goal.current_value}/{goal.target_value}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className={`h-full rounded-full ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                      : 'bg-gradient-to-r from-sky-500 to-blue-500'
                  }`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Due: {new Date(goal.end_date).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Analytics Dashboard Component
interface PlayerAnalyticsDashboardProps {
  stats: {
    profile_views: number;
    applications_sent: number;
    invites_received: number;
    messages_sent: number;
    opportunities_saved: number;
    conversion_rate: number;
  };
  activityData: { name: string; value: number }[];
  recentActivity: RecentActivityProps['activities'];
  goals: GoalProgressProps['goals'];
}

export function PlayerAnalyticsDashboard({
  stats,
  activityData,
  recentActivity,
  goals,
}: PlayerAnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Performance Analytics</h2>
          <p className="text-slate-400">Track your profile performance and activity</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Live Data</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Profile Views"
          value={stats.profile_views.toLocaleString()}
          change={15}
          icon="👁️"
          color="from-sky-500 to-blue-500"
        />
        <StatCard
          title="Applications Sent"
          value={stats.applications_sent}
          change={8}
          icon="📝"
          color="from-violet-500 to-purple-500"
        />
        <StatCard
          title="Invites Received"
          value={stats.invites_received}
          change={23}
          icon="✉️"
          color="from-pink-500 to-rose-500"
        />
        <StatCard
          title="Messages Sent"
          value={stats.messages_sent}
          icon="💬"
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Saved Opportunities"
          value={stats.opportunities_saved}
          icon="🔖"
          color="from-emerald-500 to-green-500"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversion_rate}%`}
          change={5}
          icon="🎯"
          color="from-indigo-500 to-blue-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart data={activityData} title="Profile Views Over Time" />
        <GoalProgress goals={goals} />
      </div>

      {/* Activity Feed */}
      <RecentActivity activities={recentActivity} />
    </div>
  );
}

// Club Analytics Dashboard
interface ClubAnalyticsDashboardProps {
  stats: {
    total_opportunities: number;
    active_opportunities: number;
    total_applications: number;
    shortlisted_candidates: number;
    profile_views: number;
    hire_rate: number;
  };
  funnelData: ConversionFunnelProps['data'];
  activityData: { name: string; value: number }[];
  geoData: GeographicDistributionProps['data'];
  recentActivity: RecentActivityProps['activities'];
}

export function ClubAnalyticsDashboard({
  stats,
  funnelData,
  activityData,
  geoData,
  recentActivity,
}: ClubAnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Club Analytics Dashboard</h2>
          <p className="text-slate-400">Monitor your recruitment performance</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Live Data</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Opportunities"
          value={stats.total_opportunities}
          change={12}
          icon="📋"
          color="from-sky-500 to-blue-500"
        />
        <StatCard
          title="Active Opportunities"
          value={stats.active_opportunities}
          icon="🟢"
          color="from-emerald-500 to-green-500"
        />
        <StatCard
          title="Total Applications"
          value={stats.total_applications}
          change={18}
          icon="📨"
          color="from-violet-500 to-purple-500"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted_candidates}
          change={8}
          icon="⭐"
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Profile Views"
          value={stats.profile_views.toLocaleString()}
          change={25}
          icon="👁️"
          color="from-pink-500 to-rose-500"
        />
        <StatCard
          title="Hire Rate"
          value={`${stats.hire_rate}%`}
          change={3}
          icon="🎯"
          color="from-indigo-500 to-blue-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ConversionFunnel data={funnelData} />
        <GeographicDistribution data={geoData} />
      </div>

      {/* Activity Chart & Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart data={activityData} title="Application Activity" color="#10b981" />
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
}

// Export Recharts components for use
export { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area };
