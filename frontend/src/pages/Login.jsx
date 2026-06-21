import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Scissors, Phone, Lock, User, Mail, ChevronRight, Languages, AlertCircle, CheckCircle, Eye, EyeOff, Store, MapPin, Globe, ChevronDown, Check, Sparkles, Ruler, ShoppingBag, Bell, MessageSquare } from 'lucide-react';

export default function Login({ initialMode = 'login', onNavigate }) {
  const { login, registerUser, forgotPassword, resetPassword } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot', 'reset'
  const [defaultLang, setDefaultLang] = useState(language);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const langOptions = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'हिंदी (Hindi)', short: 'हिन्दी' },
    { code: 'te', label: 'తెలుగు (Telugu)', short: 'తెలుగు' }
  ];
  
  // Forgot / Reset Password States
  const [resetPhone, setResetPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  
  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLangChange = (lang) => {
    setDefaultLang(lang);
    changeLanguage(lang);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!name || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(name, password, 'tailor');
      if (userData.role === 'tailor') {
        onNavigate('tailor_dashboard');
      } else {
        // Fallback (should not happen for tailor-only login page)
        onNavigate('home');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!name || !shopName || !phone || !address || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Phone number must contain at least 10 digits');
      return;
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      console.log("Calling registerUser from form...");
      const userData = await registerUser(
        name,
        phone,
        email || null,
        password,
        'tailor',
        defaultLang,
        shopName,
        address,
        true // Enable auto-login
      );
      console.log("registerUser resolved in form, user data:", userData);
      localStorage.setItem('just_registered', 'true');
      if (userData && userData.role === 'tailor') {
        console.log("Navigating to tailor_dashboard");
        onNavigate('tailor_dashboard');
      } else {
        console.log("Navigating to home");
        onNavigate('home');
      }
    } catch (err) {
      console.error("handleRegister catch:", err);
      alert("handleRegister failed: " + err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(phone);
      setResetPhone(phone);
      if (res.debug_code) {
        setSimulatedCode(res.debug_code);
        setSuccessMsg(`Reset code simulated successfully!`);
      } else {
        setSuccessMsg(res.message || 'If registered, you will receive a reset code.');
      }
      setMode('reset');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!resetCode || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetPhone, resetCode, password);
      setSuccessMsg('Password reset successfully! Please log in with your new password.');
      setMode('login');
      // Clear password states
      setPassword('');
      setConfirmPassword('');
      setResetCode('');
      setSimulatedCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden font-sans animate-fade-in light-landing-bg">
      
      {/* Animated ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full glow-spot-purple -z-10 animate-blob-1 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full glow-spot-blue -z-10 animate-blob-2 pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/3 w-80 h-80 rounded-full glow-spot-pink -z-10 animate-blob-3 pointer-events-none"></div>

      {/* Curvy Dotted SVG Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-45" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M 300,-50 Q 500,200 480,400 T 650,750" 
          fill="none" 
          stroke="#7C3AED" 
          strokeWidth="2" 
          strokeDasharray="6,6" 
          className="animate-slow-dash"
        />
        <path 
          d="M -100,200 Q 150,50 300,450 T 700,750" 
          fill="none" 
          stroke="#EC4899" 
          strokeWidth="1.5" 
          strokeDasharray="4,6" 
          className="animate-slow-dash opacity-30"
        />
      </svg>

      {/* Floating elements */}
      <div className="absolute top-[10%] left-[10%] text-purple-300 pointer-events-none animate-floating z-0">
        <Sparkles className="w-12 h-12 opacity-40" />
      </div>
      <div className="absolute bottom-[10%] right-[10%] text-pink-300 pointer-events-none animate-floating z-0" style={{ animationDelay: '2s' }}>
        <Sparkles className="w-8 h-8 opacity-30" />
      </div>
      <div className="absolute top-[40%] right-[20%] text-purple-300 pointer-events-none animate-floating z-0" style={{ animationDelay: '4s' }}>
        <Sparkles className="w-6 h-6 opacity-25" />
      </div>
      
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center space-x-2 bg-white/60 hover:bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-xs md:text-sm font-bold text-slate-700 transition cursor-pointer select-none"
        >
          <Globe className="w-4 h-4 text-purple-600" />
          <span>
            {language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'తెలుగు'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isLangOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)}></div>
            <div className="absolute right-0 mt-2.5 w-48 rounded-2xl bg-white border border-slate-100 shadow-2xl p-1.5 z-50 overflow-hidden">
              {langOptions.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => {
                    handleLangChange(opt.code);
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs md:text-sm font-semibold transition cursor-pointer flex justify-between items-center ${
                    language === opt.code 
                      ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100/50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span>{opt.label}</span>
                  {language === opt.code && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Left Column: Branding & Info (hidden on mobile, taking up 50% width on desktop/tablet) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-6 md:p-8 relative overflow-hidden border-r border-slate-200/30 select-none z-10">
        
        {/* Top Header Logo */}
        <div className="flex items-center space-x-3.5 cursor-pointer group z-10 self-start" onClick={() => onNavigate('home')}>
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform duration-300">
            <Scissors className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="text-left">
            <span className="font-heading text-xl md:text-2xl font-black tracking-tight text-slate-905 flex items-center">
              VastraSilai
              <span className="text-purple-600 ml-0.5 text-xs font-bold font-sans">⁺</span>
            </span>
            <span className="block text-[10px] md:text-[11px] font-extrabold tracking-widest text-purple-600 uppercase leading-none mt-1">
              TAILOR PORTAL
            </span>
          </div>
        </div>

        {/* Copywriting & Hero image wrapper - sized to be balanced */}
        <div className="flex-grow flex flex-col justify-center items-center text-center space-y-6 py-4 z-10 max-w-lg mx-auto w-full">
          <div className="space-y-3.5">
            <h1 className="font-heading text-3xl sm:text-4xl md:text-4xl font-black tracking-tight text-slate-900 leading-[1.06]">
              {t('heroTitle')}<br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">{t('heroTitleAccent')}</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto font-sans font-medium">
              {t('enterTailorDesc')}
            </p>
          </div>

          {/* Hero Tailor Workshop Image Framed in a Premium Glass Card with Floating Animation */}
          <div className="relative max-w-[220px] sm:max-w-[240px] md:max-w-[260px] w-full select-none drop-shadow-[0_20px_40px_rgba(124,58,237,0.08)] self-center group animate-floating">
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-[2rem] opacity-20 blur-lg group-hover:opacity-35 transition duration-500 pointer-events-none"></div>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 p-3.5 backdrop-blur-md transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(124,58,237,0.12)] hover:border-purple-500/20">
              <img 
                src="/tailor_workshop.png" 
                alt="Digital Tailor Workspace" 
                className="w-full h-auto object-contain rounded-[1.5rem] transform group-hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        {/* Redesigned Footer Features Bar with Premium light glass card structure */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200/50 pt-6 z-10 w-full max-w-lg mx-auto">
          {/* Feature 1 */}
          <div className="light-glass-card p-3 rounded-2xl flex items-center space-x-3 text-left transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg group cursor-pointer border border-white/60">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(124,58,237,0.3)]">
              <Ruler className="w-5 h-5" />
            </div>
            <div className="text-left leading-tight">
              <h5 className="text-slate-900 font-extrabold text-xs transition-colors duration-200 group-hover:text-purple-700">{t('feature1Title')}</h5>
              <p className="text-slate-400 text-[9px] sm:text-[10px] mt-0.5">{t('smartMeasurementsSub')}</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="light-glass-card p-3 rounded-2xl flex items-center space-x-3 text-left transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg group cursor-pointer border border-white/60">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="text-left leading-tight">
              <h5 className="text-slate-900 font-extrabold text-xs transition-colors duration-200 group-hover:text-indigo-700">{t('feature2Title')}</h5>
              <p className="text-slate-400 text-[9px] sm:text-[10px] mt-0.5">{t('orderManagementSub')}</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="light-glass-card p-3 rounded-2xl flex items-center space-x-3 text-left transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg group cursor-pointer border border-white/60">
            <div className="w-10 h-10 bg-pink-500/10 border border-pink-500/20 text-pink-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-pink-600/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(236,72,153,0.3)]">
              <MessageSquare className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div className="text-left leading-tight">
              <h5 className="text-slate-900 font-extrabold text-xs transition-colors duration-200 group-hover:text-pink-700">{t('feature3Title')}</h5>
              <p className="text-slate-400 text-[9px] sm:text-[10px] mt-0.5">{t('smartNotificationsSub')}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Portal Login forms */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 relative min-h-screen z-10">
        
        {/* Mobile Brand Header */}
        <div className="md:hidden flex items-center space-x-3 cursor-pointer group mb-6 mt-2 self-start w-full pr-32" onClick={() => onNavigate('home')}>
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-600/20 shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="font-heading text-lg font-black tracking-tight text-slate-905 leading-none">
              VastraSilai
            </h2>
            <span className="inline-block text-[9px] font-extrabold text-purple-600 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full mt-1.5 leading-none">
              Tailor Portal
            </span>
          </div>
        </div>

        {/* Redesigned Frosted Card container with softer borders and premium gradients */}
        <div className="auth-card">
          
          <div className="mb-5 text-center sm:text-left">
            <h3 className="text-slate-950 text-2xl font-black tracking-tight leading-tight">
              {mode === 'login' ? 'Tailor Login' : 
               mode === 'register' ? 'Tailor Registration' : 
               mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed font-medium">
              {mode === 'login' ? 'Sign in to access your digital workspace' : 
               mode === 'register' ? 'Create an account to digitize your tailoring shop' : 
               mode === 'forgot' ? 'Enter your registered phone number to receive a reset code' : 
               'Enter the reset code and choose a new password'}
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Tailor Name or Phone
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    key="login-username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input pl-9 sm:pl-10"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Password
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    key="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input pl-9 sm:pl-10 pr-9"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-purple-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => { setError(''); setSuccessMsg(''); setMode('forgot'); }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-bold transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn mt-2"
              >
                <span>{loading ? t('loading') : t('loginBtn')}</span>
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            </form>
          )}

          {/* Registration Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Tailor Name *
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    key="register-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input pl-9 sm:pl-10"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Shop Name *
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="w-4 h-4" />
                  </span>
                  <input
                    key="register-shopname"
                    type="text"
                    name="shopName"
                    autoComplete="off"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="auth-input pl-9 sm:pl-10"
                    placeholder="Enter shop name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Phone Number *
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    key="register-phone"
                    type="text"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="auth-input pl-9 sm:pl-10"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Email Address (Optional)
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    key="register-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input pl-9 sm:pl-10"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Address *
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    key="register-address"
                    type="text"
                    name="address"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="auth-input pl-9 sm:pl-10"
                    placeholder="Enter shop address"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="auth-label">Password *</label>
                  <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                    <input
                      key="register-password"
                      type={showPassword ? "text" : "password"}
                      name="new-password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input pl-3 pr-9"
                      placeholder="••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-purple-600"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="auth-label">Confirm *</label>
                  <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                    <input
                      key="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm-password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="auth-input pl-3 pr-9"
                      placeholder="••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-purple-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn mt-3"
              >
                <span>{loading ? t('loading') : t('registerBtn')}</span>
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Phone Number
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    key="forgot-phone"
                    type="text"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="auth-input pl-9 sm:pl-10"
                    placeholder="Enter registered phone number"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn mt-2"
              >
                <span>{loading ? t('loading') : 'Send Reset Code'}</span>
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              {simulatedCode && (
                <div className="p-3 bg-purple-600/10 border border-purple-500/20 text-purple-855 text-xs rounded-xl flex flex-col space-y-0.5 font-bold">
                   <span>Simulated SMS Reset Code:</span>
                   <span className="text-purple-950 text-sm font-mono tracking-widest">{simulatedCode}</span>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Reset Code
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    key="reset-code"
                    type="text"
                    name="code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="auth-input pl-9 sm:pl-10 font-mono uppercase tracking-widest"
                    placeholder="VS-XXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="auth-label">
                  New Password
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    key="reset-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input pl-9 sm:pl-10 pr-9"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-purple-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="auth-label">
                  Confirm Password
                </label>
                <div className="relative focus-within:text-purple-600 text-slate-400 transition-colors duration-200">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    key="reset-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="auth-input pl-9 sm:pl-10 pr-9"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-purple-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn mt-3"
              >
                <span>{loading ? t('loading') : 'Reset Password'}</span>
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            </form>
          )}

          {/* Toggle register/login links */}
          <div className="mt-4 pt-4 border-t border-slate-200/60 text-center">
            {mode === 'login' ? (
              <button
                onClick={() => { setError(''); setSuccessMsg(''); setMode('register'); }}
                className="text-sm text-slate-600 hover:text-purple-600 font-semibold transition cursor-pointer"
              >
                Don't have an account? Register here
              </button>
            ) : (
              <button
                onClick={() => { 
                  setError(''); 
                  setSuccessMsg(''); 
                  setMode('login'); 
                  setPassword(''); 
                  setConfirmPassword(''); 
                  setResetCode(''); 
                  setSimulatedCode('');
                }}
                className="text-sm text-slate-600 hover:text-purple-600 font-semibold transition cursor-pointer"
              >
                Already have an account? Login here
              </button>
            )}
          </div>

          {/* Back to Home link */}
          <div className="mt-3 text-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-purple-600 hover:text-purple-700 font-bold uppercase tracking-wider transition cursor-pointer"
            >
              ← Back to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
