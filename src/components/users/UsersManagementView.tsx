import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  Shield,
  Check,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, PermissionKey } from '../../types';
import { getUserRoleLabel } from '../../utils/formatters';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=faces',
];

const ALL_PERMISSIONS: { key: PermissionKey; label: string; group: string }[] = [
  { key: 'view_dashboard', label: 'Consulter le Tableau de bord & KPIs', group: 'Général' },
  { key: 'manage_clients', label: 'Gérer les Clients & Contacts', group: 'Ventes' },
  { key: 'manage_quotes', label: 'Créer / Modifier les Devis', group: 'Ventes' },
  { key: 'manage_deliveries', label: 'Créer / Valider Bons de Livraison', group: 'Logistique' },
  { key: 'manage_invoices', label: 'Émettre & Gérer les Factures', group: 'Facturation' },
  { key: 'manage_payments', label: 'Encaisser & Valider les Règlements', group: 'Finance' },
  { key: 'manage_expenses', label: 'Enregistrer les Dépenses & Achats', group: 'Finance' },
  { key: 'manage_products', label: 'Gérer Produits, Services & Stocks', group: 'Catalogue' },
  { key: 'manage_suppliers', label: 'Gérer les Fournisseurs', group: 'Catalogue' },
  { key: 'view_reports', label: 'Voir Rapports Financiers & TVA', group: 'Finance' },
  { key: 'view_audit_log', label: 'Consulter le Journal d\'Audit', group: 'Sécurité' },
  { key: 'manage_users', label: 'Gérer les Utilisateurs & Mots de passe', group: 'Sécurité' },
  { key: 'manage_settings', label: 'Modifier les Paramètres Entreprise', group: 'Système' },
  { key: 'cancel_documents', label: 'Annuler des Factures & Devis validés', group: 'Sécurité' },
  { key: 'delete_records', label: 'Supprimer définitivement des données', group: 'Sécurité' },
  { key: 'export_data', label: 'Exporter données (Excel, PDF, CSV)', group: 'Général' },
];

