"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import DocumentList from '../../components/DocumentList';
import { FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [sessionError, setSessionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Simple exponential backoff for retries
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    const checkSession = async () => {
      try {
        console.log("Dashboard: Checking session...");
        setLoading(true);
        
        // Check if session is valid
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Dashboard: Session error:", sessionError);
          setSessionError(true);
          setLoadError("Session error: " + sessionError.message);
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }
        
        if (!sessionData.session) {
          console.log("Dashboard: No valid session found");
          setSessionError(true);
          setLoadError("No active session found");
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }
        
        // Get user data
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Dashboard: User error:", userError);
          setSessionError(true);
          setLoadError("User error: " + userError.message);
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }
        
        if (!userData.user) {
          console.log("Dashboard: No valid user found");
          setSessionError(true);
          setLoadError("No user found");
          setTimeout(() => router.push('/signin'), 2000);
          return;
        }
        
        console.log("Dashboard: Session valid, user found");
        setUser(userData.user);
        setLoadError(null);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard: Error checking session:", err);
        setLoadError("Unexpected error: " + (err instanceof Error ? err.message : String(err)));
        
        // Retry logic
        if (retryCount < 3) {
          console.log(`Dashboard: Retrying in ${retryDelay}ms (attempt ${retryCount + 1})`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            checkSession();
          }, retryDelay);
        } else {
          setSessionError(true);
          setTimeout(() => router.push('/signin'), 2000);
        }
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Dashboard: Auth state changed:", event);
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED' as any) {
          router.push('/');
        } else if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log("Dashboard: Cleaning up auth listener");
      authListener.subscription.unsubscribe();
    };
  }, [router, retryCount]);

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
          {loadError && (
            <div className="mt-4 text-red-500 flex items-center justify-center">
              <FaExclamationTriangle className="mr-2" />
              <span className="text-sm">{loadError}</span>
            </div>
          )}
          {retryCount > 0 && !sessionError && (
            <p className="mt-2 text-sm text-gray-500">
              Retry attempt {retryCount}/3...
            </p>
          )}
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