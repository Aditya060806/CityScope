import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/UserService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Save,
  ArrowLeft,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [profileSettings, setProfileSettings] = useState({
    name: '',
    email: '',
    bio: '',
    location: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    issueUpdates: true,
    rewardUpdates: true,
    communityNews: false,
    weeklyDigest: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showLocation: true,
    showActivity: true,
    allowMessages: true
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system',
    language: 'en',
    fontSize: 'medium'
  });

  // Load profile from Supabase on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadProfile = async () => {
      const profile = await userService.getUserProfile(user.id);
      if (profile) {
        setProfileSettings({
          name: profile.name,
          email: profile.email,
          bio: profile.bio || '',
          location: profile.location || ''
        });
        if (profile.preferences) {
          setNotificationSettings(prev => ({
            ...prev,
            emailNotifications: profile.preferences.notifications ?? true,
          }));
          setPrivacySettings(prev => ({
            ...prev,
            profileVisibility: (profile.preferences as Record<string, unknown>).profileVisibility as string ?? 'public',
            showLocation: profile.preferences.locationSharing ?? true,
            showActivity: (profile.preferences as Record<string, unknown>).showActivity as boolean ?? true,
            allowMessages: (profile.preferences as Record<string, unknown>).allowMessages as boolean ?? true,
          }));
        }
      }
    };
    loadProfile();
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const result = await userService.updateUserProfile(user.id, {
        name: profileSettings.name,
        bio: profileSettings.bio,
        location: profileSettings.location,
      });
      if (result) {
        toast({ title: "Profile updated", description: "Your profile settings have been saved successfully." });
      } else {
        throw new Error('Update returned null');
      }
    } catch (error) {
      toast({ title: "Update failed", description: "There was an error updating your profile. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const success = await userService.updateNotificationPreferences(user.id, {
        emailNotifications: notificationSettings.emailNotifications,
        pushNotifications: notificationSettings.pushNotifications,
        issueUpdates: notificationSettings.issueUpdates,
        rewardUpdates: notificationSettings.rewardUpdates,
        communityNews: notificationSettings.communityNews,
        weeklyDigest: notificationSettings.weeklyDigest,
      });
      if (success) {
        toast({ title: "Notification settings updated", description: "Your notification preferences have been saved." });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast({ title: "Update failed", description: "There was an error updating your notification settings.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const success = await userService.updateNotificationPreferences(user.id, {
        profileVisibility: privacySettings.profileVisibility as unknown as boolean,
        showLocation: privacySettings.showLocation,
        showActivity: privacySettings.showActivity,
        allowMessages: privacySettings.allowMessages,
      });
      if (success) {
        toast({ title: "Privacy settings updated", description: "Your privacy settings have been saved." });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast({ title: "Update failed", description: "There was an error saving privacy settings.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        const success = await userService.deleteAccount(user.id);
        if (success) {
          await signOut();
          toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
          navigate('/');
        } else {
          throw new Error('Deletion failed');
        }
      } catch (error) {
        toast({ title: "Deletion failed", description: "There was an error deleting your account. Please try again.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!user) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <PageHeader
            icon={<SettingsIcon className="h-5 w-5" />}
            title="Settings"
            description="Manage your profile, privacy, notifications, and appearance preferences."
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="border-royal/20 text-royal hover:bg-royal/5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            }
          />

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 rounded-[1.25rem] bg-slate-100/80 p-1.5 shadow-inner">
              <TabsTrigger value="profile" className="flex items-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all text-sm">
                <User className="w-4 h-4 hidden sm:block" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all text-sm">
                <Bell className="w-4 h-4 hidden sm:block" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all text-sm">
                <Shield className="w-4 h-4 hidden sm:block" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all text-sm">
                <Palette className="w-4 h-4 hidden sm:block" />
                Appearance
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                    <User className="w-5 h-5 text-indigo-500" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Full Name</Label>
                      <Input
                        id="name"
                        value={profileSettings.name}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-[15px] font-medium transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileSettings.email}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-[15px] font-medium transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Bio</Label>
                    <Input
                      id="bio"
                      value={profileSettings.bio}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-[15px] font-medium transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Location</Label>
                    <Input
                      id="location"
                      value={profileSettings.location}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-[15px] font-medium transition-colors"
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-[0_8px_20px_rgb(79,70,229,0.3)] transition-all hover:scale-[1.02]">
                    <Save className="w-5 h-5 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                    <Bell className="w-5 h-5 text-indigo-500" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <SettingSwitchRow
                      id="email-notifications"
                      label="Email Notifications"
                      description="Receive notifications via email"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                    <SettingSwitchRow
                      id="push-notifications"
                      label="Push Notifications"
                      description="Receive push notifications in your browser"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                    <Separator />
                    <SettingSwitchRow
                      id="issue-updates"
                      label="Issue Updates"
                      description="Get notified when your reported issues are updated"
                      checked={notificationSettings.issueUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, issueUpdates: checked }))}
                    />
                    <SettingSwitchRow
                      id="reward-updates"
                      label="Reward Updates"
                      description="Get notified about new rewards and achievements"
                      checked={notificationSettings.rewardUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, rewardUpdates: checked }))}
                    />
                    <SettingSwitchRow
                      id="community-news"
                      label="Community News"
                      description="Get notified about community updates and news"
                      checked={notificationSettings.communityNews}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, communityNews: checked }))}
                    />
                    <SettingSwitchRow
                      id="weekly-digest"
                      label="Weekly Digest"
                      description="Receive a weekly summary of your activity"
                      checked={notificationSettings.weeklyDigest}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyDigest: checked }))}
                    />
                  </div>
                  <Button onClick={handleSaveNotifications} disabled={isLoading} className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-[0_8px_20px_rgb(79,70,229,0.3)] transition-all hover:scale-[1.02]">
                    <Save className="w-5 h-5 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                    <Shield className="w-5 h-5 text-indigo-500" />
                    Privacy & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-visibility" className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Profile Visibility</Label>
                      <select
                        id="profile-visibility"
                        value={privacySettings.profileVisibility}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                        className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-[15px] font-medium transition-colors outline-none focus:border-indigo-300"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <SettingSwitchRow
                      id="show-location"
                      label="Show Location"
                      description="Display your location on your profile"
                      checked={privacySettings.showLocation}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showLocation: checked }))}
                    />
                    <SettingSwitchRow
                      id="show-activity"
                      label="Show Activity"
                      description="Display your recent activity on your profile"
                      checked={privacySettings.showActivity}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showActivity: checked }))}
                    />
                    <SettingSwitchRow
                      id="allow-messages"
                      label="Allow Messages"
                      description="Allow other users to send you messages"
                      checked={privacySettings.allowMessages}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowMessages: checked }))}
                    />
                  </div>
                  <Button onClick={handleSavePrivacy} disabled={isLoading} className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-[0_8px_20px_rgb(79,70,229,0.3)] transition-all hover:scale-[1.02]">
                    <Save className="w-5 h-5 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Privacy Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900">
                    <Palette className="w-5 h-5 text-indigo-500" />
                    Appearance & Language
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="theme" className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Theme</Label>
                      <select
                        id="theme"
                        value={appearanceSettings.theme}
                        onChange={(e) => setAppearanceSettings(prev => ({ ...prev, theme: e.target.value }))}
                        className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-[15px] font-medium transition-colors outline-none focus:border-indigo-300"
                      >
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Language</Label>
                      <select
                        id="language"
                        value={appearanceSettings.language}
                        onChange={(e) => setAppearanceSettings(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-[15px] font-medium transition-colors outline-none focus:border-indigo-300"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="font-size" className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Font Size</Label>
                      <select
                        id="font-size"
                        value={appearanceSettings.fontSize}
                        onChange={(e) => setAppearanceSettings(prev => ({ ...prev, fontSize: e.target.value }))}
                        className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-[15px] font-medium transition-colors outline-none focus:border-indigo-300"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-[0_8px_20px_rgb(79,70,229,0.3)] transition-all hover:scale-[1.02]">
                    <Save className="w-5 h-5 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Appearance Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Danger Zone */}
          <Card className="bg-red-50/50 border border-red-100 rounded-[2rem] overflow-hidden shadow-sm">
            <CardHeader className="px-8 py-6 border-b border-red-100/50 bg-red-50/80">
              <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-red-800">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[17px] font-black tracking-tight text-red-800 mb-1.5">Delete Account</h4>
                  <p className="text-[13px] font-medium text-red-700/80 mb-6 max-w-2xl leading-relaxed">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="flex items-center gap-2 h-14 rounded-xl px-6 font-bold bg-red-600 hover:bg-red-700 text-white shadow-[0_8px_20px_rgb(220,38,38,0.3)] transition-all hover:scale-[1.02]"
                  >
                    <Trash2 className="w-5 h-5 mr-1" />
                    {isLoading ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface SettingSwitchRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const SettingSwitchRow: React.FC<SettingSwitchRowProps> = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors p-4">
      <div className="flex-1 pr-4">
        <Label htmlFor={id} className="text-[15px] font-bold tracking-tight text-slate-900 leading-none mb-1 block">{label}</Label>
        <p className="text-[13px] font-medium text-slate-500 leading-snug">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-indigo-600" />
    </div>
  );
};
