import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const UserProfile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    name: user?.username || '',
    email: user?.email || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const validateProfileForm = () => {
    let valid = true;
    const newErrors = { ...errors };
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const validatePasswordForm = () => {
    let valid = true;
    const newErrors = { ...errors };
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      valid = false;
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
      valid = false;
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      valid = false;
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;
    
    try {
      await updateProfile(profileData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    try {
      await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update password. Please check your current password.",
        variant: "destructive",
      });
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'hipoo') => {
    setTheme(newTheme);
    toast({
      title: "Theme Changed",
      description: newTheme === 'hipoo' ? 'Switched to Hipoo (Accessible) mode.' : `Switched to ${newTheme} mode.`,
      variant: "default",
    });
  };
  
  return (
    <div className="flex justify-center items-start p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
          <CardDescription>
            Manage your account details, password, and appearance settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Profile Details</TabsTrigger>
              <TabsTrigger value="password">Change Password</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <form onSubmit={handleProfileSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Username</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Enter your username"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={user?.role || ''}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-sm text-gray-500">Role cannot be changed</p>
                  </div>
                </div>
                
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            </TabsContent>
            
            <TabsContent value="password">
              <form onSubmit={handlePasswordSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                    {errors.currentPassword && (
                      <p className="text-sm text-red-500">{errors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-red-500">{errors.newPassword}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                
                <Button type="submit" className="w-full">Change Password</Button>
              </form>
            </TabsContent>

            <TabsContent value="appearance">
              <div className="space-y-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred theme for the application. Your choice will be saved and applied across all pages.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-yellow-500 text-lg">☀️</span>
                      </div>
                      <div>
                        <Label className="text-base font-medium">Light Mode</Label>
                        <p className="text-sm text-muted-foreground">Clean and bright interface</p>
                      </div>
                    </div>
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => handleThemeChange('light')}
                      className="min-w-[100px]"
                    >
                      {theme === 'light' ? 'Active' : 'Activate'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-lg">🌙</span>
                      </div>
                      <div>
                        <Label className="text-base font-medium">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Easy on the eyes in low light</p>
                      </div>
                    </div>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => handleThemeChange('dark')}
                      className="min-w-[100px]"
                    >
                      {theme === 'dark' ? 'Active' : 'Activate'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#2364aa] border-2 border-[#adb5bd] rounded-full flex items-center justify-center">
                        <span className="text-white text-lg" title="Accessible">✔️</span>
                      </div>
                      <div>
                        <Label className="text-base font-medium">Hipoo Mode</Label>
                        <p className="text-sm text-muted-foreground">Accessible, color-blind friendly, high-contrast</p>
                      </div>
                    </div>
                    <Button
                      variant={theme === 'hipoo' ? 'default' : 'outline'}
                      onClick={() => handleThemeChange('hipoo')}
                      className="min-w-[100px]"
                    >
                      {theme === 'hipoo' ? 'Active' : 'Activate'}
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Quick Toggle</Label>
                      <p className="text-sm text-muted-foreground">Switch between themes instantly</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={toggleTheme}
                      className="flex items-center gap-2"
                    >
                      {theme === 'light' ? (
                        <>
                          <span>🌙</span>
                          <span>Switch to Dark</span>
                        </>
                      ) : theme === 'dark' ? (
                        <>
                          <span>✔️</span>
                          <span>Switch to Hipoo</span>
                        </>
                      ) : (
                        <>
                          <span>☀️</span>
                          <span>Switch to Light</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Theme Information</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your theme preference is saved automatically</li>
                    <li>• The theme applies to all pages and components</li>
                    <li>• You can change the theme at any time</li>
                    <li>• The system respects your browser's dark mode preference by default</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-5">
          <p className="text-sm text-gray-500">
            {user?.role === 'admin' ? 'Admin Account' : 'Employee Account'}
          </p>
          <p className="text-sm text-gray-500">
            User ID: {user?.id || 'N/A'}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserProfile; 