import { useState } from 'react';
import { X, CheckCircle, DollarSign, Calendar, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Installment, AppSettings } from '../types';
import { formatBrl, getTodayDateString } from '../utils/currency';
import { generateWhatsAppMessage, openWhatsApp } from '../utils/whatsapp';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  settings: AppSettings;
  onConfirm: (
    installmentId: string,
    paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Transferência' | 'Outro',
    paidDate: string,
    paidAmount?: number,
    notes?: string
  ) => void;
}

export function ReceivePaymentModal({
  isOpen,
  onClose,
  installment,
  settings,
  onConfirm,
}: ReceivePaymentModalProps) {
  if (!isOpen || !installment) return null;

  const [paidAmount, setPaidAmount] = useState<number>(installment.amount);
  const [paidDate, setPaidDate] = useState<string>(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Transferência' | 'Outro'>('PIX');
  const [notes, setNotes] = useState<string>('');
  const [sendWhatsAppReceipt, setSendWhatsAppReceipt] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#fbbf24', '#34d399'],
      });
    } catch {
      // ignore
    }

    onConfirm(installment.id, paymentMethod, paidDate, paidAmount, notes);

    if (sendWhatsAppReceipt && installment.customerPhone) {
      const msg = generateWhatsAppMessage(
        {
          ...installment,
          amount: paidAmount,
          status: 'Pago',
        },
        settings,
        'recibo'
      );
      setTimeout(() => {
        openWhatsApp(installment.customerPhone, msg);
      }, 300);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl max-w-md w-full shadow-2xl p-5 sm:p-6 text-neutral-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-lg font-bold text-emerald-300">
              Receber Parcela / Dar Baixa
            </h3>
            <p className="text-xs text-neutral-400">
              Registre a entrada financeira no histórico
            </p>
          </div>
        </div>

        {/* Customer & Info Card */}
        <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-800 mb-4">
          <p className="text-xs font-semibold text-neutral-400">Cliente:</p>
          <p className="text-sm font-bold text-neutral-200">{installment.customerName}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-850 text-xs">
            <span className="text-neutral-400">
              {installment.perfumeSummary} ({installment.installmentNumber}/{installment.totalInstallments})
            </span>
            <span className="font-mono font-bold text-amber-400">
              Valor Original: {formatBrl(installment.amount)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Valor Recebido (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-950 border border-neutral-750 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-base font-mono font-bold text-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Data do Pagamento</span>
              </label>
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-750 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-neutral-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                <span>Forma de Pagamento</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-750 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-neutral-200 focus:outline-none"
              >
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Transferência">Transferência</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Observação (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pago via PIX pelo celular da filha"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {installment.customerPhone && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={sendWhatsAppReceipt}
                onChange={(e) => setSendWhatsAppReceipt(e.target.checked)}
                className="rounded text-emerald-500 bg-neutral-950 border-neutral-700"
              />
              <span className="text-xs text-neutral-300">
                Enviar comprovante de confirmação no WhatsApp do cliente após salvar
              </span>
            </label>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs sm:text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              Confirmar Recebimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
