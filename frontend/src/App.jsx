/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { CheckCircle2 } from 'lucide-react';

// Component Imports
import SplashView from './components/SplashView';
import OnboardingLayout from './components/OnboardingLayout';
import NumberInputView from './components/NumberInputView';
import OtpInputView from './components/OtpInputView';
import DashboardPortal from './components/DashboardPortal';
import AdminDashboardPortal from './components/AdminDashboardPortal';
import NameInputView from './components/NameInputView';

// API Services
import { authService, userService } from './services/api';

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token);
    if (requiredRole && decoded.role !== requiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  const [phone, setPhone] = useState('');
  const [alertBanner, setAlertBanner] = useState(null);
  const navigate = useNavigate();

  const showToastSuccess = (text) => {
    setAlertBanner(text);
    setTimeout(() => setAlertBanner(null), 4500);
  };

  const handleAuthSuccess = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);

    // Simple routing to avoid logical loops
    if (decoded.role === 'admin') {
      navigate('/admin');
    } else {
      // 🚦 THE TRAFFIC COP: Inspect the token payload for a valid name
      if (!decoded.name || decoded.name === 'Anonymous' || decoded.name === 'null') {
        // Name is missing or default -> Pause login flow and ask for name!
        navigate('/setup-profile');
      } else {
        // Name exists -> Direct navigation to dashboard
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="w-full relative min-h-screen bg-[#88aba8]" id="app-root-container">
      <Routes>
        <Route path="/" element={<SplashView onStart={() => navigate('/signup')} />} />

        {/* --- SIGN UP FLOW --- */}
        <Route path="/signup" element={
          <OnboardingLayout id="signup-number-container">
            <NumberInputView
              title="Sign up"
              subtitle="Enter your mobile number!"
              buttonText="Verify"
              initialValue={phone}
              onSubmit={async (number) => {
                try {
                  setPhone(number);
                  // NEW USERS MUST HIT REGISTER FIRST
                  await authService.register(number);
                  navigate('/signup-verify');
                } catch (error) {
                  console.error("Signup Error:", error);
                  alert(error.response?.data?.detail || "Failed to connect to the server.");
                }
              }}
              footerLinkText="Do you have an account?"
              footerActionText="Login"
              onFooterClick={() => navigate('/login')}
            />
          </OnboardingLayout>
        } />

        <Route path="/signup-verify" element={
          <OnboardingLayout id="signup-otp-container">
            <OtpInputView
              title="Sign up"
              subtitle="We sent a code to your mobile number!"
              buttonText="Register"
              resendPrompt="Didn't receive a code?"
              resendActionText="Resend"
              initialTimer={60} // Standard signup forces them to wait 60s
              onSubmit={async (code) => {
                const response = await authService.verifyOTP(phone, code);
                handleAuthSuccess(response.data.access_token);
              }}
              onResend={async () => {
                await authService.requestOTP(phone);
                showToastSuccess("A new verification code was sent to your phone.");
              }}
            />
          </OnboardingLayout>
        } />

        {/* --- LOGIN FLOW --- */}
        <Route path="/login" element={
          <OnboardingLayout id="signin-container">
            {alertBanner && (
              <div className="flex items-center gap-2.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 p-3.5 rounded-xl text-xs mb-5 font-medium shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{alertBanner}</span>
              </div>
            )}
            <NumberInputView
              title="Welcome Back"
              subtitle="Enter your mobile number to sign in!"
              buttonText="Login"
              initialValue={phone}
              onSubmit={async (number) => {
                try {
                  setPhone(number);
                  // RETURNING USERS HIT REQUEST-OTP
                  await authService.requestOTP(number);
                  navigate('/login-verify');
                } catch (error) {
                  if (error.response && error.response.status === 404) {
                    alert("This number is not registered. Please sign up first!");
                  } else {
                    console.error("Login Error:", error);
                    alert("Failed to connect to the server.");
                  }
                }
              }}
              footerLinkText="Don't have an account?"
              footerActionText="Sign up"
              onFooterClick={() => navigate('/signup')}
            />
          </OnboardingLayout>
        } />

        <Route path="/login-verify" element={
          <OnboardingLayout id="login-otp-container">
            <OtpInputView
              title="Verify Login"
              subtitle="We sent a secure login code to your phone!"
              buttonText="Enter Dashboard"
              resendPrompt="Forgot your passcode?"
              resendActionText="Recover"
              initialTimer={0} // 🟢 Starts at 0 so "Recover" can be pushed instantly!
              onSubmit={async (code) => {
                const response = await authService.verifyOTP(phone, code);
                handleAuthSuccess(response.data.access_token);
              }}
              onResend={async () => {
                // 🟢 FIX: Calls resendCode endpoint rather than requestOTP
                await authService.resendCode(phone); 
                showToastSuccess("A new recovery passcode was sent.");
              }}
            />
          </OnboardingLayout>
        } />

        {/* --- PROFILE SETUP FLOW --- */}
        <Route path="/setup-profile" element={
          <ProtectedRoute>
            <OnboardingLayout id="setup-profile-container">
              <NameInputView 
                onSubmit={async (name) => {
                  try {
                    await userService.updateProfile(name);
                    // Name is saved, safely navigate them into the dashboard!
                    navigate('/dashboard');
                    showToastSuccess(`Welcome to the community, ${name}!`);
                  } catch (error) {
                    console.error("Profile Setup Error:", error);
                    alert("Failed to save profile. Please try again.");
                  }
                }}
              />
            </OnboardingLayout>
          </ProtectedRoute>
        } />

        {/* --- PROTECTED DASHBOARDS --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPortal 
              initialPhoneNumber={phone} 
              onLogout={() => {
                localStorage.removeItem('token');
                setPhone('');
                navigate('/login');
              }}
            />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardPortal 
              onLogout={() => {
                localStorage.removeItem('token');
                setPhone('');
                navigate('/login');
              }}
            />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}