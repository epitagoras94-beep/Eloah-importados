import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Send,
  Copy,
  Check,
  Calendar,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Sale, Installment, AppSettings } from '../types';
import { formatBrl, formatDateBr } from '../utils/currency';
import { generateSaleConfirmationMessage, openWhatsApp } from '../utils/whatsapp';

interface SaleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  installments: Installment[];
  settings: AppSettings;
  onUpdateDueDate?: (installmentId: string, newDueDate: string) => void;
}

export function SaleConfirmationModal({
  isOpen,
  onClose,
  sale,
  installments,
  settings,
  onUpdateDueDate,
}: SaleConfirmationModalProps) {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !sale) return;
    setMessage(generateSaleConfirmationMessage(sale, installments, settings));
    setCopied(false);
  }, [isOpen, sale, installments, settings]);

  if (!isOpen || !sale) return null;

  const sortedInstallments = [...installments].sort(
    (a, b) => a.installmentNumber - b.installmentNumber
  );

  const isPaidInFull =
    sale.isCashSale ||
    sale.status === 'Quitado' ||
    sortedInstallments.length === 0 ||
    sale.downPaymentBrl >= sale.totalSellingPriceBrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    openWhatsApp(sale.customerPhone, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-emerald-500/35 rounded-2xl max-w-lg w-full shadow-2xl p-5 sm:p-6 text-neutral-100 relative max-h-[92vh] flex flex-col my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="pr-6">
            <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-emerald-300">
              Venda #{String(sale.saleNumber).padStart(3, '0')} Finalizada!
            </h3>
            <p className="text-xs text-neutral-400">
              Envie a confirmação da compra para <strong className="text-neutral-200">{sale.customerName}</strong>
            </p>
          </div>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Payment Summary Box */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                  Total da Compra
                </span>
                <span className="font-mono text-lg font-bold text-neutral-100">
                  {formatBrl(sale.totalSellingPriceBrl)}
                </span>
              </div>

              {isPaidInFull ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>À Vista • {sale.paymentMethod || 'PIX'}</span>
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Parcelado em {sortedInstallments.length}x</span>
                </span>
              )}
            </div>

            {isPaidInFull ? (
              <p className="text-xs text-emerald-400/90 bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-3 py-2">
                Compra quitada integralmente na modalidade <strong>{sale.paymentMethod || 'PIX'}</strong> na data {formatDateBr(sale.saleDate)}.
              </p>
            ) : (
              <div className="space-y-2 pt-2.5 border-t border-neutral-800">
                {sale.downPaymentBrl > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold pb-1">
                    <span>Entrada paga ({sale.paymentMethod || 'PIX'}):</span>
                    <span className="font-mono">{formatBrl(sale.downPaymentBrl)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Datas de Vencimento:
                  </span>
                  {onUpdateDueDate && (
                    <span className="text-[10px] text-amber-400/80">
                      Toque na data para editar
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sortedInstallments.map((inst) => (
                    <div
                      key={inst.id}
                      className="flex flex-col gap-1.5 bg-neutral-900 px-3 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                          <span>Parcela {inst.installmentNumber}/{inst.totalInstallments}</span>
                          {inst.status === 'Pago' && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                              Pago
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                          {formatBrl(inst.amount)}
                        </span>
                      </div>

                      {onUpdateDueDate ? (
                        <div className="relative flex items-center justify-between gap-2 h-8 px-2.5 rounded-lg bg-neutral-950 border border-neutral-700 hover:border-amber-500/60 focus-within:border-amber-500/70 transition cursor-pointer group">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-100 group-hover:text-amber-200 transition">
                            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{formatDateBr(inst.dueDate)}</span>
                          </div>
                          <span className="text-[10px] text-amber-400/80 group-hover:text-amber-300 font-medium">
                            Alterar
                          </span>
                          <input
                            type="date"
                            aria-label={`Alterar vencimento da parcela ${inst.installmentNumber}`}
                            value={inst.dueDate}
                            onClick={(e) => {
                              try {
                                (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                              } catch {
                                // Fallback to native browser date picker behavior
                              }
                            }}
                            onChange={(e) => {
                              if (e.target.value) {
                                onUpdateDueDate(inst.id, e.target.value);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [color-scheme:dark]"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-neutral-200">
                          Vencimento: {formatDateBr(inst.dueDate)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Editable Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Mensagem de Confirmação (WhatsApp):
              </label>
              {!sale.customerPhone && (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Sem telefone (escolherá o contato no WhatsApp)
                </span>
              )}
            </div>
            <textarea
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[155px] resize-y bg-neutral-950 border border-neutral-800 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-neutral-200 leading-relaxed focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 mt-3 border-t border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-500/20 active:scale-95 transition"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>Enviar no WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold whitespace-nowrap transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
