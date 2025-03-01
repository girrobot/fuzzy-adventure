"use client";

import { useState, useEffect } from 'react';

type AuthMode = 'signin' | 'signup';

// Create a global state
let globalIsOpen = false;
let globalMode: AuthMode = 'signin';
const listeners = new Set<() => void>();

// Functions to update the global state
const openModal = (mode: AuthMode) => {
  globalMode = mode;
  globalIsOpen = true;
  notifyListeners();
};

const closeModal = () => {
  globalIsOpen = false;
  notifyListeners();
};

// Notify all listeners when state changes
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Custom hook to access the global state
export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(globalIsOpen);
  const [mode, setMode] = useState(globalMode);

  useEffect(() => {
    // Update local state when global state changes
    const handleChange = () => {
      setIsOpen(globalIsOpen);
      setMode(globalMode);
    };
    
    // Add listener
    listeners.add(handleChange);
    
    // Clean up
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return {
    isOpen,
    mode,
    openModal,
    closeModal
  };
}