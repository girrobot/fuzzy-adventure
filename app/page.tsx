"use client";

import React from 'react';
import { useAuthModal } from '../lib/hooks/useAuthModal';
import { FaPencilAlt, FaMagic, FaChartLine } from 'react-icons/fa';

export default function HomePage() {
  const { openModal } = useAuthModal();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800 tracking-tight">
            Transform Your Writing with <span className="text-primary">Verbi</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed">
            Your AI-powered writing companion that helps you craft perfect content,
            from emails to essays, with confidence and clarity.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button
              onClick={() => openModal('signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg"
            >
              Get Started Free
            </button>
            <button
              onClick={() => openModal('signin')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg px-8 py-4 rounded-lg"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-primary mb-4">
              <FaPencilAlt size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Smart Writing Assistant
            </h3>
            <p className="text-gray-600">
              Get real-time suggestions to improve clarity, tone, and impact of your writing.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-primary mb-4">
              <FaMagic size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Advanced Grammar Check
            </h3>
            <p className="text-gray-600">
              Catch and fix grammar, spelling, and style issues with AI-powered precision.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-primary mb-4">
              <FaChartLine size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Writing Analytics
            </h3>
            <p className="text-gray-600">
              Track your progress and get insights to improve your writing skills over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
