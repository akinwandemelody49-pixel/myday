import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { auth } from '../../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ForgotPasswordViewProps {
  onNavigate: (path: string) => void;
  showNotification: (message: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onNavigate,
  showNotification,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSubmitted(true);
      showNotification('Password reset email sent successfully!');
    } catch (err: any) {
      console.error('Password reset error', err);
      let errorMsg = 'Failed to send recovery email. Please check the email address.';
      if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email address.';
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="forgot-password-page-container" className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
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
            Reset password
          </h2>
          <p className="text-sm text-neutral-500 font-light">
            We will help you regain secure access to your celebration plans.
          </p>
        </div>

        {/* Form or Confirmation Card */}
        <Card id="forgot-password-card" className="border-neutral-100 shadow-xl shadow-neutral-100/50 bg-white p-2">
          <CardBody className="p-8 space-y-6">
            
            {!isSubmitted ? (
              <div className="space-y-6">
                
                {/* Error Banner */}
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

                <form id="forgot-password-form" onSubmit={handleResetPassword} className="space-y-5">
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

                  {/* Submit Button */}
                  <Button
                    id="send-reset-link-button"
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md shadow-[#6C4CF1]/15"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Send Reset Link
                  </Button>
                </form>

                {/* Back to Login Action */}
                <div className="text-center pt-2">
                  <button
                    id="back-to-login-button"
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="inline-flex items-center space-x-2 text-xs font-bold text-neutral-500 hover:text-[#6C4CF1] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>

              </div>
            ) : (
              /* Success Confirmation Message */
              <motion.div 
                id="forgot-password-success-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-4"
              >
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-xs">
                  <CheckCircle className="w-7 h-7" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-lg text-neutral-900">Reset email sent!</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed font-light max-w-xs mx-auto">
                    We've dispatched password recovery instructions to <strong className="font-semibold text-neutral-800">{email}</strong>. Please check your inbox and spam folder.
                  </p>
                </div>

                <Button
                  id="go-back-login-success"
                  onClick={() => onNavigate('/login')}
                  variant="secondary"
                  className="w-full border-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-xs py-3.5 rounded-full hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  Return to Sign In
                </Button>
              </motion.div>
            )}

          </CardBody>
        </Card>
      </div>
    </div>
  );
};
