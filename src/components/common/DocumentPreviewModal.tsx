import React, { useState } from 'react';
import { CompanySettings, Quote, DeliveryNote, Invoice, Payment, DocumentTemplateStyle } from '../../types';
import { DocumentTemplate } from './DocumentTemplate';
import { X, Printer, Download, Eye, FileText, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'devis' | 'bl' | 'facture' | 'recu';
  data: Quote | DeliveryNote | Invoice | Payment | null;
  company: CompanySettings;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  company,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'A4' | 'A5' | 'thermal'>('A4');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateStyle>(company.documentTemplate || 'modern');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: selectedFormat === 'A5' ? 'a5' : 'a4',
      });

      // Quick fallback standard PDF generation
      const printableElem = document.getElementById('printable-document-content');
      if (printableElem) {
        await doc.html(printableElem, {
          callback: function (pdf) {
            pdf.save(`${data.number || 'document'}.pdf`);
            setIsExporting(false);
          },
          x: 10,
          y: 10,
          width: selectedFormat === 'A5' ? 130 : 190,
          windowWidth: 800,
        });
      } else {
        doc.text(`Document: ${data.number}`, 10, 10);
        doc.save(`${data.number || 'document'}.pdf`);
        setIsExporting(false);
      }
    } catch (err) {
      console.warn('PDF direct generation using browser print fallback', err);
      window.print();
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 md:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50 print:border-none print:shadow-none print:bg-white print:w-full">
        {/* Header Toolbar (hidden on print) */}
        <div className="p-4 bg-slate-800 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm md:text-base flex items-center gap-2">
                <span>Aperçu Impression & PDF :</span>
                <span className="font-mono text-sky-300">{data.number}</span>
              </div>
              <p className="text-xs text-slate-400">Visualisation fidèle du document officiel</p>
            </div>
          </div>

          {/* Quick options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Format selector */}
            <div className="flex bg-slate-700 p-1 rounded-lg text-xs">
              <button
                onClick={() => setSelectedFormat('A4')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  selectedFormat === 'A4' ? 'bg-sky-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                A4
              </button>
              <button
                onClick={() => setSelectedFormat('A5')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  selectedFormat === 'A5' ? 'bg-sky-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                A5
              </button>
              <button
                onClick={() => setSelectedFormat('thermal')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  selectedFormat === 'thermal' ? 'bg-sky-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Ticket 80mm
              </button>
            </div>

            {/* Template selector */}
            {selectedFormat !== 'thermal' && (
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as DocumentTemplateStyle)}
                className="bg-slate-700 text-slate-100 text-xs px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="modern">Modèle Moderne</option>
                <option value="classic">Modèle Classique</option>
                <option value="professional">Modèle Professionnel</option>
                <option value="minimalist">Modèle Minimaliste</option>
                <option value="elegant">Modèle Élégant</option>
              </select>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Export...' : 'Télécharger PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200/70 print:p-0 print:bg-white">
          <div id="printable-document-content" className="mx-auto print:m-0">
            <DocumentTemplate
              type={type}
              data={data}
              company={company}
              overrideStyle={selectedTemplate}
              format={selectedFormat}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
