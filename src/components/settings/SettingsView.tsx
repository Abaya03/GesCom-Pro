import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanySettings, CurrencyConfig, TaxConfig, DocumentTemplateStyle } from '../../types';
import {
  Settings,
  Building,
  Coins,
  Receipt,
  FileDigit,
  Palette,
  Database,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Stamp,
  FileSignature,
  Landmark,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import { exportCompanyDataAsJson, importCompanyDataFromJson } from '../../utils/exportUtils';
import { initialData } from '../../data/initialData';

const MAURITANIAN_BANKS = [
  { name: 'Banque Nationale de Mauritanie (BNM)', swift: 'BNMRMRNK' },
  { name: 'Banque Al Wava Mauritanienne Islamique (BAMIS)', swift: 'BAMIMRNK' },
  { name: 'Société Générale Mauritanie (SGM)', swift: 'SGMOMRNK' },
  { name: 'Banque pour le Commerce et l\'Industrie (BCI)', swift: 'BCISMRNK' },
  { name: 'Banque Populaire de Mauritanie (BPM)', swift: 'BPMAMRNK' },
  { name: 'Attijariwafa Bank Mauritanie (AWBM)', swift: 'ATTIMRNK' },
  { name: 'Banque Mauritanienne pour le Commerce International (BMCI)', swift: 'BMCIMRNK' },
  { name: 'Chinguetti Bank (CDD)', swift: 'CHINMRNK' },
  { name: 'Orabank Mauritanie', swift: 'BOCIMRNK' },
  { name: 'Banque Islamique de Mauritanie (BIS)', swift: 'BISMVRNK' },
  { name: 'IBBank Mauritanie', swift: 'IBBKMRNK' },
];

const MAURITANIAN_CITIES = [
  'Nouakchott',
  'Nouakchott (Tevragh Zeina)',
  'Nouakchott (Ksar)',
  'Nouakchott (Sebkha)',
  'Nouakchott (Arafat)',
  'Nouakchott (Dar Naim)',
  'Nouakchott (Teyarett)',
  'Nouakchott (El Mina)',
  'Nouadhibou',
  'Rosso',
  'Kiffa',
  'Kaédi',
  'Atar',
  'Zouerate',
  'Néma',
  'Sélibaby',
  'Akjoujt',
  'Tidjikja',
  'Aioun',
  'Boghé',
];

const MAURITANIAN_TAX_CENTERS = [
  'DGE - Direction des Grandes Entreprises (Nouakchott)',
  'CDI Tevragh-Zeina (Nouakchott Ouest)',
  'CDI Ksar (Nouakchott Ouest)',
  'CDI Sebkha (Nouakchott Sud)',
  'CDI Arafat (Nouakchott Sud)',
  'CDI Dar Naim (Nouakchott Nord)',
  'CDI Teyarett (Nouakchott Nord)',
  'CDI Dakhlet Nouadhibou',
  'CDI Trarza (Rosso)',
  'CDI Gorgol (Kaédi)',
  'CDI Assaba (Kiffa)',
  'CDI Adrar (Atar)',
];

export const SettingsView: React.FC = () => {
  const { companySettings, updateCompanySettings, state, restoreFullData } = useApp();

  const [activeTab, setActiveTab] = useState<
    'company' | 'currencies' | 'taxes' | 'numbering' | 'templates' | 'backup'
  >('company');

  const [formCompany, setFormCompany] = useState<CompanySettings>({ ...companySettings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const stampFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formCompany);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Image Upload Handlers (Logo, Cachet, Signature)
  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'stampUrl' | 'signatureUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB for localStorage safety)
    if (file.size > 3 * 1024 * 1024) {
      alert('L\'image sélectionnée est trop volumineuse (max 3 Mo). Veuillez choisir une image plus légère.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormCompany((prev) => ({
          ...prev,
          [field]: result,
        }));
        if (field === 'logoUrl') setLogoPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Currency handlers
  const handleAddCurrency = () => {
    const newCurr: CurrencyConfig = {
      id: 'curr_' + Date.now(),
      code: 'CAD',
      name: 'Dollar Canadien',
      symbol: 'CA$',
      symbolPosition: 'after',
      exchangeRate: 28.5,
      isPrimary: false,
      decimals: 2,
      active: true,
    };
    setFormCompany((prev) => ({
      ...prev,
      currencies: [...prev.currencies, newCurr],
    }));
  };

  const handleRemoveCurrency = (code: string) => {
    if (code === formCompany.primaryCurrencyCode) {
      alert('Impossible de supprimer la devise principale de l\'entreprise.');
      return;
    }
    setFormCompany((prev) => ({
      ...prev,
      currencies: prev.currencies.filter((c) => c.code !== code),
    }));
  };

  // Tax handlers
  const handleAddTax = () => {
    const newTax: TaxConfig = {
      id: 'tax_' + Date.now(),
      name: 'Taxe Locale',
      rate: 5,
      isDefault: false,
      active: true,
    };
    setFormCompany((prev) => ({
      ...prev,
      taxes: [...prev.taxes, newTax],
    }));
  };

  const handleRemoveTax = (id: string) => {
    setFormCompany((prev) => ({
      ...prev,
      taxes: prev.taxes.filter((t) => t.id !== id),
    }));
  };

  // Backup handlers
  const handleExportJSON = () => {
    exportCompanyDataAsJson(state, `${formCompany.name.toLowerCase().replace(/\s+/g, '_')}_backup`);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importCompanyDataFromJson(
      file,
      (importedData) => {
        restoreFullData(importedData);
        alert('Restauration complète des données effectuée avec succès !');
      },
      (err) => {
        alert('Erreur lors de l\'import du fichier JSON : ' + err.message);
      }
    );
  };

  const handleResetDemoData = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les données avec le jeu de données de test officiel ?')) {
      restoreFullData(initialData);
      setFormCompany(initialData.companySettings);
      alert('Données réinitialisées avec succès.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-600" />
            <span>Paramétrage Général & Entreprise (Mauritanie)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestion du logo, mentions légales DGI/RCCM Nouakchott, banques locales, TVA 16%, devise MRU et modèles
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Paramètres enregistrés avec succès !</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'company'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Société, Logo & Fisc Mauritanie</span>
        </button>

        <button
          onClick={() => setActiveTab('currencies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'currencies'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Devises (MRU Ouguiya)</span>
        </button>

        <button
          onClick={() => setActiveTab('taxes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'taxes'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>TVA Mauritanie (16%)</span>
        </button>

        <button
          onClick={() => setActiveTab('numbering')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'numbering'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileDigit className="w-4 h-4" />
          <span>Numérotation des Pièces</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Modèles & Thèmes</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sauvegarde & Données</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave}>
        {/* 1. SOCIÉTÉ & FISC (MAURITANIE + LOGO) */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            {/* LOGO & CHARTE VISUELLE CARD */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Logo & Identité Visuelle de l'Entreprise
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ce logo sera imprimé en en-tête de tous vos devis, factures, bons de livraison et reçus.
                    </p>
                  </div>
                </div>

                {formCompany.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormCompany({ ...formCompany, logoUrl: '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer le logo</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Logo Preview Box */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[180px]">
                  {formCompany.logoUrl && !logoPreviewError ? (
                    <div className="relative group flex flex-col items-center">
                      <img
                        src={formCompany.logoUrl}
                        alt="Logo Entreprise"
                        onError={() => setLogoPreviewError(true)}
                        className="max-h-24 max-w-[200px] object-contain rounded-lg drop-shadow-sm p-1 bg-white"
                      />
                      <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Logo actif sur documents
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-xl">
                        {formCompany.name ? formCompany.name.substring(0, 2).toUpperCase() : 'MR'}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Aucun logo importé
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Les initiales de l'entreprise sont utilisées par défaut
                      </div>
                    </div>
                  )}
                </div>

                {/* Logo Upload & Controls */}
                <div className="md:col-span-8 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Téléverser une image de logo (PNG, JPG, SVG, WebP)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'logoUrl')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Choisir un fichier logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          // Preset modern logo for demonstration
                          setFormCompany((prev) => ({
                            ...prev,
                            logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
                          }));
                          setLogoPreviewError(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
                      >
                        <span>Exemple Logo Pro</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Format recommandé : image transparente PNG ou SVG, dimensions optimales 400x120px, max 3 Mo.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ou coller directement l'URL d'un logo hébergé :
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://votre-domaine.mr/images/logo.png"
                        value={formCompany.logoUrl || ''}
                        onChange={(e) => {
                          setFormCompany({ ...formCompany, logoUrl: e.target.value });
                          setLogoPreviewError(false);
                        }}
                        className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Cachet & Signature options */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Stamp className="w-4 h-4 text-sky-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white">Cachet Officiel</div>
                          <div className="text-[10px] text-slate-400">
                            {formCompany.stampUrl ? 'Cachet configuré' : 'Aucun cachet'}
                          </div>
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={stampFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'stampUrl')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => stampFileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-100"
                      >
                        {formCompany.stampUrl ? 'Modifier' : 'Ajouter'}
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white">Signature DG</div>
                          <div className="text-[10px] text-slate-400">
                            {formCompany.signatureUrl ? 'Signature configurée' : 'Nom textuel'}
                          </div>
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={signatureFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'signatureUrl')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => signatureFileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-100"
                      >
                        {formCompany.signatureUrl ? 'Modifier' : 'Ajouter'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IDENTITÉ JURIDIQUE & FISCALE MAURITANIENNE */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Building className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Identité Juridique & Mentions Fiscales (Mauritanie)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Raison Sociale Légale *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCompany.name}
                    onChange={(e) => setFormCompany({ ...formCompany, name: e.target.value })}
                    placeholder="ex: ATLAS TECHNOLOGIES & TRADING SARL"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nom Commercial / Enseigne
                  </label>
                  <input
                    type="text"
                    value={formCompany.commercialName}
                    onChange={(e) => setFormCompany({ ...formCompany, commercialName: e.target.value })}
                    placeholder="ex: Atlas Trading & Solutions"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Forme Juridique en Mauritanie
                  </label>
                  <select
                    value={formCompany.legalForm || 'SARL'}
                    onChange={(e) => setFormCompany({ ...formCompany, legalForm: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="SARL">SARL - Société à Responsabilité Limitée</option>
                    <option value="SA">SA - Société Anonyme</option>
                    <option value="SUARL">SUARL - Société Unipersonnelle à Responsabilité Limitée</option>
                    <option value="ETS">Établissement (ETS) / Entreprise Individuelle</option>
                    <option value="SAS">SAS - Société par Actions Simplifiée</option>
                    <option value="GIE">GIE - Groupement d'Intérêt Économique</option>
                    <option value="SNC">SNC - Société en Nom Collectif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Capital Social (MRU)
                  </label>
                  <input
                    type="text"
                    value={formCompany.capital || '5 000 000 MRU'}
                    onChange={(e) => setFormCompany({ ...formCompany, capital: e.target.value })}
                    placeholder="ex: 5 000 000 MRU"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                      Numéro d'Identification Fiscale (NIF) *
                    </label>
                    <span className="text-[10px] text-sky-600 font-bold bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.2 rounded">
                      DGI Mauritanie
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formCompany.nif}
                    onChange={(e) => setFormCompany({ ...formCompany, nif: e.target.value })}
                    placeholder="ex: 00349281-D"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sky-700 dark:text-sky-300"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                      Registre du Commerce (RCCM) *
                    </label>
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded">
                      Greffe Nouakchott
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formCompany.rccm}
                    onChange={(e) => setFormCompany({ ...formCompany, rccm: e.target.value })}
                    placeholder="ex: RC-NKC-2023-B-14890"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-amber-700 dark:text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Centre des Impôts de Rattachement (DGI)
                  </label>
                  <select
                    value={
                      formCompany.customAdminFields?.find((f) => f.label.includes('Centre'))?.value ||
                      'CDI Tevragh-Zeina (Nouakchott Ouest)'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const existing = formCompany.customAdminFields || [];
                      const hasField = existing.some((f) => f.label.includes('Centre'));
                      const updated = hasField
                        ? existing.map((f) => (f.label.includes('Centre') ? { ...f, value: val } : f))
                        : [...existing, { id: 'f_tax_center', label: 'Centre des Impôts', value: val }];
                      setFormCompany({ ...formCompany, customAdminFields: updated });
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    {MAURITANIAN_TAX_CENTERS.map((tc) => (
                      <option key={tc} value={tc}>
                        {tc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Régime Fiscal
                  </label>
                  <select
                    value={
                      formCompany.customAdminFields?.find((f) => f.label.includes('Régime'))?.value ||
                      'Réel Normal'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const existing = formCompany.customAdminFields || [];
                      const hasField = existing.some((f) => f.label.includes('Régime'));
                      const updated = hasField
                        ? existing.map((f) => (f.label.includes('Régime') ? { ...f, value: val } : f))
                        : [...existing, { id: 'f_regime', label: 'Régime Fiscal', value: val }];
                      setFormCompany({ ...formCompany, customAdminFields: updated });
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="Réel Normal">Régime Réel Normal (IS / TVA 16%)</option>
                    <option value="Réel Simplifié">Régime Réel Simplifié (RSI)</option>
                    <option value="Forfait">Régime du Forfait / Micro-entreprise</option>
                    <option value="Exonéré / Zone Franche">Exonéré / Zone Franche Nouadhibou (ZFN)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Slogan / Devise Commerciale
                  </label>
                  <input
                    type="text"
                    value={formCompany.slogan || ''}
                    onChange={(e) => setFormCompany({ ...formCompany, slogan: e.target.value })}
                    placeholder="ex: Excellence commerciale, Fiabilité et Solutions d'Ingénierie"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* ADRESSE & LOCALISATION EN MAURITANIE */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Siège Social & Coordonnées (Mauritanie)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Adresse du Siège Social
                  </label>
                  <input
                    type="text"
                    value={formCompany.address}
                    onChange={(e) => setFormCompany({ ...formCompany, address: e.target.value })}
                    placeholder="ex: Avenue Charles de Gaulle, Ilot C n° 45, Tevragh Zeina"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Ville / Wilaya
                  </label>
                  <select
                    value={formCompany.city || 'Nouakchott'}
                    onChange={(e) => setFormCompany({ ...formCompany, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    {MAURITANIAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pays</label>
                  <input
                    type="text"
                    value={formCompany.country || 'Mauritanie'}
                    onChange={(e) => setFormCompany({ ...formCompany, country: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Téléphone Principal (Fixe / Siège)
                  </label>
                  <input
                    type="text"
                    value={formCompany.phone}
                    onChange={(e) => setFormCompany({ ...formCompany, phone: e.target.value })}
                    placeholder="ex: +222 45 25 88 90"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Téléphone Mobile / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formCompany.phone2 || ''}
                    onChange={(e) => setFormCompany({ ...formCompany, phone2: e.target.value })}
                    placeholder="ex: +222 22 30 11 22"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Email Officiel
                  </label>
                  <input
                    type="email"
                    value={formCompany.email}
                    onChange={(e) => setFormCompany({ ...formCompany, email: e.target.value })}
                    placeholder="ex: contact@atlas-trading.mr"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Site Web Internet
                  </label>
                  <input
                    type="text"
                    value={formCompany.website || ''}
                    onChange={(e) => setFormCompany({ ...formCompany, website: e.target.value })}
                    placeholder="ex: https://www.atlas-trading.mr"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Boîte Postale (BP)
                  </label>
                  <input
                    type="text"
                    value={formCompany.postalCode || 'BP 4520'}
                    onChange={(e) => setFormCompany({ ...formCompany, postalCode: e.target.value })}
                    placeholder="ex: BP 4520"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* COORDONNÉES BANCAIRES & PAIEMENTS EN MAURITANIE */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Landmark className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Banque & Comptes de Règlement (Mauritanie)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Banque Principale en Mauritanie
                  </label>
                  <select
                    value={formCompany.bankName}
                    onChange={(e) => {
                      const selectedBank = MAURITANIAN_BANKS.find((b) => b.name === e.target.value);
                      setFormCompany({
                        ...formCompany,
                        bankName: e.target.value,
                        swift: selectedBank?.swift || formCompany.swift,
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {MAURITANIAN_BANKS.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Numéro de Compte / RIB Bancaire
                  </label>
                  <input
                    type="text"
                    value={formCompany.bankAccount}
                    onChange={(e) => setFormCompany({ ...formCompany, bankAccount: e.target.value })}
                    placeholder="ex: 0100 2489 0012 3456 78"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                      IBAN Mauritanien (27 caractères)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Format : MR13 ...</span>
                  </div>
                  <input
                    type="text"
                    value={formCompany.iban}
                    onChange={(e) => setFormCompany({ ...formCompany, iban: e.target.value })}
                    placeholder="ex: MR13 0001 0024 8900 1234 5678 90"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sky-700 dark:text-sky-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Code SWIFT / BIC
                  </label>
                  <input
                    type="text"
                    value={formCompany.swift}
                    onChange={(e) => setFormCompany({ ...formCompany, swift: e.target.value })}
                    placeholder="ex: BNMRMRNK"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* RESPONSABLE LÉGAL & SIGNATAIRE */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FileSignature className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Direction Générale & Signataire Autorisé
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nom Complet du Gérant / Directeur *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCompany.managerName}
                    onChange={(e) => setFormCompany({ ...formCompany, managerName: e.target.value })}
                    placeholder="ex: Brahim Med Moustapha"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Fonction / Titre Officiel
                  </label>
                  <input
                    type="text"
                    value={formCompany.managerRole}
                    onChange={(e) => setFormCompany({ ...formCompany, managerRole: e.target.value })}
                    placeholder="ex: Directeur Général"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MULTI-DEVISES */}
        {activeTab === 'currencies' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Configuration des Devises (Devise Principale : Ouguiya Mauritanien MRU)
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Toutes les transactions et comptabilités sont tenues en Ouguiya Mauritanien (MRU).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCurrency}
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter Devise</span>
              </button>
            </div>

            <div className="space-y-3">
              {formCompany.currencies.map((curr, idx) => (
                <div
                  key={curr.code}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center"
                >
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Code ISO</label>
                    <input
                      type="text"
                      value={curr.code}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormCompany((prev) => ({
                          ...prev,
                          currencies: prev.currencies.map((c, i) => (i === idx ? { ...c, code: val } : c)),
                        }));
                      }}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Nom Devise</label>
                    <input
                      type="text"
                      value={curr.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormCompany((prev) => ({
                          ...prev,
                          currencies: prev.currencies.map((c, i) => (i === idx ? { ...c, name: val } : c)),
                        }));
                      }}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Symbole</label>
                    <input
                      type="text"
                      value={curr.symbol}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormCompany((prev) => ({
                          ...prev,
                          currencies: prev.currencies.map((c, i) => (i === idx ? { ...c, symbol: val } : c)),
                        }));
                      }}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Taux (vs {formCompany.primaryCurrencyCode})</label>
                    <input
                      type="number"
                      step="0.001"
                      disabled={curr.code === formCompany.primaryCurrencyCode}
                      value={curr.exchangeRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setFormCompany((prev) => ({
                          ...prev,
                          currencies: prev.currencies.map((c, i) => (i === idx ? { ...c, exchangeRate: val } : c)),
                        }));
                      }}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 sm:pt-0">
                    {curr.code === formCompany.primaryCurrencyCode ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">
                        Devise Principale
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveCurrency(curr.code)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TVA & TAXES MAURITANIE */}
        {activeTab === 'taxes' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Taux de TVA en Mauritanie (Taux Standard : 16%)
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Conformément au Code Général des Impôts (CGI) de la République Islamique de Mauritanie.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTax}
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter Taxe</span>
              </button>
            </div>

            <div className="space-y-3">
              {formCompany.taxes.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase">Libellé Taxe</label>
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormCompany((prev) => ({
                            ...prev,
                            taxes: prev.taxes.map((x, i) => (i === idx ? { ...x, name: val } : x)),
                          }));
                        }}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase">Taux (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={t.rate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormCompany((prev) => ({
                            ...prev,
                            taxes: prev.taxes.map((x, i) => (i === idx ? { ...x, rate: val } : x)),
                          }));
                        }}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>

                  {formCompany.taxes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTax(t.id)}
                      className="p-2 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. NUMÉROTATION DES PIÈCES */}
        {activeTab === 'numbering' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Format & Préfixes Automatiques des Numéros de Documents
            </h3>
            <p className="text-slate-500 text-[11px]">
              Variables disponibles : <code>{'{YEAR}'}</code> (Année), <code>{'{MONTH}'}</code> (Mois), <code>{'{NUMBER}'}</code> (Compteur séquentiel).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <label className="font-bold text-slate-800 dark:text-white">Format Factures</label>
                <input
                  type="text"
                  value={formCompany.numbering.facture.format}
                  onChange={(e) =>
                    setFormCompany({
                      ...formCompany,
                      numbering: {
                        ...formCompany.numbering,
                        facture: { ...formCompany.numbering.facture, format: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sky-600 font-bold"
                />
                <span className="text-[10px] text-slate-400">Exemple généré : FAC-2026-00019</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <label className="font-bold text-slate-800 dark:text-white">Format Devis</label>
                <input
                  type="text"
                  value={formCompany.numbering.devis.format}
                  onChange={(e) =>
                    setFormCompany({
                      ...formCompany,
                      numbering: {
                        ...formCompany.numbering,
                        devis: { ...formCompany.numbering.devis, format: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-amber-600 font-bold"
                />
                <span className="text-[10px] text-slate-400">Exemple généré : DEV-2026-00016</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <label className="font-bold text-slate-800 dark:text-white">Format Bons de Livraison (BL)</label>
                <input
                  type="text"
                  value={formCompany.numbering.bl.format}
                  onChange={(e) =>
                    setFormCompany({
                      ...formCompany,
                      numbering: {
                        ...formCompany.numbering,
                        bl: { ...formCompany.numbering.bl, format: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-indigo-600 font-bold"
                />
                <span className="text-[10px] text-slate-400">Exemple généré : BL-2026-00013</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <label className="font-bold text-slate-800 dark:text-white">Format Reçus de Paiement</label>
                <input
                  type="text"
                  value={formCompany.numbering.paiement.format}
                  onChange={(e) =>
                    setFormCompany({
                      ...formCompany,
                      numbering: {
                        ...formCompany.numbering,
                        paiement: { ...formCompany.numbering.paiement, format: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-emerald-600 font-bold"
                />
                <span className="text-[10px] text-slate-400">Exemple généré : REG-2026-00014</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. MODÈLES & THÈMES */}
        {activeTab === 'templates' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Personnalisation Visuelle des Factures & Devis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Modèle Visuel par Défaut</label>
                <select
                  value={formCompany.documentTemplate}
                  onChange={(e) =>
                    setFormCompany({ ...formCompany, documentTemplate: e.target.value as DocumentTemplateStyle })
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="modern">Modèle Moderne (Bandeau & Cartouches arrondis)</option>
                  <option value="classic">Modèle Classique (Épuré & Tableaux traditionnels)</option>
                  <option value="professional">Modèle Professionnel (En-tête sombre & Signature)</option>
                  <option value="minimalist">Modèle Minimaliste (Lignes fines sans fond)</option>
                  <option value="elegant">Modèle Élégant (Bordures dorées & Police soignée)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Couleur Principale de Marque</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formCompany.primaryColor}
                    onChange={(e) => setFormCompany({ ...formCompany, primaryColor: e.target.value })}
                    className="w-12 h-10 p-1 bg-transparent rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formCompany.primaryColor}
                    onChange={(e) => setFormCompany({ ...formCompany, primaryColor: e.target.value })}
                    className="w-32 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mentions Légales de Pied de Page</label>
                <textarea
                  rows={3}
                  value={formCompany.legalNotice}
                  onChange={(e) => setFormCompany({ ...formCompany, legalNotice: e.target.value })}
                  placeholder="ex: SARL au capital de 5 000 000 MRU — NIF : 00349281-D — RCCM : RC-NKC-2023-B-14890"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Conditions Générales de Vente (CGV)</label>
                <textarea
                  rows={3}
                  value={formCompany.termsAndConditions}
                  onChange={(e) => setFormCompany({ ...formCompany, termsAndConditions: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. SAUVEGARDE & RESTAURATION */}
        {activeTab === 'backup' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sauvegarde Complète & Portabilité des Données</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Exportez l'intégralité de vos clients, factures, devis, produits, dépenses et journal d'audit dans un fichier JSON chiffrable et portable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-sky-900 dark:text-sky-200 text-sm">Sauvegarde JSON</div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Téléchargez un instantané complet de votre base commerciale.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter Base Complète</span>
                </button>
              </div>

              <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-sm">Restaurer Sauvegarde</div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Chargez un fichier de sauvegarde pour remplacer l'état actuel.
                  </p>
                </div>
                <label className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl shadow cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Charger Fichier JSON</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>

              <div className="p-5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-rose-900 dark:text-rose-200 text-sm">Données de Démo</div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Réinjecter le jeu de données d'essai officiel avec le scénario complet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Réinitialiser Démo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Save button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Paramètres</span>
          </button>
        </div>
      </form>
    </div>
  );
};

