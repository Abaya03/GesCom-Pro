import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Search, Filter, ShieldCheck, Download, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportUtils';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.entityNumber && log.entityNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return { label: 'CRÉATION', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'update':
        return { label: 'MODIFICATION', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'delete':
        return { label: 'SUPPRESSION', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'convert':
        return { label: 'TRANSFORMATION', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'payment':
        return { label: 'ENCAISSEMENT', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: action.toUpperCase(), bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const handleExportCSV = () => {
    const rows = auditLogs.map((l) => ({
      date: l.timestamp,
      utilisateur: l.userName,
      action: l.action,
      entite: l.entityType,
      numero_document: l.entityNumber || '',
      details: l.details,
    }));

    exportToCsv(
      rows,
      [
        { key: 'date', label: 'Date & Heure' },
        { key: 'utilisateur', label: 'Utilisateur' },
        { key: 'action', label: 'Action' },
        { key: 'entite', label: 'Type Entité' },
        { key: 'numero_document', label: 'N° Document' },
        { key: 'details', label: 'Détails de l\'opération' },
      ],
      `journal_audit_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <span>Journal d'Audit & Sécurité</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historique inaltérable et horodaté de toutes les actions financières et modifications de données
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
        >
          <Download className="w-4 h-4" />
          <span>Exporter Journal CSV</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher dans les logs (utilisateur, n°...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Toutes les actions ({auditLogs.length})</option>
            <option value="create">Créations</option>
            <option value="update">Modifications</option>
            <option value="delete">Suppressions</option>
            <option value="convert">Transformations de flux</option>
            <option value="payment">Paiements / Règlements</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">Entité / N° Pièce</th>
                <th className="py-3 px-4">Description de l'événement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Aucun enregistrement trouvé.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = !isNaN(dateObj.getTime())
                    ? `${formatDate(log.timestamp)} à ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : log.timestamp;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formattedTime}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {log.userName}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase">
                          {log.entityType}
                        </span>
                        {log.entityNumber && (
                          <span className="ml-2 font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded text-[11px]">
                            {log.entityNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
