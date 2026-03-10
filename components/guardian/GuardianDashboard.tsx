"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface GuardianDashboardProps {
  athleteProfile: {
    id: string;
    full_name: string;
    age: number;
    passport_status: string;
  };
  guardianProfile: {
    id: string;
    full_name: string;
    relationship: string;
  };
  pendingApprovals: {
    id: string;
    type: 'message' | 'trial_registration' | 'profile_change';
    description: string;
    requested_at: string;
    requested_by: string;
  }[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }[];
}

export function GuardianDashboard({
  athleteProfile,
  guardianProfile,
  pendingApprovals,
  recentActivity,
}: GuardianDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'activity' | 'settings'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-2xl">
              🛡️
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Guardian Dashboard</h2>
              <p className="text-sm text-slate-400">
                Managing <span className="text-violet-300 font-medium">{athleteProfile.full_name}</span>'s account
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {guardianProfile.relationship} · {guardianProfile.full_name}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Athlete Age</p>
            <p className="text-2xl font-black text-white">{athleteProfile.age}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
              Minor Account
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'approvals', label: `Approvals (${pendingApprovals.length})`, icon: '⏳' },
          { id: 'activity', label: 'Activity', icon: '📜' },
          { id: 'settings', label: 'Settings', icon: '⚙️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab athleteProfile={athleteProfile} />
        )}
        
        {activeTab === 'approvals' && (
          <ApprovalsTab approvals={pendingApprovals} athleteName={athleteProfile.full_name} />
        )}
        
        {activeTab === 'activity' && (
          <ActivityTab activity={recentActivity} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ athleteProfile }: { athleteProfile: { full_name: string; passport_status: string } }) {
  const quickLinks = [
    { label: 'View Passport', href: '/athlete/passport', icon: '🛂' },
    { label: 'Trial Registrations', href: '/athlete/trials', icon: '🏃' },
    { label: 'Messages', href: '/messages', icon: '💬' },
    { label: 'Privacy Settings', href: '/athlete/passport/edit', icon: '🔒' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Quick Stats */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Account Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Passport Status</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              athleteProfile.passport_status === 'active'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}>
              {athleteProfile.passport_status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Message Restrictions</span>
            <span className="text-emerald-400 text-sm">Verified clubs only</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Profile Visibility</span>
            <span className="text-emerald-400 text-sm">Private by default</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Trial Approvals</span>
            <span className="text-amber-400 text-sm">Guardian consent required</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Quick Links
        </h3>
        <div className="grid gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span>{link.icon}</span>
              <span className="text-sm text-slate-300">{link.label}</span>
              <span className="ml-auto text-slate-500">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="md:col-span-2 rounded-xl border border-violet-400/20 bg-violet-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-violet-300 mb-1">Guardian Mode Active</h4>
            <p className="text-sm text-slate-400">
              You are the designated guardian for this athlete. You have control over their 
              privacy settings, can approve trial registrations, and monitor their messages. 
              All clubs must be verified before they can contact {athleteProfile.full_name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalsTab({ 
  approvals, 
  athleteName 
}: { 
  approvals: GuardianDashboardProps['pendingApprovals'];
  athleteName: string;
}) {
  if (approvals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-lg font-semibold text-white mb-2">No Pending Approvals</h3>
        <p className="text-slate-400">
          {athleteName} hasn't requested any actions that require your approval.
        </p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬';
      case 'trial_registration': return '🏃';
      case 'profile_change': return '✏️';
      default: return '📝';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'message': return 'Message Request';
      case 'trial_registration': return 'Trial Registration';
      case 'profile_change': return 'Profile Change';
      default: return 'Action Request';
    }
  };

  return (
    <div className="space-y-3">
      {approvals.map((approval) => (
        <motion.div
          key={approval.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-xl">
              {getTypeIcon(approval.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{getTypeLabel(approval.type)}</span>
                <span className="text-xs text-slate-500">
                  {new Date(approval.requested_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{approval.description}</p>
              <p className="text-xs text-slate-500 mt-1">Requested by: {approval.requested_by}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-colors">
                Approve
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors">
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ActivityTab({ activity }: { activity: GuardianDashboardProps['recentActivity'] }) {
  if (activity.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
        <p className="text-slate-400">No recent activity to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activity.map((item) => (
        <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-sm text-slate-500">
            {new Date(item.timestamp).toLocaleString()}
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-300">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const settings = [
    {
      title: 'Message Permissions',
      description: 'Who can message the athlete',
      value: 'Verified clubs only',
      options: ['Verified clubs only', 'No one', 'Anyone (not recommended)'],
    },
    {
      title: 'Profile Visibility',
      description: 'Who can see the athlete profile',
      value: 'Private',
      options: ['Private', 'Verified clubs only', 'Public'],
    },
    {
      title: 'Trial Registration',
      description: 'Require approval for trial registrations',
      value: 'Yes, require approval',
      enabled: true,
    },
    {
      title: 'Email Notifications',
      description: 'Send notifications for important activities',
      value: 'Enabled',
      enabled: true,
    },
  ];

  return (
    <div className="space-y-4">
      {settings.map((setting, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">{setting.title}</h4>
              <p className="text-sm text-slate-400">{setting.description}</p>
            </div>
            {setting.options ? (
              <select className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white">
                {setting.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  setting.enabled ? 'bg-violet-500' : 'bg-slate-700'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
                  animate={{ x: setting.enabled ? 24 : 0 }}
                />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
