"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaKey, FaBell, FaPalette, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    email_notifications: true,
    theme: 'light',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ text: '', type: '', section: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      setUser(user);
      
      // Fetch user settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setSettings({
          email_notifications: data.email_notifications,
          theme: data.theme || 'light',
        });
      }
      
      setLoading(false);
    };

    getUser();
  }, [router]);

  const saveSettings = async () => {
    try {
      setMessage({ text: '', type: '', section: '' });
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: settings.email_notifications,
          theme: settings.theme,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setMessage({ 
        text: 'Settings saved successfully!', 
        type: 'success',
        section: 'preferences' 
      });
      setTimeout(() => setMessage({ text: '', type: '', section: '' }), 3000);
    } catch (error: any) {
      setMessage({ 
        text: error.message, 
        type: 'error',
        section: 'preferences' 
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setChangingPassword(true);
      setMessage({ text: '', type: '', section: '' });
      
      // Validate passwords
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setMessage({ 
          text: 'New passwords do not match', 
          type: 'error',
          section: 'password' 
        });
        return;
      }
      
      if (passwordForm.newPassword.length < 6) {
        setMessage({ 
          text: 'Password must be at least 6 characters', 
          type: 'error',
          section: 'password' 
        });
        return;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;
      
      setMessage({ 
        text: 'Password updated successfully!', 
        type: 'success',
        section: 'password' 
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setMessage({ text: '', type: '', section: '' }), 3000);
    } catch (error: any) {
      setMessage({ 
        text: error.message, 
        type: 'error',
        section: 'password' 
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold flex items-center">
                <FaKey className="mr-2 text-gray-600" /> Security
              </h2>
            </div>
            
            <div className="p-6">
              <h3 className="text-md font-medium mb-4">Change Password</h3>
              
              {message.section === 'password' && message.text && (
                <div className={`px-4 py-3 rounded mb-4 ${
                  message.type === 'error' 
                    ? 'bg-red-50 border border-red-200 text-red-700' 
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                  {message.type === 'error' ? (
                    <FaExclamationTriangle className="inline mr-2" />
                  ) : (
                    <FaCheck className="inline mr-2" />
                  )}
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold flex items-center">
                <FaPalette className="mr-2 text-gray-600" /> Preferences
              </h2>
            </div>
            
            <div className="p-6">
              {message.section === 'preferences' && message.text && (
                <div className={`px-4 py-3 rounded mb-4 ${
                  message.type === 'error' 
                    ? 'bg-red-50 border border-red-200 text-red-700' 
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                  {message.type === 'error' ? (
                    <FaExclamationTriangle className="inline mr-2" />
                  ) : (
                    <FaCheck className="inline mr-2" />
                  )}
                  {message.text}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-3 flex items-center">
                    <FaBell className="mr-2 text-gray-600" /> Notifications
                  </h3>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="email_notifications"
                      checked={settings.email_notifications}
                      onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-700">
                      Receive email notifications
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Get notified about important updates and activity.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-3">Theme</h3>
                  
                  <div className="flex space-x-4">
                    <div 
                      className={`border rounded-md p-3 cursor-pointer ${
                        settings.theme === 'light' 
                          ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSettings({...settings, theme: 'light'})}
                    >
                      <div className="w-16 h-16 bg-white border border-gray-200 rounded mb-2"></div>
                      <div className="text-center text-sm font-medium">Light</div>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-3 cursor-pointer ${
                        settings.theme === 'dark' 
                          ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSettings({...settings, theme: 'dark'})}
                    >
                      <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded mb-2"></div>
                      <div className="text-center text-sm font-medium">Dark</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Note: Theme changes will be applied on your next login.
                  </p>
                </div>
                
                <div>
                  <button
                    onClick={saveSettings}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 