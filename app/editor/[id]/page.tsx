"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSave, FaCheck, FaMagic, FaKeyboard, FaClock, FaFont } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import { checkGrammar } from '../../../lib/grammarCheck';

export default function Editor({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('Untitled Document');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [grammarSuggestions, setGrammarSuggestions] = useState<any[]>([]);
  const [sessionError, setSessionError] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, readingTime: 0 });
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);
  const router = useRouter();
  const id = params.id;

  // Update content ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Check session validity
  const checkSession = async () => {
    try {
      // Check if session is valid
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.log("No valid session found in editor");
        setSessionError(true);
        setTimeout(() => router.push('/signin'), 2000);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error checking session:", err);
      setSessionError(true);
      setTimeout(() => router.push('/signin'), 2000);
      return false;
    }
  };

  // Calculate document statistics
  const calculateStats = useCallback((text: string) => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    // Average reading time: 200 words per minute
    const readingTime = Math.ceil(words / 200);
    
    setStats({ words, chars, readingTime });
  }, []);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled || !contentRef.current) return;
    
    try {
      const sessionValid = await checkSession();
      if (!sessionValid) return;
      
      await supabase
        .from('documents')
        .update({
          title,
          content: contentRef.current,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [autoSaveEnabled, id, title, checkSession]);

  // Set up auto-save timer
  useEffect(() => {
    if (autoSaveEnabled && !loading) {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setInterval(() => {
        autoSave();
      }, 30000); // Auto-save every 30 seconds
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, loading, autoSave]);

  // Save document
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      
      const sessionValid = await checkSession();
      if (!sessionValid) return;
      
      const { error } = await supabase
        .from('documents')
        .update({
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        setMessage({ text: 'Error saving document', type: 'error' });
        return;
      }
      
      setMessage({ text: 'Document saved successfully', type: 'success' });
      setLastSaved(new Date());
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [id, title, content, checkSession]);

  // Check grammar
  const handleGrammarCheck = async () => {
    if (!content.trim()) {
      setMessage({ text: 'Please add some content to check grammar', type: 'error' });
      return;
    }
    
    try {
      setCheckingGrammar(true);
      setMessage({ text: '', type: '' });
      setGrammarSuggestions([]);
      
      const suggestions = await checkGrammar(content);
      
      if (suggestions.length === 0) {
        setMessage({ text: 'No grammar issues found', type: 'success' });
        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 3000);
        return;
      }
      
      setGrammarSuggestions(suggestions);
    } catch (error) {
      console.error('Grammar check error:', error);
      setMessage({ text: 'Error checking grammar', type: 'error' });
    } finally {
      setCheckingGrammar(false);
    }
  };

  // Load document
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        
        const sessionValid = await checkSession();
        if (!sessionValid) return;
        
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching document:', error);
          setMessage({ text: 'Error loading document', type: 'error' });
          return;
        }
        
        if (data) {
          setTitle(data.title);
          setContent(data.content || '');
          calculateStats(data.content || '');
          setLastSaved(new Date(data.updated_at));
        }
      } catch (error) {
        console.error('Error:', error);
        setMessage({ text: 'An unexpected error occurred', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    loadDocument();
    
    // Set up keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // Ctrl/Cmd + G to check grammar
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        handleGrammarCheck();
      }
      
      // Escape to close grammar suggestions
      if (e.key === 'Escape' && grammarSuggestions.length > 0) {
        e.preventDefault();
        setGrammarSuggestions([]);
      }
      
      // Ctrl/Cmd + K to show keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [id, router, calculateStats, grammarSuggestions.length]);

  // Update stats when content changes
  useEffect(() => {
    calculateStats(content);
  }, [content, calculateStats]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Apply grammar suggestion
  const applyGrammarSuggestion = (original: string, suggestion: string) => {
    const newContent = content.replace(original, suggestion);
    setContent(newContent);
    
    // Remove the applied suggestion
    setGrammarSuggestions(prev => prev.filter(item => item.original !== original));
    
    // Show success message
    setMessage({ text: 'Suggestion applied', type: 'success' });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 2000);
  };

  // Format time for last saved
  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    
    return lastSaved.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {sessionError 
              ? "Session expired. Redirecting to login..." 
              : "Loading document..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 mr-4">
              <FaArrowLeft />
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              placeholder="Untitled Document"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 hidden md:flex items-center space-x-4 mr-4">
              <div className="flex items-center">
                <FaFont className="mr-1" /> {stats.words} words
              </div>
              <div className="flex items-center">
                <FaClock className="mr-1" /> {stats.readingTime} min read
              </div>
              <div>
                Last saved: {formatLastSaved()}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`text-xs px-2 py-1 rounded ${
                  autoSaveEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {autoSaveEnabled ? 'Auto-save on' : 'Auto-save off'}
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" /> Save
                  </>
                )}
              </button>
              
              <button
                onClick={handleGrammarCheck}
                disabled={checkingGrammar || !content.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                {checkingGrammar ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <FaMagic className="mr-2" /> Check Grammar
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                className="text-gray-600 hover:text-gray-900 p-2"
                title="Keyboard shortcuts"
              >
                <FaKeyboard />
              </button>
            </div>
          </div>
        </div>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 min-h-[60vh] relative">
          <textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-full min-h-[60vh] resize-none border-none focus:outline-none focus:ring-0"
            placeholder="Start writing here..."
          />
          
          {showKeyboardShortcuts && (
            <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-4 border z-10 w-64">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Keyboard Shortcuts</h3>
                <button 
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Save</span>
                  <span className="font-mono bg-gray-100 px-1 rounded">Ctrl+S</span>
                </div>
                <div className="flex justify-between">
                  <span>Check Grammar</span>
                  <span className="font-mono bg-gray-100 px-1 rounded">Ctrl+G</span>
                </div>
                <div className="flex justify-between">
                  <span>Show Shortcuts</span>
                  <span className="font-mono bg-gray-100 px-1 rounded">Ctrl+K</span>
                </div>
                <div className="flex justify-between">
                  <span>Close Popups</span>
                  <span className="font-mono bg-gray-100 px-1 rounded">Esc</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-500 md:hidden mb-4">
          <div className="flex justify-between">
            <div>{stats.words} words</div>
            <div>{stats.chars} characters</div>
            <div>{stats.readingTime} min read</div>
          </div>
        </div>
        
        {grammarSuggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Grammar Suggestions</h2>
              <button 
                onClick={() => setGrammarSuggestions([])}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              {grammarSuggestions.map((suggestion, index) => (
                <div key={index} className="border-b pb-3">
                  <p className="text-red-500 line-through mb-1">{suggestion.original}</p>
                  <p className="text-green-600 font-medium mb-1">{suggestion.suggestion}</p>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.reason}</p>
                  <button
                    onClick={() => applyGrammarSuggestion(suggestion.original, suggestion.suggestion)}
                    className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded hover:bg-green-100"
                  >
                    <FaCheck className="inline mr-1" /> Apply Suggestion
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 