import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      // Send token to Chrome extension if present
      if (session?.access_token) {
        sendTokenToExtension(session.access_token);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Send token to Chrome extension if present
      if (session?.access_token) {
        sendTokenToExtension(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendTokenToExtension = async (token) => {
    try {
      // Store token in localStorage for extension setup page
      localStorage.setItem('textgrow_auth_token', token);
      console.log('Token stored in localStorage for extension access');
      
      // Also try direct extension communication if available
      if (window.chrome && window.chrome.runtime) {
        // Get the extension ID from manifest
        const extensionId = chrome.runtime.id;
        
        // Try to send message to extension
        chrome.runtime.sendMessage(extensionId, {
          type: 'save-user-token',
          token: token
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Direct extension communication failed:', chrome.runtime.lastError.message);
          } else {
            console.log('Token sent to extension successfully:', response);
          }
        });
      }
    } catch (error) {
      console.log('Extension communication error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route 
            path="/auth" 
            element={session ? <Navigate to="/" replace /> : <Auth />} 
          />
          <Route 
            path="/" 
            element={session ? <Dashboard session={session} /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/dashboard/*" 
            element={session ? <Dashboard session={session} /> : <Navigate to="/auth" replace />} 
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;