import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { auth } from '../../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { User } from '../../types';
import { saveStoredUser } from '../../services/auth';

interface SignupViewProps {
  onNavigate: (path: string) => void;
  onSuccess: (user: User) => void;
  showNotification: (message: string) => void;
}

export const SignupView: React.FC<SignupViewProps> = ({
  onNavigate,
  onSuccess,
  showNotification,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase user profile with name
      await updateProfile(firebaseUser, {
        displayName: fullName
      });

      const loggedUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: fullName,
        photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
      };

      saveStoredUser(loggedUser);
      onSuccess(loggedUser);
      showNotification(`Account created successfully! Welcome, ${fullName}!`);
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error('Sign up error', err);
      let errorMsg = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email address is already in use by another account.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password must be at least 6 characters long.';
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
        photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
      };

      saveStoredUser(loggedUser);
      onSuccess(loggedUser);
      showNotification('Welcome to MyDay via Google!');
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error('Google sign up error', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google authentication failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div id="signup-page-container" className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
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
            Create an account
          </h2>
          <p className="text-sm text-neutral-500 font-light">
            Design, personalize, and orchestrate birthdays in minutes.
          </p>
        </div>

        {/* Signup Form Card */}
        <Card id="signup-card" className="border-neutral-100 shadow-xl shadow-neutral-100/50 bg-white p-2">
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

            <form id="signup-form" onSubmit={handleSignUp} className="space-y-4">
              
              {/* Full Name Field */}
              <div className="space-y-1.5">
                <label htmlFor="fullname-input" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                    <UserIcon className="w-4.5 h-4.5" />
                  </span>
                  <input
                    id="fullname-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200/80 focus:border-[#6C4CF1] rounded-2xl text-sm transition-all focus:ring-1 focus:ring-[#6C4CF1] focus:outline-none placeholder-neutral-400 font-sans"
                  />
                </div>
              </div>

              {/* Email Address Field */}
              <div className="space-y-1.5">
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
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200/80 focus:border-[#6C4CF1] rounded-2xl text-sm transition-all focus:ring-1 focus:ring-[#6C4CF1] focus:outline-none placeholder-neutral-400 font-sans"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="password-input" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Password
                </label>
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
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200/80 focus:border-[#6C4CF1] rounded-2xl text-sm transition-all focus:ring-1 focus:ring-[#6C4CF1] focus:outline-none placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password-input" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    id="confirm-password-input"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200/80 focus:border-[#6C4CF1] rounded-2xl text-sm transition-all focus:ring-1 focus:ring-[#6C4CF1] focus:outline-none placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                id="signup-button"
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white py-3.5 mt-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md shadow-[#6C4CF1]/15"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Create Account
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">or</span>
              <div className="flex-grow border-t border-neutral-100"></div>
            </div>

            {/* Google Signup Button */}
            <button
              id="google-signup-button"
              type="button"
              onClick={handleGoogleSignUp}
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

            {/* Link to Login */}
            <div className="text-center pt-2">
              <p className="text-xs text-neutral-500 font-light">
                Already have an account?{' '}
                <button
                  id="login-link"
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="font-bold text-[#6C4CF1] hover:text-[#5B3ED6] transition-colors ml-1"
                >
                  Sign In
                </button>
              </p>
            </div>

          </CardBody>
        </Card>
      </div>
    </div>
  );
};
