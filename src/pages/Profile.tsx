import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, MapPin, Award, Settings, LogOut, Edit, Bell, MapPin as MapPinIcon, TrendingUp } from 'lucide-react';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';

export const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, activity, loading, error, updateProfile } = useUserProfile();
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  if (!user || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#1E40AF] mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">{error ? 'Error Loading Profile' : 'Profile Not Found'}</h3>
          <p className="text-sm text-slate-400">{error || 'Unable to load your profile.'}</p>
        </div>
      </div>
    );
  }

  const reportsSubmitted = profile.reportsSubmitted ?? 0;
  const reportsResolved = profile.reportsResolved ?? 0;
  const totalPoints = profile.totalPoints ?? 0;
  const joinDate = profile.joinDate || new Date().toISOString();
  const level = Math.floor(totalPoints / 1000) + 1;

  const userStats = [
    { label: 'Reports', value: reportsSubmitted.toString(), icon: Award, color: 'bg-blue-50 text-blue-600' },
    { label: 'Resolved', value: reportsResolved.toString(), icon: Award, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Points', value: totalPoints.toLocaleString(), icon: TrendingUp, color: 'bg-violet-50 text-violet-600' },
    { label: 'Member Since', value: new Date(joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), icon: Calendar, color: 'bg-amber-50 text-amber-600' },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'report_resolved': return 'bg-emerald-500';
      case 'report_submitted': return 'bg-blue-500';
      case 'points_earned': return 'bg-amber-500';
      case 'badge_earned': return 'bg-orange-500';
      case 'profile_updated': return 'bg-violet-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          icon={<User className="h-5 w-5" />}
          title="My Profile"
          description="Manage your account and review your civic engagement journey."
          actions={
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative group">
              {/* Profile Header */}
              <div className="bg-indigo-600 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)] rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-sm shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[22px] font-black tracking-tight text-white leading-tight mb-1">{profile.name}</h2>
                    <p className="text-white/80 text-[13px] font-bold tracking-wide">{profile.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  {[
                    { icon: Mail, text: profile.email },
                    { icon: Calendar, text: `Joined ${new Date(joinDate).toLocaleDateString()}` },
                    { icon: MapPin, text: profile.location || 'Location not set' },
                  ].map((item, i) => (
                    <ProfileInfoRow key={i} icon={item.icon} text={item.text} />
                  ))}
                </div>

                <div className="pt-5 border-t border-slate-100">
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold tracking-wide py-1 px-3 mb-4 shadow-sm">
                    Level {level} Civic Hero
                  </Badge>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase text-slate-500">
                      <span>Level {level + 1}</span>
                      <span className="text-indigo-600">{totalPoints % 1000}/1000 pts</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500 relative"
                        style={{ width: `${Math.min((totalPoints % 1000) / 10, 100)}%` }}
                      >
                        <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-white/30 to-transparent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats and Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {userStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-[1.25rem] p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-300 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[28px] font-black tracking-tighter text-slate-900 leading-none">{stat.value}</span>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mt-2">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-[19px] font-black tracking-tighter text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-500" />
                  Recent Activity
                </h3>
              </div>
              <div className="p-5">
                {activity.length > 0 ? (
                  <div className="space-y-3">
                    {activity.map((item) => {
                      const points = item.points ?? 0;
                      const activityType = item.type || 'report_submitted';
                      const activityTitle = activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                      return (
                        <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                          <div className={`w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ${getActivityColor(activityType)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold tracking-tight text-slate-900 truncate mb-0.5">{activityTitle}</p>
                            <p className="text-[13px] font-medium text-slate-500 truncate">
                              {item.description || 'No description'} — {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          {points !== 0 && (
                            <Badge className={`text-[11px] font-bold tracking-widest uppercase shadow-sm ${points > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {points > 0 ? '+' : ''}{points} pts
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-[15px] font-bold tracking-tight text-slate-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-[19px] font-black tracking-tighter text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  Account Settings
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <ProfileActionRow
                  icon={Edit}
                  label="Edit Profile"
                  onClick={() => setShowEditModal(true)}
                />
                <ProfileActionRow
                  icon={Bell}
                  label="Notification Settings"
                  onClick={() => navigate('/settings')}
                />
                <ProfileActionRow
                  icon={MapPinIcon}
                  label="Location Preferences"
                  onClick={() => navigate('/settings')}
                />
                <ProfileActionRow
                  icon={Settings}
                  label="Open Full Settings"
                  onClick={() => navigate('/settings')}
                />
                <Button variant="destructive" className="w-full justify-start h-12 mt-4 rounded-xl font-bold shadow-sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onSave={updateProfile}
      />
    </div>
  );
};

interface ProfileInfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

const ProfileInfoRow: React.FC<ProfileInfoRowProps> = ({ icon: Icon, text }) => {
  return (
    <div className="flex items-center gap-3 text-[13px] font-bold text-slate-600 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors px-4 py-3">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
};

interface ProfileActionRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

const ProfileActionRow: React.FC<ProfileActionRowProps> = ({ icon: Icon, label, onClick }) => {
  return (
    <Button variant="outline" className="w-full justify-start h-12 rounded-xl text-[14px] font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all border-slate-200 shadow-sm" onClick={onClick}>
      <Icon className="w-4 h-4 mr-3" /> {label}
    </Button>
  );
};
