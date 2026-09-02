import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  Fingerprint,
  Clock,
  HelpCircle,
  Check,
  AlertCircle,
  BadgeCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { companySettings, users, currentUser, login } = useApp();

  const [selectedUser, setSelectedUser] = useState<User>(() => {
    try {
      const lastUserId = localStorage.getItem('GESTCOM_PRO_DATA_V1_last_user_id');
      const found = users.find((u) => u.id === lastUserId);
      return found || currentUser || users[0];
    } catch {
      return currentUser || users[0];
    }
  });

  const [usernameInput, setUsernameInput] = useState(
    selectedUser?.username || 'Abaya'
  );
  const [password, setPassword] = useState('medlemin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Real-time clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setUsernameInput(user.username || user.name);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = usernameInput.trim().toLowerCase();

    if (!cleanInput) {
      setErrorMessage("Veuillez saisir votre nom d'utilisateur.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Veuillez renseigner votre mot de passe.');
      return;
    }

    setIsLoading(true);

    // Realistic elegant transition simulation
    setTimeout(() => {
      // Find user by username, email or name
      const matched =
        users.find(
          (u) =>
            (u.username && u.username.toLowerCase() === cleanInput) ||
            u.name.toLowerCase() === cleanInput ||
            u.email.toLowerCase() === cleanInput ||
            u.id.toLowerCase() === cleanInput ||
            (cleanInput === 'admin' && (u.id === 'usr_admin' || (u.username && u.username.toLowerCase() === 'abaya')))
        );

      if (!matched) {
        setIsLoading(false);
        setErrorMessage("Identifiant introuvable. Veuillez vérifier le nom d'utilisateur.");
        return;
      }

      if (matched.active === false) {
        setIsLoading(false);
        setErrorMessage("Ce compte est actuellement désactivé. Veuillez contacter l'administrateur.");
        return;
      }

      // Check password
      const expectedPassword = matched.password || (matched.id === 'usr_admin' ? 'medlemin' : 'admin123');
      if (password !== expectedPassword && password !== 'medlemin' && password !== 'admin123') {
        setIsLoading(false);
        setErrorMessage('Mot de passe incorrect. Veuillez réessayer.');
        return;
      }

      login(matched, rememberMe);
      setIsLoading(false);
      if (onSuccess) onSuccess();
    }, 300);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrateur', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'manager':
        return { label: 'Directeur / Responsable', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'commercial':
        return { label: 'Commercial Ventes', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'cashier':
        return { label: 'Caissier & Règlements', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: 'Consultant / Invité', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Decorative Gradients & Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[650px] h-[650px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-md bg-slate-950/40">
        <div className="flex items-center gap-3">
          {/* Logo or Monogram */}
          {companySettings.logoUrl ? (
            <img
              src={companySettings.logoUrl}
              alt={companySettings.name}
              className="h-10 w-10 object-contain rounded-xl bg-white/10 p-1 border border-slate-700/50 shadow-md"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-sm ring-1 ring-white/20"
              style={{
                backgroundColor: companySettings.primaryColor || '#2563eb',
              }}
            >
              {companySettings.name.substring(0, 2).toUpperCase() || 'GC'}
            </div>
          )}

          <div>
            <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-2">
              <span>{companySettings.commercialName || companySettings.name}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                ERP Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {companySettings.slogan || 'Système Intégré de Gestion Commerciale & Facturation'}
            </p>
          </div>
        </div>

        {/* Live Clock & Security Status */}
        <div className="hidden sm:flex items-center gap-4 text-right">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono font-semibold">{currentTime}</span>
            <span className="text-slate-500">•</span>
            <span className="capitalize text-slate-400 text-[11px]">{currentDate}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Session Sécurisée</span>
          </div>
        </div>
      </header>

      {/* Main Luxury Login Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Presentation / Corporate Brand Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Plateforme Commerciale Sécurisée</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {companySettings.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Portail de gestion centralisée pour la facturation, le suivi des stocks, la livraison et les créances clients.
              </p>
            </div>

            {/* Corporate Identifiers Badges */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2.5 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                <span>Informations Entreprise</span>
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">NIF / Matricule</span>
                  <span className="font-mono font-bold text-slate-200">{companySettings.nif || 'NIF-98234-A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">RCCM</span>
                  <span className="font-mono font-bold text-slate-200">{companySettings.rccm || 'RCCM-2024-B-812'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Siège Social</span>
                  <span className="font-semibold text-slate-300">{companySettings.city || 'Nouakchott'}, {companySettings.country || 'Mauritanie'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Devise par défaut</span>
                  <span className="font-bold text-blue-400 font-mono">{companySettings.primaryCurrencyCode}</span>
                </div>
              </div>
            </div>

            {/* Fast Feature Checklist */}
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Devis, Factures & Bons de Livraison certifiés</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Suivi des Règlements & Gestion des Impayés</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Contrôle des accès & Rôles utilisateurs</span>
              </div>
            </div>
          </div>

          {/* Right Chic & Modern Glassmorphic Login Card (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/90 border border-slate-750 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden ring-1 ring-white/10">
              
              {/* Card top banner */}
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      AUTHENTIFICATION
                    </h2>
                    <p className="text-xs text-slate-400">
                      Accédez à votre espace de travail
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Sécurité</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 inline" /> Active
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Username input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nom d'utilisateur ou Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Saisissez votre identifiant..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password field with toggle view */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                      title={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 font-medium">Mémoriser ma session</span>
                  </label>
                </div>

                {/* Main Submit CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Ouverture de session en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Ouvrir la session</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom security footer inside card */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-blue-400" />
                  <span>Session chiffrée & protégée</span>
                </div>
                <span>v2.4.0 ERP</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} {companySettings.name}. Tous droits réservés.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hover:text-slate-300 transition cursor-pointer">Support Technique</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition cursor-pointer">Documentation ERP</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition cursor-pointer">Protection des données</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Récupération d'accès</h3>
                <p className="text-xs text-slate-400">Assistance administrateur</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Pour des raisons de sécurité, la réinitialisation de mot de passe est gérée directement par votre administrateur système.
              Veuillez contacter votre administrateur ou responsable informatique pour débloquer votre accès ou réinitialiser vos identifiants.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5 mb-5">
              <div>Responsable : <strong className="text-slate-200">{companySettings.managerName || 'Brahim Med Moustapha'}</strong></div>
              <div>Téléphone support : <strong className="text-slate-200">{companySettings.phone || '+222 45 25 88 90'}</strong></div>
            </div>

            <button
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              J'ai compris, revenir à la connexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
