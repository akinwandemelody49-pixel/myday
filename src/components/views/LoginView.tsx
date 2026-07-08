import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Sparkles, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { auth } from '../../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { User } from '../../types';
import { saveStoredUser } from '../../services/auth';
import { logSystemActivity } from '../../services/db_services';

interface LoginViewProps {
  onNavigate: (path: string) => void;
  onSuccess: (user: User) => void;
  showNotification: (message: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onNavigate,
  onSuccess,
  showNotification,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const loggedUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=100',
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
      };

      saveStoredUser(loggedUser);
      onSuccess(loggedUser);
      
      // Log successful login
      try {
        await logSystemActivity({
          type: 'login',
          userEmail: loggedUser.email || '',
          userName: loggedUser.displayName || 'Anonymous',
          details: `User logged in successfully via Email Authentication`,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      } catch (logErr) {
        console.error('Failed to write login log', logErr);
      }

      showNotification('Successfully signed in to MyDay!');
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error('Sign in error', err);
      let errorMsg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      const loggedUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=100',
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
      };

      saveStoredUser(loggedUser);
      onSuccess(loggedUser);

      // Log successful Google login
      try {
        await logSystemActivity({
          type: 'login',
          userEmail: loggedUser.email || '',
          userName: loggedUser.displayName || 'Google User',
          details: `User logged in successfully via Google OAuth Authentication`,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      } catch (logErr) {
        console.error('Failed to write login log', logErr);
      }

      showNotification('Welcome to MyDay via Google!');
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error('Google sign in error', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google authentication failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div id="login-page-container" className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div 
            onClick={() => onNavigate('/')}
            className="inline-flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#6C4CF1] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-12 group-hover:scale-105 shadow-md shadow-[#6C4CF1]/25">
              <div className="w-3 h-3 bg-[#F4B400] rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight text-neutral-900 flex items-center leading-none">
                My<span className="text-[#6C4CF1]">Day</span>
              </h1>
              <p className="text-[8px] font-mono uppercase tracking-[0.25em] text-[#F4B400] mt-1 font-bold">
                AI Birthday Studio
              </p>
            </div>
          </div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight pt-2">
            Welcome back
          </h2>
          <p className="text-sm text-neutral-500 font-light">
            Sign in to access your bespoke celebration workspaces.
          </p>
        </div>

        {/* Login Form Card */}
        <Card id="login-card" className="border-neutral-100 shadow-xl shadow-neutral-100/50 bg-white p-2">
          <CardBody className="p-8 space-y-6">
            
            {/* Error Notification Banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-start space-x-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}

            <form id="login-form" onSubmit={handleSignIn} className="space-y-5">
              
              {/* Email Address Field */}
              <div className="space-y-2">
                <label htmlFor="email-input" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200/80 focus:border-[#6C4CF1] rounded-2xl text-sm transition-all focus:ring-1 focus:ring-[#6C4CF1] focus:outline-none placeholder-neutral-400 font-sans"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password-input" className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Password
                  </label>
                  <button
                    id="forgot-password-link"
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="text-xs font-semibold text-[#6C4CF1] hover:text-[#5B3ED6] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    id="password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200/80 focus:border-[#6C4CF1] rounded-2xl text-sm transition-all focus:ring-1 focus:ring-[#6C4CF1] focus:outline-none placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      id="remember-me-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
                      rememberMe ? 'bg-[#6C4CF1] border-[#6C4CF1]' : 'border-neutral-300 bg-neutral-50'
                    }`}>
                      {rememberMe && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-neutral-500">Remember Me</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                id="sign-in-button"
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md shadow-[#6C4CF1]/15"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-neutral-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">or</span>
              <div className="flex-grow border-t border-neutral-100"></div>
            </div>

            {/* Google Authentication Button */}
            <button
              id="google-signin-button"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center space-x-3 px-6 py-3.5 border border-neutral-200 hover:border-[#6C4CF1] rounded-full text-xs font-bold uppercase tracking-wider text-neutral-700 bg-white hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
            >
              {googleLoading ? (
                <svg className="animate-spin h-4 w-4 text-neutral-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 1.157 15.495 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.839 11.57-11.79 0-.79-.086-1.393-.193-1.925H12.24z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Switch view link */}
            <div className="text-center pt-2">
              <p className="text-xs text-neutral-500 font-light">
                Don't have an account?{' '}
                <button
                  id="signup-link"
                  type="button"
                  onClick={() => onNavigate('/signup')}
                  className="font-bold text-[#6C4CF1] hover:text-[#5B3ED6] transition-colors ml-1"
                >
                  Sign Up
                </button>
              </p>
            </div>

          </CardBody>
        </Card>
      </div>
    </div>
  );
};
