import { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare, AlertCircle, MapPin } from 'lucide-react';
import { Installment, AppSettings } from '../types';
import { generateWhatsAppMessage, openWhatsApp, WhatsAppMessageType } from '../utils/whatsapp';
import { formatBrl, formatDateBr, getInstallmentUrgency } from '../utils/currency';

interface WhatsAppCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  settings: AppSettings;
}

export function WhatsAppCollectionModal({
  isOpen,
  onClose,
  installment,
  settings,
}: WhatsAppCollectionModalProps) {
  if (!isOpen || !installment) return null;

  const urgency = getInstallmentUrgency(installment.dueDate, installment.status === 'Pago');

  // Determine default template based on status
  const defaultTemplate: WhatsAppMessageType =
    installment.status === 'Pago'
      ? 'recibo'
      : urgency.status === 'Atrasado'
      ? 'atrasado'
      : urgency.status === 'Hoje'
      ? 'vence_hoje'
      : 'lembrete';

  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppMessageType>(defaultTemplate);
  const [customMessage, setCustomMessage] = useState<string>(() =>
    generateWhatsAppMessage(installment, settings, defaultTemplate)
  );
  const [copied, setCopied] = useState(false);

  const handleTemplateChange = (type: WhatsAppMessageType) => {
    setSelectedTemplate(type);
    setCustomMessage(generateWhatsAppMessage(installment, settings, type));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    openWhatsApp(installment.customerPhone, customMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-lg w-full shadow-2xl p-5 sm:p-6 text-neutral-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-lg font-bold text-neutral-100">
              Cobrança via WhatsApp
            </h3>
            <p className="text-xs text-neutral-400">
              Envio rápido com dados do perfume, valor e chave PIX
            </p>
          </div>
        </div>

        {/* Client & Installment Mini Badge */}
        <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-800 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-200">{installment.customerName}</h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                {installment.perfumeSummary} • Parcela {installment.installmentNumber} de {installment.totalInstallments}
              </p>
              <p className="text-xs text-amber-400/90 font-mono mt-0.5 font-semibold">
                Tel: {installment.customerPhone || 'Sem telefone informado'}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-bold text-emerald-400 block">
                {formatBrl(installment.amount)}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${urgency.badgeClass}`}>
                {urgency.label} ({formatDateBr(installment.dueDate)})
              </span>
            </div>
          </div>

          {installment.customerAddress && (
            <div className="pt-2 border-t border-neutral-850 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-300 truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{installment.customerAddress}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(installment.customerAddress!)}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
                className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 shrink-0 transition"
              >
                <span>Google Maps ↗</span>
              </button>
            </div>
          )}
        </div>

        {/* Template Selector Buttons */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
            Escolha o Modelo de Mensagem:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleTemplateChange('lembrete')}
              className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition ${
                selectedTemplate === 'lembrete'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              ⏳ Preventivo
            </button>
            <button
              type="button"
              onClick={() => handleTemplateChange('vence_hoje')}
              className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition ${
                selectedTemplate === 'vence_hoje'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              📅 Vence Hoje
            </button>
            <button
              type="button"
              onClick={() => handleTemplateChange('atrasado')}
              className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition ${
                selectedTemplate === 'atrasado'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              🚨 Em Atraso
            </button>
            <button
              type="button"
              onClick={() => handleTemplateChange('recibo')}
              className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition ${
                selectedTemplate === 'recibo'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              ✅ Recibo Pago
            </button>
          </div>
        </div>

        {/* Message preview / editable textarea */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Mensagem a ser enviada:
            </label>
            <button
              onClick={handleCopy}
              className="text-xs text-neutral-400 hover:text-amber-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiada!' : 'Copiar Texto'}</span>
            </button>
          </div>
          <textarea
            rows={7}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/50 rounded-xl p-3 text-xs text-neutral-200 leading-relaxed font-sans focus:outline-none resize-none"
          />
          {!settings.pixKey && (
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Dica: Cadastre sua chave PIX nas Configurações para aparecer no texto.</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs sm:text-sm font-semibold transition"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-neutral-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
          >
            <Send className="w-4 h-4" />
            <span>Abrir no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
