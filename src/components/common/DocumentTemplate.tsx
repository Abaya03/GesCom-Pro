import React from 'react';
import {
  CompanySettings,
  Quote,
  DeliveryNote,
  Invoice,
  Payment,
  DocumentTemplateStyle,
} from '../../types';
import { formatCurrency, formatDate, numberToFrenchWords } from '../../utils/formatters';
import { CheckCircle2, Building2, Phone, Mail, Globe, MapPin } from 'lucide-react';

interface DocumentTemplateProps {
  type: 'devis' | 'bl' | 'facture' | 'recu';
  data: Quote | DeliveryNote | Invoice | Payment;
  company: CompanySettings;
  overrideStyle?: DocumentTemplateStyle;
  format?: 'A4' | 'A5' | 'thermal';
}

export const DocumentTemplate: React.FC<DocumentTemplateProps> = ({
  type,
  data,
  company,
  overrideStyle,
  format = 'A4',
}) => {
  const style = overrideStyle || company.documentTemplate || 'modern';
  const primaryColor = company.primaryColor || '#0284c7';
  const secondaryColor = company.secondaryColor || '#0f172a';

  // Extract common fields
  const isQuote = type === 'devis';
  const isBL = type === 'bl';
  const isInvoice = type === 'facture';
  const isReceipt = type === 'recu';

  const quote = isQuote ? (data as Quote) : null;
  const bl = isBL ? (data as DeliveryNote) : null;
  const invoice = isInvoice ? (data as Invoice) : null;
  const payment = isReceipt ? (data as Payment) : null;

  const docNumber = data.number;
  const docDate = data.date;
  const client = (data as Quote | DeliveryNote | Invoice).clientSnapshot;
  const items = (data as Quote | DeliveryNote | Invoice).items || [];
  const currency = (data as Quote | Invoice | Payment).currency || company.primaryCurrencyCode;

  const docTitle =
    type === 'devis'
      ? 'DEVIS COMMERCIAL'
      : type === 'bl'
      ? 'BON DE LIVRAISON'
      : type === 'facture'
      ? 'FACTURE'
      : 'REÇU DE PAIEMENT';

  // Thermal format special layout
  if (format === 'thermal') {
    return (
      <div className="w-[80mm] max-w-full bg-white text-black p-4 text-xs font-mono border border-dashed border-gray-300 mx-auto shadow-sm">
        <div className="text-center pb-3 border-b border-black">
          <div className="font-bold text-sm uppercase">{company.commercialName || company.name}</div>
          <div>{company.address} - {company.city}</div>
          <div>Tél : {company.phone}</div>
          <div>NIF : {company.nif}</div>
        </div>

        <div className="py-2 border-b border-dashed border-black">
          <div className="font-bold text-center uppercase tracking-wider">{docTitle}</div>
          <div className="flex justify-between">
            <span>N° :</span> <span className="font-bold">{docNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date :</span> <span>{formatDate(docDate)}</span>
          </div>
          {client && (
            <div className="mt-1">
              <div>Client : {client.name}</div>
              {client.phone && <div>Tél : {client.phone}</div>}
            </div>
          )}
          {payment && (
            <div>
              <div>Facture : {payment.invoiceNumber}</div>
              <div>Mode : {payment.paymentMethod.toUpperCase()}</div>
            </div>
          )}
        </div>

        {!isReceipt && (
          <div className="py-2 border-b border-black">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="pb-1">Désignation</th>
                  <th className="text-center pb-1">Qté</th>
                  <th className="text-right pb-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-b border-dotted border-gray-200">
                    <td className="py-1">
                      <div>{it.designation}</div>
                      <div className="text-[10px] text-gray-500">{it.unitPrice} / {it.unit}</div>
                    </td>
                    <td className="text-center py-1">{it.quantity}</td>
                    <td className="text-right py-1 font-semibold">
                      {formatCurrency(it.totalTTC, currency, company.currencies)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="py-2 space-y-1 text-right">
          {invoice && (
            <>
              <div className="flex justify-between">
                <span>Total HT :</span>
                <span>{formatCurrency(invoice.totalHT, currency, company.currencies)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA :</span>
                <span>{formatCurrency(invoice.totalVAT, currency, company.currencies)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                <span>NET À PAYER :</span>
                <span>{formatCurrency(invoice.totalTTC, currency, company.currencies)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Payé :</span>
                <span>{formatCurrency(invoice.paidAmount, currency, company.currencies)}</span>
              </div>
              {invoice.remainingAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Reste à payer :</span>
                  <span>{formatCurrency(invoice.remainingAmount, currency, company.currencies)}</span>
                </div>
              )}
            </>
          )}

          {payment && (
            <div className="flex justify-between font-bold text-sm py-1 border-t border-b border-black">
              <span>MONTANT ENCAISSÉ :</span>
              <span>{formatCurrency(payment.amount, currency, company.currencies)}</span>
            </div>
          )}
        </div>

        <div className="text-center pt-3 border-t border-dashed border-black text-[10px] space-y-1">
          <p>Merci pour votre confiance !</p>
          <p>{company.legalNotice}</p>
        </div>
      </div>
    );
  }

  // Template Styles: Modern, Classic, Professional, Minimalist, Elegant
  return (
    <div
      className={`relative bg-white text-slate-800 shadow-xl print:shadow-none p-8 md:p-12 mx-auto transition-all ${
        format === 'A5' ? 'max-w-[148mm] min-h-[210mm] text-xs' : 'max-w-[210mm] min-h-[297mm]'
      }`}
      style={{ fontFamily: company.fontFamily || 'Inter, sans-serif' }}
    >
      {/* Optional Watermark */}
      {company.showWatermark && company.watermarkText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5 rotate-[-35deg] text-6xl md:text-8xl font-black uppercase text-slate-900 z-0">
          {company.watermarkText}
        </div>
      )}

      {/* HEADER VARIATIONS */}
      {style === 'modern' && (
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start pb-6 border-b-2" style={{ borderColor: primaryColor }}>
            <div className="flex items-start gap-4">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="h-16 max-w-[180px] object-contain rounded" />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {company.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                  {company.commercialName || company.name}
                </h1>
                {company.slogan && <p className="text-xs text-slate-500 italic mt-0.5">{company.slogan}</p>}
                <div className="text-xs text-slate-600 space-y-0.5 mt-2">
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {company.address}, {company.city} - {company.country}</p>
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {company.phone} {company.phone2 ? `| ${company.phone2}` : ''}</p>
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {company.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0 text-left md:text-right bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase rounded-full text-white tracking-wider mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                {docTitle}
              </span>
              <div className="text-lg font-black text-slate-900 tracking-tight">{docNumber}</div>
              <div className="text-xs text-slate-600 mt-1">Date : <span className="font-semibold text-slate-800">{formatDate(docDate)}</span></div>
              {isQuote && quote?.expiryDate && (
                <div className="text-xs text-slate-600">Validité : <span className="font-semibold text-slate-800">{formatDate(quote.expiryDate)}</span></div>
              )}
              {isInvoice && invoice?.dueDate && (
                <div className="text-xs text-rose-600 font-medium">Échéance : <span className="font-bold">{formatDate(invoice.dueDate)}</span></div>
              )}
            </div>
          </div>
        </div>
      )}

      {style === 'classic' && (
        <div className="relative z-10 border-b border-slate-300 pb-6">
          <div className="flex items-center justify-center gap-4 pb-4 border-b border-dashed border-slate-300">
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="max-h-16 max-w-[140px] object-contain"
              />
            )}
            <div className="text-center">
              <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-wide">{company.name}</h1>
              <p className="text-xs text-slate-500">{company.address} - {company.city}, {company.country} | Tél : {company.phone} | NIF : {company.nif} | RCCM : {company.rccm}</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div>
              <span className="text-xl font-serif font-bold tracking-wider text-slate-900">{docTitle}</span>
              <div className="text-sm font-semibold text-slate-700">N° {docNumber}</div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>Date d'émission : <strong className="text-slate-800">{formatDate(docDate)}</strong></p>
              {isInvoice && invoice?.dueDate && <p>Date d'échéance : <strong className="text-slate-800">{formatDate(invoice.dueDate)}</strong></p>}
            </div>
          </div>
        </div>
      )}

      {style === 'professional' && (
        <div className="relative z-10 bg-slate-900 text-white p-6 -mx-8 -mt-8 md:-mx-12 md:-mt-12 rounded-b-2xl shadow mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center gap-3">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="max-h-12 max-w-[120px] object-contain bg-white rounded-lg p-1 shadow shrink-0"
                />
              ) : (
                <Building2 className="w-9 h-9 text-sky-400" />
              )}
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">{company.commercialName || company.name}</h1>
                <p className="text-xs text-slate-300">{company.slogan || 'Excellence & Performance'}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
              <div className="text-sm font-medium uppercase tracking-widest text-sky-400">{docTitle}</div>
              <div className="text-2xl font-black text-white">{docNumber}</div>
            </div>
          </div>
        </div>
      )}

      {style === 'minimalist' && (
        <div className="relative z-10 pb-6 border-b border-slate-200">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3">
              {company.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="max-h-10 max-w-[100px] object-contain grayscale opacity-90"
                />
              )}
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">{company.name}</h1>
                <p className="text-xs text-slate-400">{company.city}, {company.country}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-mono tracking-widest text-slate-400">{docTitle}</span>
              <div className="text-base font-mono font-bold text-slate-900">{docNumber}</div>
              <div className="text-xs text-slate-500">{formatDate(docDate)}</div>
            </div>
          </div>
        </div>
      )}

      {style === 'elegant' && (
        <div className="relative z-10 pb-6 border-b-2 border-amber-600/40">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {company.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="max-h-14 max-w-[120px] object-contain rounded-md"
                />
              )}
              <div>
                <h1 className="text-2xl font-serif tracking-wide text-amber-950 font-bold">{company.name}</h1>
                <p className="text-xs text-amber-800/80 italic">{company.slogan || company.address}</p>
              </div>
            </div>
            <div className="text-right bg-amber-50/80 p-3 rounded-lg border border-amber-200">
              <div className="text-xs font-serif uppercase tracking-widest text-amber-900 font-bold">{docTitle}</div>
              <div className="text-lg font-serif font-bold text-amber-950">{docNumber}</div>
              <div className="text-xs text-amber-800">Émis le {formatDate(docDate)}</div>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT & TARGET INFO BOX */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 my-6 text-xs">
        {/* Company tax metadata */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wide">Émetteur</div>
          <p><span className="text-slate-500">NIF :</span> <strong className="text-slate-700">{company.nif}</strong></p>
          <p><span className="text-slate-500">RCCM :</span> <strong className="text-slate-700">{company.rccm}</strong></p>
          {company.bankName && (
            <p><span className="text-slate-500">Banque :</span> <strong className="text-slate-700">{company.bankName}</strong></p>
          )}
          {company.iban && (
            <p><span className="text-slate-500">IBAN / Compte :</span> <span className="font-mono text-slate-700">{company.iban}</span></p>
          )}
          {company.swift && (
            <p><span className="text-slate-500">SWIFT :</span> <span className="font-mono text-slate-700">{company.swift}</span></p>
          )}
        </div>

        {/* Client details */}
        {client ? (
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200/70 space-y-1">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">Destinataire / Client</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-mono">{client.code}</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{client.companyName || client.name}</p>
            {client.contactPerson && (
              <p className="text-slate-600"><span className="text-slate-400">Attn :</span> {client.contactPerson} {client.contactRole ? `(${client.contactRole})` : ''}</p>
            )}
            <p className="text-slate-600">{client.address}, {client.city} - {client.country}</p>
            <p className="text-slate-600"><span className="text-slate-400">Tél :</span> {client.phone}</p>
            {client.email && <p className="text-slate-600"><span className="text-slate-400">Email :</span> {client.email}</p>}
            {client.nif && <p className="text-slate-600"><span className="text-slate-400">NIF :</span> {client.nif}</p>}
          </div>
        ) : payment ? (
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1">
            <div className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wide">Détails du Paiement</div>
            <p><span className="text-slate-500">Client :</span> <strong className="text-slate-800">{payment.clientName}</strong></p>
            <p><span className="text-slate-500">Facture réglée :</span> <strong className="text-slate-800">{payment.invoiceNumber}</strong></p>
            <p><span className="text-slate-500">Mode de paiement :</span> <strong className="text-slate-800 uppercase">{payment.paymentMethod}</strong></p>
            {payment.reference && <p><span className="text-slate-500">Référence pièce :</span> <span className="font-mono text-slate-800">{payment.reference}</span></p>}
            {payment.bankName && <p><span className="text-slate-500">Banque émettrice :</span> <span className="text-slate-800">{payment.bankName}</span></p>}
          </div>
        ) : null}
      </div>

      {/* OBJECT / REFERENCE BANNER */}
      {(quote?.object || bl?.orderReference || invoice?.quoteNumber || bl?.quoteNumber) && (
        <div className="relative z-10 bg-slate-100/80 px-4 py-2.5 rounded-lg text-xs mb-6 border border-slate-200 flex flex-wrap gap-4 items-center">
          {quote?.object && (
            <div><span className="font-semibold text-slate-700">Objet :</span> <span className="text-slate-900">{quote.object}</span></div>
          )}
          {bl?.orderReference && (
            <div><span className="font-semibold text-slate-700">Réf. Commande :</span> <span className="font-mono text-slate-900">{bl.orderReference}</span></div>
          )}
          {bl?.quoteNumber && (
            <div><span className="font-semibold text-slate-700">Devis Origine :</span> <span className="font-mono text-sky-700">{bl.quoteNumber}</span></div>
          )}
          {invoice?.quoteNumber && (
            <div><span className="font-semibold text-slate-700">Devis :</span> <span className="font-mono text-slate-800">{invoice.quoteNumber}</span></div>
          )}
          {invoice?.blNumber && (
            <div><span className="font-semibold text-slate-700">Bon de Livraison :</span> <span className="font-mono text-emerald-800 font-semibold">{invoice.blNumber}</span></div>
          )}
          {bl?.driverName && (
            <div><span className="font-semibold text-slate-700">Chauffeur / Livré par :</span> <span className="text-slate-800">{bl.driverName}</span></div>
          )}
        </div>
      )}

      {/* ITEMS TABLE FOR QUOTES, BL & INVOICES */}
      {!isReceipt && (
        <div className="relative z-10 my-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-3">Réf & Désignation</th>
                <th className="py-3 px-3 text-center w-20">Qté</th>
                {isBL && <th className="py-3 px-3 text-center w-20">Qté Livrée</th>}
                <th className="py-3 px-3 text-center w-16">Unité</th>
                {!isBL && <th className="py-3 px-3 text-right w-28">Prix Unit. HT</th>}
                {!isBL && <th className="py-3 px-3 text-right w-32">Montant HT</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{index + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{item.designation}</div>
                    {item.description && <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>}
                    {item.code && <div className="text-[10px] text-slate-400 font-mono mt-0.5">Code: {item.code}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{item.quantity}</td>
                  {isBL && (
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                      {item.quantityDelivered ?? item.quantity}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-center text-slate-600">{item.unit || 'U'}</td>
                  {!isBL && (
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatCurrency(item.unitPrice, currency, company.currencies)}
                    </td>
                  )}
                  {!isBL && (
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.totalHT, currency, company.currencies)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUMMARY TOTALS & WORD AMOUNT */}
      {!isBL && !isReceipt && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 my-6 text-xs items-start">
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">Montant en toutes lettres :</div>
              <p className="text-xs italic text-slate-800 font-medium leading-relaxed">
                « Arrêté le présent document à la somme totale TTC de : <strong className="font-bold">{numberToFrenchWords((data as Quote | Invoice).totalTTC)} {currency}</strong> »
              </p>
            </div>

            {/* Terms and notes */}
            {((data as Quote | Invoice).notes || (data as Quote | Invoice).terms) && (
              <div className="text-[11px] text-slate-500 space-y-1">
                {(data as Quote | Invoice).notes && (
                  <p><strong className="text-slate-700">Notes :</strong> {(data as Quote | Invoice).notes}</p>
                )}
                {(data as Quote | Invoice).terms && (
                  <p><strong className="text-slate-700">Conditions :</strong> {(data as Quote | Invoice).terms}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-800 font-bold">
              <span>Total Brut HT :</span>
              <span className="font-mono">
                {formatCurrency((data as Quote | Invoice).totalHT, currency, company.currencies)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>
                {(data as Quote | Invoice).totalVAT > 0
                  ? `TVA (${(data as Quote | Invoice).vatRate || 16}%) :`
                  : 'TVA (Exonérée / Non applicable) :'}
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {(data as Quote | Invoice).totalVAT > 0
                  ? formatCurrency((data as Quote | Invoice).totalVAT, currency, company.currencies)
                  : '0,00 ' + currency}
              </span>
            </div>
            {invoice?.shippingFee ? (
              <div className="flex justify-between text-slate-600">
                <span>Frais de livraison / Port :</span>
                <span className="font-mono">{formatCurrency(invoice.shippingFee, currency, company.currencies)}</span>
              </div>
            ) : null}

            <div
              className="flex justify-between text-white p-3 rounded-lg font-bold text-sm shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{(data as Quote | Invoice).totalVAT > 0 ? 'TOTAL TTC :' : 'TOTAL HT :'}</span>
              <span className="font-mono text-base">
                {formatCurrency((data as Quote | Invoice).totalTTC, currency, company.currencies)}
              </span>
            </div>

            {invoice && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Montant Déjà Réglé :</span>
                  <span className="font-mono">{formatCurrency(invoice.paidAmount, currency, company.currencies)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-black text-sm">
                  <span>SOLDE RESTANT DÛ :</span>
                  <span className="font-mono">{formatCurrency(invoice.remainingAmount, currency, company.currencies)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECEIPT SUMMARY */}
      {isReceipt && payment && (
        <div className="relative z-10 my-8 p-6 bg-slate-50 rounded-2xl border-2 border-emerald-500/40 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Montant Reçu / Encaissé</div>
            <div className="text-3xl font-black text-slate-900 font-mono mt-1">
              {formatCurrency(payment.amount, currency, company.currencies)}
            </div>
          </div>
          <p className="text-xs italic text-slate-700 max-w-md mx-auto">
            « Arrêté le présent reçu à la somme de : <strong>{numberToFrenchWords(payment.amount)} {currency}</strong> »
          </p>
          <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
            Règlement lié à la facture <strong className="text-slate-900">{payment.invoiceNumber}</strong> du client <strong className="text-slate-900">{payment.clientName}</strong>.
          </div>
        </div>
      )}

      {/* SIGNATURES & STAMPS SECTION */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 mt-6 border-t border-slate-200 text-xs">
        {isBL ? (
          <>
            <div className="text-center p-3 border border-dashed border-slate-300 rounded-xl min-h-[110px] flex flex-col justify-between">
              <span className="font-semibold text-slate-700">Préparé par :</span>
              <span className="text-slate-500 text-[11px] italic">{bl?.preparedBy || 'Service Logistique'}</span>
              <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-400">Date & Signature</div>
            </div>
            <div className="text-center p-3 border border-dashed border-slate-300 rounded-xl min-h-[110px] flex flex-col justify-between">
              <span className="font-semibold text-slate-700">Transporteur / Livré par :</span>
              <span className="text-slate-500 text-[11px] italic">{bl?.driverName || bl?.carrier || 'Flotte Atlas'}</span>
              <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-400">Date & Signature</div>
            </div>
            <div className="text-center p-3 border border-dashed border-slate-300 rounded-xl min-h-[110px] flex flex-col justify-between">
              <span className="font-semibold text-slate-700">Reçu et Conforme (Client) :</span>
              <span className="text-slate-500 text-[11px] italic">Cachet & Signature Client</span>
              <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-400">Date : .... / .... / 2026</div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center p-3 border border-dashed border-slate-300 rounded-xl min-h-[110px] flex flex-col justify-between">
              <span className="font-semibold text-slate-700">Pour le Client (Bon pour accord) :</span>
              <span className="text-slate-400 text-[11px] italic">Date, Signature & Cachet</span>
              <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-400">Mention « Bon pour accord »</div>
            </div>

            <div className="text-center p-3 border border-dashed border-slate-300 rounded-xl min-h-[110px] flex flex-col justify-between">
              <span className="font-semibold text-slate-700">Direction Commerciale :</span>
              <div className="my-1 flex items-center justify-center">
                {company.stampUrl ? (
                  <img src={company.stampUrl} alt="Cachet" className="h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                    Cachet
                  </div>
                )}
              </div>
              <div className="text-[11px] font-bold text-slate-800">{company.managerName}</div>
            </div>

            <div className="text-center p-3 border border-dashed border-slate-300 rounded-xl min-h-[110px] flex flex-col justify-between">
              <span className="font-semibold text-slate-700">Signature Autorisée :</span>
              <div className="my-1 flex items-center justify-center">
                {company.signatureUrl ? (
                  <img src={company.signatureUrl} alt="Signature" className="h-10 object-contain" />
                ) : (
                  <span className="font-serif italic text-sm text-sky-800">{company.managerName}</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">{company.managerRole}</div>
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="relative z-10 mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">{company.legalNotice}</p>
        <p>
          {company.name} — Siège : {company.address}, {company.city} — Tél : {company.phone} — Email : {company.email}
          {company.website ? ` — Web : ${company.website}` : ''}
        </p>
        <p className="text-[9px] text-slate-400">Document édité et certifié par GestCom Pro</p>
      </div>
    </div>
  );
};
