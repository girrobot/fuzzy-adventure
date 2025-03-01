"use client";

import React, { ReactElement } from 'react';
import Navbar from '../components/Navbar';
import SignIn from '../components/SignIn';
import '../styles/globals.css';

interface LayoutProps {
  children: ReactElement;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <SignIn />
        <main>{children}</main>
        {/* Add a Footer component here if needed */}
      </body>
    </html>
  );
}