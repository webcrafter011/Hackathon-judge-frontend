import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Mail, 
  Building, 
  Code, 
  Link as LinkIcon,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Save,
  Loader2,
  Shield,
  CheckCircle,
  AlertCircle,
  Key
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Label, 
  Textarea,
  Alert,
  Badge,
  AvatarUpload
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui';
import { uploadAvatar } from '../../services/assetService';
import { cn, getErrorMessage } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

// Validation schema for profile
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  organization: z.string().max(100, 'Organization name too long').optional(),
  skills: z.string().optional(), // Comma-separated
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.profile?.bio || '',
      organization: user?.profile?.organization || '',
      skills: user?.profile?.skills?.join(', ') || '',
      github: user?.profile?.socialLinks?.github || '',
      linkedin: user?.profile?.socialLinks?.linkedin || '',
      twitter: user?.profile?.socialLinks?.twitter || '',
      website: user?.profile?.socialLinks?.website || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle avatar file selection
  const handleAvatarChange = async (file) => {
    setAvatarFile(file);
    setMessage(null);
    
    // Upload immediately
    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar(file);
      console.log('Avatar upload result:', result);
      
      // The avatar URL could be in different places depending on backend response
      const newAvatarUrl = result.asset?.storageUrl || result.asset?.url || result.url || result.avatar;
      
      if (newAvatarUrl) {
        // Update user in store with new avatar URL
        setUser({
          ...user,
          avatar: newAvatarUrl,
        });
        setMessage({ type: 'success', text: 'Avatar updated successfully!' });
      } else {
        // If we can't find the URL in response, fetch the full user profile
        const { fetchCurrentUser } = useAuthStore.getState();
        await fetchCurrentUser();
        setMessage({ type: 'success', text: 'Avatar updated successfully!' });
      }
      
      setAvatarFile(null);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    // Note: To actually remove avatar, would need an API endpoint
  };

  // Handle profile update
  const onSubmitProfile = async (data) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Process skills
      const skills = data.skills
        ? data.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: data.name,
        profile: {
          bio: data.bio || undefined,
          organization: data.organization || undefined,
          skills,
          socialLinks: {
            github: data.github || undefined,
            linkedin: data.linkedin || undefined,
            twitter: data.twitter || undefined,
            website: data.website || undefined,
          },
        },
      };

      const response = await api.put(`/users/${user.id}`, payload);
      
      // Update user in store
      const updatedUser = response.data.user || response.data;
      setUser({ ...user, ...updatedUser });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      reset(data); // Reset form state to mark as not dirty
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  // Note: Backend doesn't have a direct password change endpoint for logged-in users
  // Using the updateUser endpoint which may support password change
  const onSubmitPassword = async (data) => {
    setIsChangingPassword(true);
    setMessage(null);

    try {
      await api.put(`/users/${user.id}`, {
        password: data.newPassword,
      });
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      resetPassword();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Key },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and profile information
        </p>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          {message.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {message.text}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2',
              'border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-secondary border-secondary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <AvatarUpload
                  value={user?.avatar}
                  onChange={handleAvatarChange}
                  onRemove={handleAvatarRemove}
                  isUploading={isUploadingAvatar}
                  name={user?.name}
                  size="xl"
                />
                
                <div className="mt-4 text-center">
                  <h3 className="font-semibold text-foreground">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge className="mt-2" variant="outline">
                    <Shield size={12} className="mr-1" />
                    {user?.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your profile details and social links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        {...register('name')}
                        className="pl-10"
                        placeholder="Your full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-error">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <div className="relative">
                      <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="organization"
                        {...register('organization')}
                        className="pl-10"
                        placeholder="Company or school"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...register('bio')}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                  {errors.bio && (
                    <p className="text-sm text-error">{errors.bio.message}</p>
                  )}
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <div className="relative">
                    <Code size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="skills"
                      {...register('skills')}
                      className="pl-10"
                      placeholder="React, Python, Machine Learning (comma-separated)"
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <LinkIcon size={16} />
                    Social Links
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <div className="relative">
                        <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="github"
                          {...register('github')}
                          className="pl-10"
                          placeholder="https://github.com/username"
                        />
                      </div>
                      {errors.github && (
                        <p className="text-sm text-error">{errors.github.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <div className="relative">
                        <Linkedin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="linkedin"
                          {...register('linkedin')}
                          className="pl-10"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                      {errors.linkedin && (
                        <p className="text-sm text-error">{errors.linkedin.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <div className="relative">
                        <Twitter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="twitter"
                          {...register('twitter')}
                          className="pl-10"
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                      {errors.twitter && (
                        <p className="text-sm text-error">{errors.twitter.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="website"
                          {...register('website')}
                          className="pl-10"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      {errors.website && (
                        <p className="text-sm text-error">{errors.website.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading || !isDirty}>
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword('currentPassword')}
                  placeholder="Enter current password"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-error">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword('newPassword')}
                  placeholder="Enter new password"
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-error">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword('confirmPassword')}
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-error">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Key size={18} />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProfilePage;
