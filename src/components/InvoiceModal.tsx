import { useState } from 'react';
import { X, Receipt, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatBrl, formatUsd } from '../utils/currency';
import { INVOICE_RECEIPT_IMAGE_PATH, INITIAL_PERFUMES } from '../data/initialData';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dollarRate: number;
}

export function InvoiceModal({ isOpen, onClose, dollarRate }: InvoiceModalProps) {
  const [showFullImage, setShowFullImage] = useState(false);

  if (!isOpen) return null;

  const totalUsd = 460.91;
  const totalBrl = totalUsd * dollarRate;
  const totalQuantity = INITIAL_PERFUMES.reduce((sum, p) => sum + p.initialStockQuantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-4xl w-full shadow-2xl p-5 sm:p-7 text-neutral-100 relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-amber-200">
                Nota de Compra dos Perfumes Árabes
              </h3>
              <p className="text-xs text-neutral-400">
                Pedido 470682-3 • DEP 01 PACOTE 2 • Cascavel (Importação)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Photo + Itemized Breakdown */}
        <div className="overflow-y-auto pr-1 py-4 space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Total de Frascos
              </span>
              <p className="font-mono text-xl font-bold text-amber-300 mt-0.5">
                {totalQuantity} itens
              </p>
              <span className="text-[10px] text-neutral-400">13 fragrâncias importadas</span>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Total Pago (USD)
              </span>
              <p className="font-mono text-xl font-bold text-neutral-100 mt-0.5">
                {formatUsd(totalUsd)}
              </p>
              <span className="text-[10px] text-neutral-400">Condição: À vista</span>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Câmbio Aplicado
              </span>
              <p className="font-mono text-xl font-bold text-amber-400 mt-0.5">
                $1 = {formatBrl(dollarRate)}
              </p>
              <span className="text-[10px] text-neutral-400">Conversão automática</span>
            </div>

            <div className="bg-neutral-950/70 border border-emerald-500/30 rounded-xl p-3 bg-gradient-to-br from-emerald-950/20 to-neutral-950">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Custo Total (BRL)
              </span>
              <p className="font-mono text-xl font-bold text-emerald-400 mt-0.5">
                {formatBrl(totalBrl)}
              </p>
              <span className="text-[10px] text-emerald-400/80">Capital total investido</span>
            </div>
          </div>

          {/* Photo & Table Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Photo column */}
            <div className="lg:col-span-4 bg-neutral-950 rounded-xl p-3 border border-neutral-800 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-semibold text-neutral-300">Foto do Cupom Original</span>
                <button
                  onClick={() => setShowFullImage(!showFullImage)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{showFullImage ? 'Reduzir' : 'Expandir'}</span>
                </button>
              </div>

              <div
                onClick={() => setShowFullImage(!showFullImage)}
                className={`relative rounded-lg overflow-hidden border border-neutral-800 cursor-pointer group transition-all duration-300 ${
                  showFullImage ? 'max-h-[500px]' : 'max-h-72'
                }`}
              >
                <img
                  src={INVOICE_RECEIPT_IMAGE_PATH}
                  alt="Comprovante de compra de perfumes árabes"
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-transparent transition-colors flex items-end p-2">
                  <span className="text-[10px] bg-neutral-900/80 text-neutral-200 px-2 py-0.5 rounded backdrop-blur-sm">
                    Clique para {showFullImage ? 'reduzir' : 'ampliar'}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-neutral-400 text-center">
                Cupom emitido com itens conferidos e adicionados automaticamente ao seu estoque.
              </div>
            </div>

            {/* Table column */}
            <div className="lg:col-span-8 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Itens da Nota Cadastrados no Estoque
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Todos 25 itens importados
                </span>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/90 text-neutral-400 font-semibold sticky top-0 border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Perfume</th>
                      <th className="py-2.5 px-2 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Unit. ($)</th>
                      <th className="py-2.5 px-3 text-right">Unit. (R$)</th>
                      <th className="py-2.5 px-3 text-right">Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {INITIAL_PERFUMES.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-900/40 transition">
                        <td className="py-2.5 px-3 font-mono text-neutral-400 text-[11px]">
                          {item.code}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-neutral-200">{item.name}</p>
                          <span className="text-[10px] text-neutral-400">{item.brand}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400">
                          {item.initialStockQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-300">
                          {formatUsd(item.costUsd)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300">
                          {formatBrl(item.costUsd * dollarRate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-200">
                          {formatUsd(item.costUsd * item.initialStockQuantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-900/90 font-bold border-t border-neutral-700">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 text-right uppercase text-neutral-300">
                        Totais da Nota:
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-amber-400 text-sm">
                        25
                      </td>
                      <td></td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm">
                        {formatBrl(totalBrl)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-neutral-100 text-sm">
                        {formatUsd(totalUsd)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
