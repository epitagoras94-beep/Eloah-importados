import { useState } from 'react';
import { X, DollarSign, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { formatBrl } from '../utils/currency';

interface DollarRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRate: number;
  onSave: (newRate: number, applyToAllInventory: boolean) => void;
}

export function DollarRateModal({
  isOpen,
  onClose,
  currentRate,
  onSave,
}: DollarRateModalProps) {
  const [rateInput, setRateInput] = useState<string>(currentRate.toFixed(2));
  const [applyToInventory, setApplyToInventory] = useState(true);

  if (!isOpen) return null;

  const parsedRate = parseFloat(rateInput.replace(',', '.')) || 0;
  const sampleUsd = 20.02;
  const sampleBrl = parsedRate > 0 ? sampleUsd * parsedRate : 0;
  const totalInvoiceUsd = 460.91;
  const totalInvoiceBrl = parsedRate > 0 ? totalInvoiceUsd * parsedRate : 0;

  const handleSave = () => {
    if (parsedRate > 0) {
      onSave(parsedRate, applyToInventory);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-md w-full shadow-2xl p-6 text-neutral-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-lg font-bold text-amber-200">
              Cotação do Dólar da Compra
            </h3>
            <p className="text-xs text-neutral-400">
              Conversão automática de USD para Real (BRL)
            </p>
          </div>
        </div>

        <div className="bg-neutral-950/70 rounded-xl p-4 border border-neutral-800 mb-5">
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
            Valor do Dólar no dia do Pagamento (R$)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min="0.1"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full bg-neutral-900 border border-amber-500/40 rounded-xl py-3 pl-11 pr-4 text-xl font-mono font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="5.50"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Na sua nota de Cascavel, a cotação utilizada foi <strong>R$ 5,50</strong>.</span>
          </p>
        </div>

        {/* Live Simulation Preview */}
        <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-850 space-y-3 mb-5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 block">
            Simulação de Conversão Automática
          </span>

          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Perfume $20.02 (Ex: Fakhar Lattafa):</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-neutral-300">$20.02</span>
              <ArrowRight className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-bold">{formatBrl(sampleBrl)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-850">
            <span className="text-neutral-400">Custo Total da Nota ($460.91):</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-neutral-300">$460.91</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold text-sm">{formatBrl(totalInvoiceBrl)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 mb-6 cursor-pointer" onClick={() => setApplyToInventory(!applyToInventory)}>
          <div
            className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition ${
              applyToInventory
                ? 'bg-amber-500 border-amber-500 text-neutral-950'
                : 'border-neutral-700 bg-neutral-800'
            }`}
          >
            {applyToInventory && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
          <label className="text-xs text-neutral-300 cursor-pointer select-none">
            Atualizar automaticamente o custo em Reais de <strong>todos os perfumes cadastrados no estoque</strong> com essa nova taxa
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-sm font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={parsedRate <= 0}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-neutral-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition"
          >
            Aplicar Câmbio
          </button>
        </div>
      </div>
    </div>
  );
}
