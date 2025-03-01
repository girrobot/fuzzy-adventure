"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUser, FaCog, FaSignOutAlt, FaFileAlt, FaChevronDown, FaGoogle, FaApple, FaFacebook } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { getGravatarUrl } from '../lib/utils';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  // Get avatar based on auth provider
  const getAvatarUrl = (user: any) => {
    // If user has a custom avatar in profile
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    
    // If user authenticated with a provider that has an avatar
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    
    // For email users, use Gravatar
    if (user?.email) {
      return getGravatarUrl(user.email);
    }
    
    // Default avatar
    return '';
  };

  // Get auth provider icon
  const getProviderIcon = () => {
    if (!user) return <FaUser />;
    
    const provider = user.app_metadata?.provider;
    
    switch(provider) {
      case 'google':
        return <FaGoogle />;
      case 'apple':
        return <FaApple />;
      case 'facebook':
        return <FaFacebook />;
      default:
        return <FaUser />;
    }
  };

  // Check session validity
  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session error:", error);
        setUser(null);
        setProfile(null);
        setAvatarUrl('');
        return false;
      }
      
      if (!data.session) {
        // No active session
        setUser(null);
        setProfile(null);
        setAvatarUrl('');
        return false;
      }
      
      // Session is valid, get user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        setUser(null);
        setProfile(null);
        setAvatarUrl('');
        return false;
      }
      
      setUser(userData.user);
      
      // Set avatar URL
      if (userData.user.email) {
        setAvatarUrl(getGravatarUrl(userData.user.email));
      }
      
      return true;
    } catch (err) {
      console.error("Error checking session:", err);
      setUser(null);
      setProfile(null);
      setAvatarUrl('');
      return false;
    } finally {
      setSessionChecked(true);
    }
  };

  // Load user data without blocking UI rendering
  useEffect(() => {
    const loadUserData = async () => {
      const sessionValid = await checkSession();
      
      if (!sessionValid) return;
      
      try {
        // Try to get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileData && !profileError) {
          setProfile(profileData);
          // Update avatar if profile has custom avatar
          if (profileData.avatar_url) {
            setAvatarUrl(profileData.avatar_url);
          }
        } else if (user?.user_metadata) {
          const newProfile = {
            id: user.id,
            full_name: user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            updated_at: new Date().toISOString()
          };
          
          setProfile(newProfile);
          
          // If provider has avatar, use it
          if (user.user_metadata?.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
          }
          
          // Save to profiles table for future use
          await supabase.from('profiles').upsert(newProfile);
        }
      } catch (err) {
        console.log('Error loading profile data:', err);
      }
    };
    
    loadUserData();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setProfile(null);
        setAvatarUrl('');
        router.push('/');
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Recheck session to ensure it's valid
        await checkSession();
        
        if (user) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
              
            if (profileData) {
              setProfile(profileData);
              if (profileData.avatar_url) {
                setAvatarUrl(profileData.avatar_url);
              }
            }
          } catch (err) {
            console.log('Error updating profile on auth change');
          }
        }
      }
    });
    
    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);
    
    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [user, router]);
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setAvatarUrl('');
      router.push('/');
    } catch (err) {
      console.error('Error signing out');
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  // Get display name with improved fallback logic
  const getDisplayName = () => {
    // First check profile data
    if (profile?.full_name) {
      return profile.full_name;
    }
    
    // Then check user metadata
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    
    // Then check user metadata full_name
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    // Fall back to email username
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            Verbi
          </Link>

          <div className="flex items-center space-x-6">
            {!sessionChecked ? (
              // Show loading state while checking session
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <div className="relative">
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                      {getProviderIcon()}
                    </div>
                  )}
                  <span className="hidden md:inline">{getDisplayName()}</span>
                  <FaChevronDown className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FaFileAlt className="mr-2" /> Dashboard
                    </Link>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FaUser className="mr-2" /> Profile
                    </Link>
                    <Link 
                      href="/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FaCog className="mr-2" /> Settings
                    </Link>
                    <button 
                      onClick={() => {
                        handleSignOut();
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/signin" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}