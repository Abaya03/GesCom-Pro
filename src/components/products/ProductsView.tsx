import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ItemType, Category } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Tag,
  TrendingUp,
  Boxes,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    companySettings,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<boolean>(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    categoryId: string;
    type: ItemType;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    vatRate: number;
    defaultDiscount: number;
    currentStock: number;
    minStockAlert: number;
    barcode: string;
    currency: string;
    active: boolean;
  }>({
    name: '',
    description: '',
    categoryId: '',
    type: 'product',
    unit: 'U',
    purchasePrice: 0,
    sellingPrice: 0,
    vatRate: 16,
    defaultDiscount: 0,
    currentStock: 10,
    minStockAlert: 2,
    barcode: '',
    currency: 'MRU',
    active: true,
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      const matchStock = !stockFilter || (p.type === 'product' && p.currentStock <= p.minStockAlert);
      return matchSearch && matchCat && matchType && matchStock;
    });
  }, [products, searchQuery, categoryFilter, typeFilter, stockFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      categoryId: categories[0]?.id || '',
      type: 'product',
      unit: 'U',
      purchasePrice: 0,
      sellingPrice: 0,
      vatRate: companySettings.taxes.find((t) => t.isDefault)?.rate || 16,
      defaultDiscount: 0,
      currentStock: 10,
      minStockAlert: 2,
      barcode: '',
      currency: companySettings.primaryCurrencyCode,
      active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      categoryId: p.categoryId,
      type: p.type,
      unit: p.unit,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      vatRate: p.vatRate,
      defaultDiscount: p.defaultDiscount,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      barcode: p.barcode || '',
      currency: p.currency,
      active: p.active,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (p: Product) => {
    if (window.confirm(`Confirmez-vous la suppression de "${p.name}" (${p.code}) ?`)) {
      deleteProduct(p.id);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName,
      description: newCatDesc,
      color: '#0284c7',
      active: true,
    });
    setNewCatName('');
    setNewCatDesc('');
  };

  // Live margin computation
  const marginAmount = formData.sellingPrice - formData.purchasePrice;
  const marginPercent =
    formData.purchasePrice > 0
      ? ((marginAmount / formData.purchasePrice) * 100).toFixed(1)
      : '100.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            <span>Catalogue Produits & Services</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestion des articles, unités de vente, marges, TVA applicable et alertes de stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Layers className="w-4 h-4" />
            <span>Catégories ({categories.length})</span>
          </button>

          {hasPermission('manage_products') && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Recherche par désignation, réf, code-barres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Produits & Services</option>
            <option value="product">Produits Physiques</option>
            <option value="service">Prestations / Services</option>
          </select>

          {/* Low stock quick toggle */}
          <button
            onClick={() => setStockFilter(!stockFilter)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              stockFilter
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alerte Stock Seul</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Code & Désignation</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Type & Unité</th>
                <th className="py-3 px-4 text-right">Prix Achat HT</th>
                <th className="py-3 px-4 text-right">Prix Vente HT</th>
                <th className="py-3 px-4 text-center">TVA</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Aucun article ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const isLowStock = p.type === 'product' && p.currentStock <= p.minStockAlert;
                  const marginVal = p.sellingPrice - p.purchasePrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[10px] text-purple-600 font-bold">{p.code}</div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">{p.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {cat?.name || 'Général'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.type === 'service' ? 'Service' : 'Produit'}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Unité: {p.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(p.purchasePrice, p.currency, companySettings.currencies)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(p.sellingPrice, p.currency, companySettings.currencies)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold font-mono">
                          +{formatCurrency(marginVal, p.currency, companySettings.currencies)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                        {p.vatRate}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.type === 'product' ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isLowStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3" />}
                            {p.currentStock} {p.unit}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Illimité</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('manage_products') && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('delete_records') && (
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingProduct ? `Modifier Article : ${editingProduct.code}` : 'Nouvel Article / Service'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-4 md:p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Désignation de l'article / service *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Serveur Dell PowerEdge T350 ou Installation Réseau"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Type d'élément</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ItemType })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="product">Produit Physique avec stock</option>
                    <option value="service">Prestation / Service / Main d'œuvre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Catégorie</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Unité de mesure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="U">Unité (U)</option>
                    <option value="Kg">Kilogramme (Kg)</option>
                    <option value="M">Mètre (M)</option>
                    <option value="L">Litre (L)</option>
                    <option value="Heure">Heure (H)</option>
                    <option value="Jour">Journée (J)</option>
                    <option value="Forfait">Forfait</option>
                    <option value="Lot">Lot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Code-barres (EAN / SKU)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="6191234567890"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="md:col-span-2 p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Prix d'Achat HT</label>
                    <input
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Prix de Vente HT *</label>
                    <input
                      type="number"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Taux TVA (%)</label>
                    <select
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {companySettings.taxes.map((t) => (
                        <option key={t.id} value={t.rate}>
                          {t.name} ({t.rate}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 pt-2 text-[11px] text-purple-900 dark:text-purple-300 flex items-center justify-between font-semibold">
                    <span>Marge brute estimée : <strong>{formatCurrency(marginAmount, formData.currency, companySettings.currencies)}</strong></span>
                    <span>Taux de marque : <strong>{marginPercent}%</strong></span>
                  </div>
                </div>

                {formData.type === 'product' && (
                  <>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Stock Actuel</label>
                      <input
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Seuil Alerte Stock</label>
                      <input
                        type="number"
                        value={formData.minStockAlert}
                        onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description Technique</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Spécifications, dimensions, références constructeur..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Gestion des Catégories</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 overflow-y-auto text-xs">
              <form onSubmit={handleAddCategory} className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-white">Ajouter une nouvelle catégorie</div>
                <input
                  type="text"
                  required
                  placeholder="Nom de la catégorie (ex: Équipements Réseau)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Description courte (optionnelle)"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow text-xs"
                >
                  Ajouter la catégorie
                </button>
              </form>

              <div className="space-y-2">
                <div className="font-bold text-slate-500 text-[11px] uppercase">Catégories existantes</div>
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                      {c.description && <div className="text-[10px] text-slate-500">{c.description}</div>}
                    </div>
                    {categories.length > 1 && (
                      <button
                        onClick={() => deleteCategory(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