export const UsersManagementView: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'password' | 'photo'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAvatar, setFormAvatar] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('commercial');
  const [formPhone, setFormPhone] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formPermissions, setFormPermissions] = useState<Record<PermissionKey, boolean>>({} as any);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Password change direct modal
  const [newPasswordOnly, setNewPasswordOnly] = useState('');
  const [confirmPasswordOnly, setConfirmPasswordOnly] = useState('');

  // File input ref for image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const [targetUserForCardPhoto, setTargetUserForCardPhoto] = useState<User | null>(null);

  const getDefaultPermissionsForRole = (role: UserRole): Record<PermissionKey, boolean> => {
    const perms: Record<PermissionKey, boolean> = {
      view_dashboard: true,
      manage_clients: role !== 'cashier',
      manage_suppliers: role === 'admin' || role === 'manager',
      manage_products: role === 'admin' || role === 'manager',
      manage_quotes: role === 'admin' || role === 'manager' || role === 'commercial',
      manage_deliveries: role === 'admin' || role === 'manager' || role === 'commercial',
      manage_invoices: role === 'admin' || role === 'manager' || role === 'commercial',
      manage_payments: role === 'admin' || role === 'manager' || role === 'cashier',
      manage_expenses: role === 'admin' || role === 'manager',
      view_reports: role === 'admin' || role === 'manager',
      manage_settings: role === 'admin',
      manage_users: role === 'admin',
      view_audit_log: role === 'admin' || role === 'manager',
      export_data: true,
      delete_records: role === 'admin',
      cancel_documents: role === 'admin' || role === 'manager',
    };
    return perms;
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormAvatar('');
    setFormRole('commercial');
    setFormPhone('');
    setFormActive(true);
    setFormPermissions(getDefaultPermissionsForRole('commercial'));
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username || user.name.toLowerCase().replace(/\s+/g, ''));
    setFormPassword(user.password || '');
    setFormAvatar(user.avatar || '');
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setFormActive(user.active !== false);
    setFormPermissions({ ...getDefaultPermissionsForRole(user.role), ...(user.permissions || {}) });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenPasswordModal = (user: User) => {
    setModalMode('password');
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username || '');
    setNewPasswordOnly('');
    setConfirmPasswordOnly('');
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenPhotoModal = (user: User) => {
    setModalMode('photo');
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username || '');
    setFormAvatar(user.avatar || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    setFormPermissions(getDefaultPermissionsForRole(role));
  };

  const handleTogglePermission = (key: PermissionKey) => {
    setFormPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Image Upload Handler (Modal)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormAvatar(event.target.result as string);
        setFormError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct card image upload handler
  const handleCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserForCardPhoto) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const photoUrl = event.target.result as string;
        updateUser(targetUserForCardPhoto.id, { avatar: photoUrl });
        setSuccessToast(`Photo de profil de ${targetUserForCardPhoto.name} mise à jour !`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Photo Only Mode
    if (modalMode === 'photo' && editingUserId) {
      updateUser(editingUserId, { avatar: formAvatar });
      setSuccessToast(`Photo de profil de ${formName} mise à jour !`);
      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(null), 3000);
      return;
    }

    // Password only mode
    if (modalMode === 'password' && editingUserId) {
      if (!newPasswordOnly.trim()) {
        setFormError('Veuillez entrer un nouveau mot de passe.');
        return;
      }
      if (newPasswordOnly.length < 4) {
        setFormError('Le mot de passe doit contenir au moins 4 caractères.');
        return;
      }
      if (newPasswordOnly !== confirmPasswordOnly) {
        setFormError('Les deux mots de passe ne correspondent pas.');
        return;
      }

      updateUser(editingUserId, {
        password: newPasswordOnly.trim(),
      });

      setSuccessToast(`Mot de passe de ${formName} mis à jour avec succès !`);
      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(null), 3000);
      return;
    }

    // Create / Edit mode
    if (!formName.trim()) {
      setFormError('Veuillez indiquer le nom complet.');
      return;
    }

    const cleanUsername = formUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      setFormError("Veuillez indiquer un nom d'utilisateur.");
      return;
    }

    // Check duplicate username
    const duplicate = users.find(
      (u) =>
        (u.username || '').toLowerCase() === cleanUsername &&
        u.id !== editingUserId
    );
    if (duplicate) {
      setFormError(`Le nom d'utilisateur "${cleanUsername}" est déjà utilisé.`);
      return;
    }

    if (modalMode === 'create' && !formPassword.trim()) {
      setFormError('Veuillez définir un mot de passe pour ce nouveau compte.');
      return;
    }

    if (modalMode === 'create') {
      addUser({
        name: formName.trim(),
        username: cleanUsername,
        password: formPassword.trim(),
        avatar: formAvatar.trim() || undefined,
        role: formRole,
        phone: formPhone.trim(),
        active: formActive,
        permissions: formPermissions,
      });
      setSuccessToast(`Compte utilisateur "${cleanUsername}" créé avec succès !`);
    } else if (editingUserId) {
      const updateData: Partial<User> = {
        name: formName.trim(),
        username: cleanUsername,
        avatar: formAvatar.trim() || undefined,
        role: formRole,
        phone: formPhone.trim(),
        active: formActive,
        permissions: formPermissions,
      };
      if (formPassword.trim()) {
        updateData.password = formPassword.trim();
      }
      updateUser(editingUserId, updateData);
      setSuccessToast(`Compte "${cleanUsername}" modifié avec succès !`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDelete = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte actuellement connecté.');
      return;
    }
    if (window.confirm(`Confirmez-vous la suppression du compte "${userName}" ?`)) {
      deleteUser(userId);
      setSuccessToast(`Compte "${userName}" supprimé.`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').includes(searchTerm);

    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Hidden file input for card instant photo change */}
      <input
        type="file"
        ref={cardFileInputRef}
        onChange={handleCardImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Gestion des Utilisateurs, Photos & Sécurité
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Créez des comptes, personnalisez les photos de profil, attribuez des rôles et gérez les mots de passe de vos collaborateurs.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouveau Compte</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, nom d'utilisateur (@username) ou téléphone..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tous les rôles ({users.length})</option>
            <option value="admin">Administrateurs</option>
            <option value="manager">Responsables / Directeurs</option>
            <option value="commercial">Commerciaux</option>
            <option value="cashier">Caissiers</option>
            <option value="viewer">Consultants</option>
          </select>
        </div>
      </div>

      {/* Users Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const badge = getUserRoleLabel(u.role);
          const isMe = u.id === currentUser.id;

          return (
            <div
              key={u.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group ${
                isMe
                  ? 'border-blue-500/50 ring-1 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {isMe && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
                  Session en cours
                </div>
              )}

              <div>
                {/* Header Profile with Avatar & Quick Photo Upload */}
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="relative group/avatar shrink-0">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                        {u.name.charAt(0)}
                      </div>
                    )}

                    {/* Camera overlay button on hover */}
                    <button
                      type="button"
                      onClick={() => handleOpenPhotoModal(u)}
                      className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-150 cursor-pointer"
                      title="Changer la photo de profil"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-[9px] font-bold mt-0.5">Photo</span>
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {u.name}
                    </h3>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                      @{u.username || u.name.toLowerCase().replace(/\s+/g, '')}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {u.active !== false ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Actif
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                          Inactif
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Block */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
                  {u.phone && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Téléphone :</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{u.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Mot de passe :</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {u.password ? '••••••••' : '(défini: admin123)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Photo de profil :</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      {u.avatar ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Personnalisée
                        </span>
                      ) : (
                        <span className="text-slate-400">Monogramme initiales</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Photo, Password, Edit, Delete */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenPhotoModal(u)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold border border-sky-200 dark:border-sky-800/50 transition cursor-pointer"
                  title="Changer la photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="truncate">Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPasswordModal(u)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800/50 transition cursor-pointer"
                  title="Changer le mot de passe"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="truncate">Accès</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(u)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition cursor-pointer"
                  title="Modifier le compte"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="truncate">Éditer</span>
                </button>

                <button
                  type="button"
                  disabled={isMe}
                  onClick={() => handleDelete(u.id, u.name)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    isMe
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                      : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                  }`}
                  title={isMe ? 'Compte actuel protégé' : 'Supprimer le compte'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="truncate">Suppr.</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Modal: Photo Only / Password Only / Full User Edit & Create */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Hidden image input for modal upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {modalMode === 'photo' ? (
                    <Camera className="w-5 h-5" />
                  ) : modalMode === 'password' ? (
                    <KeyRound className="w-5 h-5" />
                  ) : modalMode === 'create' ? (
                    <UserPlus className="w-5 h-5" />
                  ) : (
                    <Edit2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {modalMode === 'photo'
                      ? `Modifier la photo : ${formName}`
                      : modalMode === 'password'
                      ? `Changer le mot de passe : ${formName}`
                      : modalMode === 'create'
                      ? 'Créer un nouveau compte utilisateur'
                      : `Modifier l'utilisateur : ${formName}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === 'photo'
                      ? 'Téléversez une photo, collez une URL ou choisissez un avatar'
                      : modalMode === 'password'
                      ? "Définissez un mot de passe sécurisé pour l'accès"
                      : "Paramétrez la photo, l'identité et les droits d'accès"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. PHOTO ONLY MODE */}
              {modalMode === 'photo' ? (
                <div className="space-y-5">
                  {/* Photo Preview Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-750">
                    <div className="relative">
                      {formAvatar ? (
                        <img
                          src={formAvatar}
                          alt={formName}
                          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center ring-4 ring-blue-500/20 shadow-lg">
                          {formName.charAt(0) || 'U'}
                        </div>
                      )}
                      {formAvatar && (
                        <button
                          type="button"
                          onClick={() => setFormAvatar('')}
                          className="absolute -top-2 -right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-md transition"
                          title="Supprimer la photo et utiliser le monogramme"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {formName}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Formats acceptés : JPG, PNG, WEBP.
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Importer depuis l'ordinateur</span>
                        </button>
                        {formAvatar && (
                          <button
                            type="button"
                            onClick={() => setFormAvatar('')}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
                          >
                            Retirer la photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Manual URL Input */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      Ou coller une URL d'image :
                    </label>
                    <div className="relative">
                      <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={formAvatar}
                        onChange={(e) => setFormAvatar(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Preset Avatars Gallery */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                      Ou choisir parmi nos avatars professionnels :
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {PRESET_AVATARS.map((url, idx) => {
                        const isSelected = formAvatar === url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormAvatar(url)}
                            className={`relative rounded-xl overflow-hidden aspect-square border-2 transition hover:scale-105 cursor-pointer ${
                              isSelected
                                ? 'border-blue-600 ring-2 ring-blue-500/40'
                                : 'border-transparent hover:border-slate-400'
                            }`}
                          >
                            <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : modalMode === 'password' ? (
                /* 2. PASSWORD ONLY MODE */
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-400 space-y-1">
                    <div>Utilisateur : <strong className="text-slate-900 dark:text-white">{formName}</strong></div>
                    <div>Identifiant de connexion : <strong className="text-blue-600 dark:text-blue-400 font-mono">@{formUsername}</strong></div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      Nouveau Mot de Passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPasswordOnly}
                        onChange={(e) => setNewPasswordOnly(e.target.value)}
                        placeholder="Nouveau mot de passe"
                        className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      Confirmer le Nouveau Mot de Passe
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPasswordOnly}
                      onChange={(e) => setConfirmPasswordOnly(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                /* 3. FULL USER CREATE / EDIT FORM (with integrated photo section) */
                <div className="space-y-4">
                  {/* Photo Customizer in Form */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4">
                    <div className="relative group/avatar shrink-0">
                      {formAvatar ? (
                        <img
                          src={formAvatar}
                          alt="Avatar"
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                          {formName ? formName.charAt(0) : 'U'}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        title="Importer une photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="font-bold text-slate-800 dark:text-white">
                        Photo de profil
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Importer</span>
                        </button>

                        {formAvatar && (
                          <button
                            type="button"
                            onClick={() => setFormAvatar('')}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium transition cursor-pointer"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick presets buttons */}
                    <div className="hidden sm:flex items-center gap-1">
                      {PRESET_AVATARS.slice(0, 4).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormAvatar(url)}
                          className={`w-7 h-7 rounded-lg overflow-hidden border transition ${
                            formAvatar === url ? 'ring-2 ring-blue-500 border-blue-500' : 'border-transparent hover:opacity-80'
                          }`}
                        >
                          <img src={url} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                        Nom Complet *
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="ex: Mohamed Salem"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                        Nom d'utilisateur (Identifiant de connexion) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
                        <input
                          type="text"
                          value={formUsername}
                          onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                          placeholder="identifiant"
                          className="w-full pl-8 pr-3 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                        {modalMode === 'create' ? 'Mot de passe initial *' : 'Modifier le mot de passe (optionnel)'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder={modalMode === 'create' ? 'Mot de passe' : 'Laisser vide pour ne pas changer'}
                          className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                          required={modalMode === 'create'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                        Rôle / Profil d'accès *
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-blue-500"
                      >
                        <option value="admin">Administrateur (Tous les droits)</option>
                        <option value="manager">Responsable / Directeur (Gestion & Validation)</option>
                        <option value="commercial">Commercial (Devis, Bons de Livraison, Factures)</option>
                        <option value="cashier">Caissier (Encaissements & Règlements)</option>
                        <option value="viewer">Consultant (Lecture seule)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                        Téléphone de contact
                      </label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="+222 45 00 00 00"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formActive}
                          onChange={(e) => setFormActive(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Compte actif (autorisé à se connecter)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Granular Permissions Matrix */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span>Droits d'accès détaillés</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Ajustables individuellement
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-750">
                      {ALL_PERMISSIONS.map((perm) => {
                        const isChecked = !!formPermissions[perm.key];
                        return (
                          <label
                            key={perm.key}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition text-[11px] ${
                              isChecked
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.key)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate">{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {modalMode === 'photo'
                      ? 'Enregistrer la photo'
                      : modalMode === 'password'
                      ? 'Enregistrer le mot de passe'
                      : modalMode === 'create'
                      ? 'Créer le compte'
                      : 'Enregistrer les modifications'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
