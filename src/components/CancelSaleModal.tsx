import { useState } from 'react';
import { X, AlertTriangle, RotateCcw, PackageCheck, Ban } from 'lucide-react';
import { Sale } from '../types';
import { formatBrl, formatDateBr } from '../utils/currency';

interface CancelSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onConfirmCancel: (saleId: string, restoreStock: boolean) => void;
}

export function CancelSaleModal({
  isOpen,
  onClose,
  sale,
  onConfirmCancel,
}: CancelSaleModalProps) {
  const [restoreStock, setRestoreStock] = useState(true);

  if (!isOpen || !sale) return null;

  const totalBottles = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirm = () => {
    onConfirmCancel(sale.id, restoreStock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-rose-500/30 rounded-2xl max-w-lg w-full shadow-2xl p-5 sm:p-6 text-neutral-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-lg font-bold text-rose-200">
              Cancelar Venda #{String(sale.saleNumber).padStart(3, '0')}
            </h3>
            <p className="text-xs text-neutral-400">
              Cliente: <strong className="text-neutral-200">{sale.customerName}</strong>
            </p>
          </div>
        </div>

        {/* Sale Summary Box */}
        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Data da Venda:</span>
            <span className="text-neutral-200 font-medium">{formatDateBr(sale.saleDate)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Valor Total da Venda:</span>
            <span className="font-mono font-bold text-neutral-100 text-sm">{formatBrl(sale.totalSellingPriceBrl)}</span>
          </div>

          <div className="pt-2 border-t border-neutral-850">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Perfumes na Venda ({totalBottles} frasco{totalBottles > 1 ? 's' : ''}):
            </span>
            <div className="space-y-1">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-neutral-300">
                  <span>• {item.perfumeName}</span>
                  <span className="font-mono text-amber-400 font-bold">{item.quantity} un</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Restore Option */}
        <div
          onClick={() => setRestoreStock(!restoreStock)}
          className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 mb-5 cursor-pointer hover:border-neutral-700 transition flex items-start gap-3"
        >
          <div
            className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition shrink-0 ${
              restoreStock
                ? 'bg-amber-500 border-amber-500 text-neutral-950'
                : 'border-neutral-700 bg-neutral-900'
            }`}
          >
            {restoreStock && <span className="text-xs font-black">✓</span>}
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-200 cursor-pointer select-none flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-amber-400" />
              <span>Devolver frascos ao estoque de perfumes (+{totalBottles} un)</span>
            </label>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Os perfumes desta venda serão somados de volta ao seu estoque imediatamente.
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-rose-950/25 border border-rose-500/30 rounded-xl p-3 mb-5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-300 leading-relaxed">
            Ao cancelar, as parcelas pendentes desta venda serão retiradas do seu contas a receber. Esta ação atualizará seus relatórios de lucro.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs sm:text-sm font-semibold transition"
          >
            Voltar / Não Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-[1.4] py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-neutral-100 text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition"
          >
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  );
}
