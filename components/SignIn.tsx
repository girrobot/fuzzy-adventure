"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Modal from './Modal';
import { useAuthModal } from '../lib/hooks/useAuthModal';
import { useRouter } from 'next/navigation';

type Provider = 'google' | 'apple' | 'facebook';

export default function SignIn() {
  const router = useRouter();
  const { isOpen, mode, openModal, closeModal } = useAuthModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log("SignIn component rendered", { isOpen, mode });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setSuccess('');
      setIsEmailFocused(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Check for authenticated user
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/dashboard');
          closeModal();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, closeModal]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        // Successful sign-in will be handled by the auth listener
      } else {
        // Sign up with email
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        
        if (error) throw error;
        
        setSuccess('Verification email sent! Please check your inbox and click the link to verify your email.');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: Provider) => {
    setError('');
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) throw error;
      // Redirect will be handled by Supabase
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={closeModal}>
          <div className="w-full max-w-md mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">
                {mode === 'signin' ? 'Sign in' : 'Sign up'}
              </h1>
              <button
                onClick={() => openModal(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary hover:underline"
              >
                {mode === 'signin' ? 'I need an account' : 'I have an account'}
              </button>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Work or school email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
              </div>

              {(isEmailFocused || mode === 'signin') && (
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                    disabled={isLoading}
                  />
                  {mode === 'signup' && (
                    <p className="text-sm text-gray-500 mt-1">Use 8 characters or more</p>
                  )}
                </div>
              )}

              {mode === 'signup' && isEmailFocused && (
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary text-white p-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign in' : 'Agree and sign up'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleOAuth('google')}
                className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
              
              <button
                onClick={() => handleOAuth('facebook')}
                className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <img src="/facebook-icon.svg" alt="Facebook" className="w-5 h-5" />
                <span>Continue with Facebook</span>
              </button>

              <button
                onClick={() => handleOAuth('apple')}
                className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <img src="/apple-icon.svg" alt="Apple" className="w-5 h-5" />
                <span>Continue with Apple</span>
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500 text-center">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">Terms and Conditions</a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </Modal>
      )}
    </>
  );
} 