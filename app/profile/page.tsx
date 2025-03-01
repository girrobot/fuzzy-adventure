"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSave } from 'react-icons/fa';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    website: '',
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      setUser(user);
      
      // Fetch profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          bio: data.bio || '',
          website: data.website || '',
        });
      }
      
      setLoading(false);
    };

    getUser();
  }, [router]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          bio: profile.bio,
          website: profile.website,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setEditing(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
          
          {message.text && (
            <div className={`px-4 py-3 rounded mb-4 ${
              message.type === 'error' 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl">
                    <FaUser />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold">{profile.full_name || user.email?.split('@')[0]}</h2>
                    <p className="text-gray-600 flex items-center">
                      <FaEnvelope className="mr-2" /> {user.email}
                    </p>
                  </div>
                </div>
                
                {!editing ? (
                  <button 
                    onClick={() => setEditing(true)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    <FaEdit /> Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="border-t pt-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Member since</p>
                  <p className="flex items-center text-gray-700">
                    <FaCalendarAlt className="mr-2" /> 
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={profile.website}
                        onChange={(e) => setProfile({...profile, website: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.bio && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Bio</h3>
                        <p className="text-gray-600">{profile.bio}</p>
                      </div>
                    )}
                    
                    {profile.website && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Website</h3>
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                    
                    {!profile.bio && !profile.website && (
                      <p className="text-gray-500 italic">
                        Your profile is empty. Click "Edit Profile" to add information about yourself.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 