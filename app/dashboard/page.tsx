"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import DocumentList from '../../components/DocumentList';
import { FaChartLine } from 'react-icons/fa';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Check if session is valid
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.log("No valid session found");
          setSessionError(true);
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }
        
        // Get user data
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.log("No valid user found");
          setSessionError(true);
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }
        
        setUser(userData.user);
        setLoading(false);
      } catch (err) {
        console.error("Error checking session:", err);
        setSessionError(true);
        setTimeout(() => router.push('/signin'), 2000);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          router.push('/');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {sessionError 
              ? "Session expired. Redirecting to login..." 
              : "Loading your dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="mb-6 border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Documents
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Writing Analytics
            </button>
          </nav>
        </div>

        {activeTab === 'documents' && <DocumentList />}
        
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FaChartLine className="mx-auto text-gray-300 text-5xl mb-4" />
                <h3 className="text-lg font-medium text-gray-700">Writing Analytics</h3>
                <p className="text-gray-500 mt-2">
                  Track your writing progress and get insights to improve your skills.
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  Analytics will be available after you create more documents.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 