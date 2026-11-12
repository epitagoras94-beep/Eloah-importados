import { useState, useMemo } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  CreditCard,
  User,
  Sparkles,
  Download,
} from 'lucide-react';
import { PaymentLog, AppSettings } from '../types';
import { formatBrl, formatDateBr } from '../utils/currency';

interface PaymentHistoryTabProps {
  payments: PaymentLog[];
  settings: AppSettings;
}

export function PaymentHistoryTab({ payments, settings }: PaymentHistoryTabProps) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const matchesSearch =
        pay.customerName.toLowerCase().includes(search.toLowerCase()) ||
        pay.perfumeSummary.toLowerCase().includes(search.toLowerCase()) ||
        (pay.notes && pay.notes.toLowerCase().includes(search.toLowerCase()));

      const matchesMethod = methodFilter === 'all' || pay.paymentMethod === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [payments, search, methodFilter]);

  const totalCollected = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const handleCopyReceipt = (pay: PaymentLog) => {
    const text = `*COMPROVANTE DE PAGAMENTO* 🧾\n\n*Estabelecimento:* ${settings.storeName || 'Eloah Importados'}\n*Cliente:* ${pay.customerName}\n*Referência:* ${pay.installmentInfo} - ${pay.perfumeSummary}\n*Valor Pago:* ${formatBrl(pay.amount)}\n*Data:* ${formatDateBr(pay.paidDate)}\n*Forma de Pagamento:* ${pay.paymentMethod}\n*Status:* Liquidado com sucesso ✅\n\nAgradecemos pela preferência e confiança! ✨`;

    navigator.clipboard.writeText(text);
    setCopiedId(pay.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-neutral-100">
                Histórico de Pagamentos Recebidos
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Registro completo de todas as entradas financeiras, baixas de parcelas e entradas à vista
            </p>
          </div>

          <div className="bg-neutral-950/80 border border-emerald-500/30 rounded-xl px-4 py-3 text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Total Arrecadado em Caixa
            </span>
            <span className="font-mono text-2xl font-bold text-emerald-400">
              {formatBrl(totalCollected)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, perfume ou observações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-neutral-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">
            Forma:
          </span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-neutral-950 text-neutral-300 text-xs border border-neutral-800 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as formas</option>
            <option value="PIX">PIX</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400 space-y-2">
          <History className="w-12 h-12 text-neutral-600 mx-auto" />
          <p className="text-sm font-semibold">Nenhum pagamento registrado ainda.</p>
          <p className="text-xs text-neutral-500">
            Quando você der baixa em uma parcela ou receber uma entrada, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Perfume & Parcela</th>
                  <th className="py-3 px-3 text-center">Forma</th>
                  <th className="py-3 px-4 text-right">Valor Pago</th>
                  <th className="py-3 px-4 text-center">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-neutral-850/60 transition">
                    <td className="py-3.5 px-4 font-mono text-neutral-300 whitespace-nowrap">
                      {formatDateBr(pay.paidDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-neutral-200">{pay.customerName}</p>
                      {pay.customerPhone && (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {pay.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-neutral-200 font-medium">{pay.perfumeSummary}</p>
                      <span className="text-[11px] text-amber-400 font-semibold">
                        {pay.installmentInfo}
                      </span>
                      {pay.notes && (
                        <p className="text-[10px] text-neutral-400 italic mt-0.5">
                          "{pay.notes}"
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {pay.paymentMethod || 'PIX'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm font-bold text-emerald-400 whitespace-nowrap">
                      {formatBrl(pay.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleCopyReceipt(pay)}
                        title="Copiar texto do comprovante para mandar ao cliente"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-300 text-[11px] font-medium transition"
                      >
                        {copiedId === pay.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Comprovante</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
