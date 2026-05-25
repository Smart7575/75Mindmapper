import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import { LogIn, UserPlus, Sparkles, Mail, Lock, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';
import { useLanguage } from '../../lib/i18n';

interface Props {
  onAuthSuccess: () => void;
}

const AuthScreen: React.FC<Props> = ({ onAuthSuccess }) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if we are running in an iframe (e.g. AI Studio preview pane)
  const [isInIframe] = useState(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  });

  const getTranslatedErrorMessage = (err: AuthError): string => {
    switch (err.code) {
      case 'auth/invalid-email':
        return t('auth_invalid_email');
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return t('auth_user_not_found');
      case 'auth/wrong-password':
        return t('auth_wrong_password');
      case 'auth/email-already-in-use':
        return t('auth_email_in_use');
      case 'auth/weak-password':
        return t('auth_weak_password');
      case 'auth/popup-closed-by-user':
        return language === 'nl' 
          ? 'Het Google-inlogvenster is gesloten voordat de login was voltooid.'
          : 'The Google login popup was closed before completion.';
      case 'auth/network-request-failed':
        return language === 'nl'
          ? 'Netwerkverbinding met Firebase is mislukt. Gebruikt u een adblocker of Brave Shields? Schakel deze uit, of open de app in een nieuw tabblad.'
          : 'Network connection to Firebase failed. For some browsers: check if adblockers are active, or open in a new tab.';
      default:
        return err.message || t('auth_generic_error');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(language === 'nl' ? 'Vul alle verplichte velden in.' : 'Please fill in all required fields.');
      return;
    }

    if (activeTab === 'signup' && password !== confirmPassword) {
      setError(language === 'nl' ? 'Wachtwoorden komen niet overeen.' : 'Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(getTranslatedErrorMessage(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setError(null);
    setLoading(true);
    
    // Call signInWithPopup synchronously inside user interaction
    // to bypass strict iPad Safari popup blocking policies.
    signInWithPopup(auth, googleProvider)
      .then(() => {
        onAuthSuccess();
      })
      .catch((err: any) => {
        setError(getTranslatedErrorMessage(err as AuthError));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-radial from-slate-100 to-slate-200/50 p-6 relative overflow-hidden">
      {/* Absolute decorative gradient orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-400/20 blur-3xl pointer-events-none" />

      {/* Language Selector floating above the card */}
      <div className="z-20 mb-4 flex gap-1.5 p-1 bg-white border border-slate-100/50 rounded-2xl shadow-md">
        <button
          onClick={() => setLanguage('nl')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            language === 'nl'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          🇳🇱 Nederlands
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            language === 'en'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          🇺🇸 English
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[480px] bg-white rounded-[2rem] border border-slate-100 shadow-[0_32px_96px_-16px_rgba(15,23,42,0.12)] p-10 z-10 flex flex-col"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 mb-4">
            <Sparkles size={32} className="text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">MindMapper Studio</h2>
          <p className="text-slate-500 text-sm mt-3 font-semibold leading-relaxed">
            {t('slogan')}
          </p>
        </div>

        {/* Elegant warning for iPad and Safari users inside the iframe preview */}
        {isInIframe && (
          <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-800 leading-relaxed font-semibold flex flex-col gap-3">
            <div className="flex gap-2 items-start">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm mb-1">{t('login_warning_title')}</p>
                {t('login_warning_desc')}
              </div>
            </div>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-center font-bold text-xs shadow-md transition-all cursor-pointer select-none"
            >
              <ExternalLink size={14} />
              {t('login_warning_btn')}
            </a>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 relative">
          <button
            onClick={() => {
              setActiveTab('signin');
              setError(null);
            }}
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors relative z-10 ${
              activeTab === 'signin' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LogIn size={14} />
            {t('tab_login')}
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setError(null);
            }}
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors relative z-10 ${
              activeTab === 'signup' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus size={14} />
            {t('tab_register')}
          </button>
          {/* Rounded slider block */}
          <motion.div
            className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-sm border border-slate-200/50"
            layoutId="activeAuthTab"
            style={{ width: 'calc(50% - 6px)' }}
            animate={{ x: activeTab === 'signin' ? 0 : '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        </div>

        {/* Form area */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t('field_email')}</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
              <input
                type="email"
                required
                placeholder="uwnaam@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-600/30 font-bold text-slate-700 transition-all text-sm placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1.5 mb-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t('field_password')}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-600/30 font-bold text-slate-700 transition-all text-sm placeholder:text-slate-300"
              />
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {activeTab === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                  {language === 'nl' ? 'Wachtwoord Bevestigen' : 'Confirm Password'}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-600/30 font-bold text-slate-700 transition-all text-sm placeholder:text-slate-300"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 mt-6"
          >
            {loading ? t('loading') : activeTab === 'signin' ? t('btn_email_login') : t('btn_email_register')}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-slate-100" />
          <span className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {language === 'nl' ? 'Of log in via de cloud' : 'Or log in via cloud'}
          </span>
          <div className="flex-1 h-[1px] bg-slate-100" />
        </div>

        {/* Google signin */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 border-2 border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all text-slate-700 font-bold text-sm active:scale-[0.98] disabled:opacity-50"
        >
          {/* Colorful Google Icon shape */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22l.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          {t('btn_google_login')}
        </button>

        {/* Error reporting container */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 flex items-start gap-2.5 bg-red-50 text-red-650 border border-red-100 p-3.5 rounded-xl text-xs font-semibold leading-relaxed"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1 select-none">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
