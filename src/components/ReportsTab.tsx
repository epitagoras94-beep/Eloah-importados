import { useMemo, useState } from 'react';
import {
  TrendingUp,
  Wallet,
  PieChart,
  BarChart3,
  Calendar,
  Sparkles,
  Award,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  DollarSign,
  Download,
} from 'lucide-react';
import { Perfume, Sale, Installment, PaymentLog, AppSettings } from '../types';
import { formatBrl, formatUsd, formatPercent } from '../utils/currency';

interface ReportsTabProps {
  perfumes: Perfume[];
  sales: Sale[];
  installments: Installment[];
  payments: PaymentLog[];
  settings: AppSettings;
  openInvoiceModal: () => void;
}

export function ReportsTab({
  perfumes,
  sales,
  installments,
  payments,
  settings,
  openInvoiceModal,
}: ReportsTabProps) {
  const [reportView, setReportView] = useState<'monthly' | 'individual' | 'investment'>('monthly');

  // Initial purchase investment from the receipt
  const initialCostUsd = 460.91;
  const initialCostBrl = initialCostUsd * settings.dollarRate;

  // Monthly Profit Analysis
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      {
        monthLabel: string;
        yearMonth: string;
        grossSales: number;
        costOfGoodsSold: number;
        profit: number;
        salesCount: number;
        cashCollected: number;
        dueToCollect: number;
      }
    >();

    const getMonthKey = (dateStr: string) => {
      if (!dateStr) return 'Outros';
      const [year, month] = dateStr.split('-');
      return `${year}-${month}`;
    };

    const formatMonthLabel = (yearMonth: string) => {
      const parts = yearMonth.split('-');
      if (parts.length !== 2) return yearMonth;
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${monthNames[mIdx] || parts[1]} / ${parts[0]}`;
    };

    // Sales by month
    sales.forEach((s) => {
      const key = getMonthKey(s.saleDate);
      if (!map.has(key)) {
        map.set(key, {
          monthLabel: formatMonthLabel(key),
          yearMonth: key,
          grossSales: 0,
          costOfGoodsSold: 0,
          profit: 0,
          salesCount: 0,
          cashCollected: 0,
          dueToCollect: 0,
        });
      }
      const item = map.get(key)!;
      item.grossSales += s.totalSellingPriceBrl;
      item.costOfGoodsSold += s.totalCostBrl;
      item.profit += s.totalProfitBrl;
      item.salesCount += 1;
    });

    // Payments collected by month
    payments.forEach((p) => {
      const key = getMonthKey(p.paidDate);
      if (!map.has(key)) {
        map.set(key, {
          monthLabel: formatMonthLabel(key),
          yearMonth: key,
          grossSales: 0,
          costOfGoodsSold: 0,
          profit: 0,
          salesCount: 0,
          cashCollected: 0,
          dueToCollect: 0,
        });
      }
      map.get(key)!.cashCollected += p.amount;
    });

    // Pending installments due by month
    installments.forEach((inst) => {
      if (inst.status !== 'Pago') {
        const key = getMonthKey(inst.dueDate);
        if (!map.has(key)) {
          map.set(key, {
            monthLabel: formatMonthLabel(key),
            yearMonth: key,
            grossSales: 0,
            costOfGoodsSold: 0,
            profit: 0,
            salesCount: 0,
            cashCollected: 0,
            dueToCollect: 0,
          });
        }
        map.get(key)!.dueToCollect += inst.amount;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
  }, [sales, payments, installments]);

  // Individual Margins per Perfume
  const individualMargins = useMemo(() => {
    return perfumes.map((p) => {
      const unitProfit = p.sellingPriceBrl - p.costBrl;
      const marginPercent = p.sellingPriceBrl > 0 ? (unitProfit / p.sellingPriceBrl) * 100 : 0;
      const markupPercent = p.costBrl > 0 ? (unitProfit / p.costBrl) * 100 : 0;

      // Count sold in sales
      let soldCount = 0;
      let totalProfitGenerated = 0;

      sales.forEach((s) => {
        const item = s.items.find((i) => i.perfumeId === p.id);
        if (item) {
          soldCount += item.quantity;
          totalProfitGenerated += item.totalProfitBrl;
        }
      });

      return {
        ...p,
        unitProfit,
        marginPercent,
        markupPercent,
        soldCount,
        totalProfitGenerated,
      };
    }).sort((a, b) => b.unitProfit - a.unitProfit);
  }, [perfumes, sales]);

  // Overall Financial Investment ROI
  const investmentOverview = useMemo(() => {
    const totalGrossSales = sales.reduce((sum, s) => sum + s.totalSellingPriceBrl, 0);
    const totalRealizedProfit = sales.reduce((sum, s) => sum + s.totalProfitBrl, 0);
    const totalCashCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    const remainingStockValue = perfumes.reduce(
      (sum, p) => sum + p.sellingPriceBrl * p.stockQuantity,
      0
    );
    const remainingStockCost = perfumes.reduce(
      (sum, p) => sum + p.costBrl * p.stockQuantity,
      0
    );
    const remainingStockProfit = remainingStockValue - remainingStockCost;

    const projectedTotalRevenue = totalGrossSales + remainingStockValue;
    const projectedTotalProfit = totalRealizedProfit + remainingStockProfit;
    const projectedRoi = initialCostBrl > 0 ? (projectedTotalProfit / initialCostBrl) * 100 : 0;

    return {
      totalGrossSales,
      totalRealizedProfit,
      totalCashCollected,
      remainingStockValue,
      remainingStockCost,
      remainingStockProfit,
      projectedTotalRevenue,
      projectedTotalProfit,
      projectedRoi,
    };
  }, [sales, payments, perfumes, initialCostBrl]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/20 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-neutral-100">
                Relatórios Automáticos de Lucro & Margem
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Análise de lucratividade mensal, margem individual por perfume e retorno do capital investido
            </p>
          </div>

          <button
            onClick={openInvoiceModal}
            className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-750 hover:border-amber-500/40 text-xs text-neutral-300 hover:text-amber-300 font-semibold flex items-center gap-2 transition"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Ver Nota Original ($460,91)</span>
          </button>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-neutral-800">
          <button
            onClick={() => setReportView('monthly')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              reportView === 'monthly'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-850'
            }`}
          >
            📅 Lucro Mensal Realizado
          </button>
          <button
            onClick={() => setReportView('individual')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              reportView === 'individual'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-850'
            }`}
          >
            🧴 Margem Individual por Perfume
          </button>
          <button
            onClick={() => setReportView('investment')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              reportView === 'investment'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-850'
            }`}
          >
            💰 Balanço do Investimento (ROI)
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTHLY PROFIT REPORT */}
      {reportView === 'monthly' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Faturamento Bruto Total
              </span>
              <p className="font-mono text-2xl font-bold text-neutral-100 mt-1">
                {formatBrl(investmentOverview.totalGrossSales)}
              </p>
              <span className="text-xs text-neutral-400">Total vendido em todas as vendas</span>
            </div>

            <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-5 bg-gradient-to-br from-emerald-950/20 to-neutral-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Lucro Bruto Realizado
              </span>
              <p className="font-mono text-2xl font-bold text-emerald-400 mt-1">
                {formatBrl(investmentOverview.totalRealizedProfit)}
              </p>
              <span className="text-xs text-emerald-400/80">
                Margem média:{' '}
                {investmentOverview.totalGrossSales > 0
                  ? (
                      (investmentOverview.totalRealizedProfit /
                        investmentOverview.totalGrossSales) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Recebido Efetivamente em Caixa
              </span>
              <p className="font-mono text-2xl font-bold text-amber-400 mt-1">
                {formatBrl(investmentOverview.totalCashCollected)}
              </p>
              <span className="text-xs text-neutral-400">Pagamentos e entradas já liquidados</span>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-luxury text-base font-bold text-neutral-100">
                  Demonstrativo de Lucro por Mês
                </h3>
              </div>
            </div>

            {monthlyData.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">
                Nenhum dado mensal registrado ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Mês</th>
                      <th className="py-3 px-3 text-center">Vendas</th>
                      <th className="py-3 px-4 text-right">Faturamento</th>
                      <th className="py-3 px-4 text-right">Custo Mercadoria</th>
                      <th className="py-3 px-4 text-right">Lucro Bruto</th>
                      <th className="py-3 px-3 text-right">Margem %</th>
                      <th className="py-3 px-4 text-right">Recebido em Caixa</th>
                      <th className="py-3 px-4 text-right">A Receber no Mês</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {monthlyData.map((m) => {
                      const margin = m.grossSales > 0 ? (m.profit / m.grossSales) * 100 : 0;
                      return (
                        <tr key={m.yearMonth} className="hover:bg-neutral-850/60 transition">
                          <td className="py-3.5 px-4 font-bold text-neutral-200">
                            {m.monthLabel}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-neutral-400">
                            {m.salesCount}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-200">
                            {formatBrl(m.grossSales)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-neutral-400">
                            {formatBrl(m.costOfGoodsSold)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                            +{formatBrl(m.profit)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-300">
                            {margin.toFixed(1)}%
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                            {formatBrl(m.cashCollected)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-neutral-400">
                            {formatBrl(m.dueToCollect)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: INDIVIDUAL MARGIN PER PERFUME */}
      {reportView === 'individual' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif-luxury text-base font-bold text-neutral-100">
                Margem de Ganho Individual por Perfume
              </h3>
              <p className="text-xs text-neutral-400">
                Ordenado pelos perfumes que mais geram lucro líquido por unidade
              </p>
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              Dólar: $1 = {formatBrl(settings.dollarRate)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Ranking</th>
                  <th className="py-3 px-4">Perfume & Marca</th>
                  <th className="py-3 px-3 text-right">Custo USD ($)</th>
                  <th className="py-3 px-3 text-right">Custo BRL (R$)</th>
                  <th className="py-3 px-3 text-right">Preço Venda (R$)</th>
                  <th className="py-3 px-3 text-right">Lucro Líquido</th>
                  <th className="py-3 px-3 text-right">Margem %</th>
                  <th className="py-3 px-3 text-right">Markup %</th>
                  <th className="py-3 px-3 text-center">Vendidos</th>
                  <th className="py-3 px-4 text-right">Lucro Total Gerado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {individualMargins.map((item, index) => (
                  <tr key={item.id} className="hover:bg-neutral-850/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-neutral-500">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-neutral-200">{item.name}</p>
                      <span className="text-[10px] text-amber-400/90">{item.brand} • {item.volume}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-300">
                      {formatUsd(item.costUsd)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-amber-300">
                      {formatBrl(item.costBrl)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-100">
                      {formatBrl(item.sellingPriceBrl)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      +{formatBrl(item.unitProfit)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-300">
                      {item.marginPercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-400">
                      +{item.markupPercent.toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-neutral-300">
                      {item.soldCount} un
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatBrl(item.totalProfitGenerated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: INVESTMENT ROI & BREAK-EVEN */}
      {reportView === 'investment' && (
        <div className="space-y-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-neutral-100">
                Balanço Geral da Operação & Retorno do Capital
              </h3>
              <p className="text-xs text-neutral-400">
                Comparativo do dinheiro investido na compra da nota vs faturamento obtido e projetado
              </p>
            </div>

            {/* Break-even & ROI Highlight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Investimento Inicial na Nota
                </span>
                <p className="font-mono text-2xl font-bold text-neutral-100 mt-1">
                  {formatBrl(initialCostBrl)}
                </p>
                <div className="flex items-center justify-between text-xs text-neutral-400 mt-2">
                  <span>Dólar pago: {formatUsd(initialCostUsd)}</span>
                  <span className="text-amber-400 font-mono">Taxa: R$ {settings.dollarRate.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-neutral-950 rounded-xl p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-neutral-950">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Faturamento Projetado (100% Vendido)
                </span>
                <p className="font-mono text-2xl font-bold text-emerald-400 mt-1">
                  {formatBrl(investmentOverview.projectedTotalRevenue)}
                </p>
                <span className="text-xs text-emerald-400/80 mt-2 block">
                  Vendas realizadas + estoque remanescente
                </span>
              </div>

              <div className="bg-neutral-950 rounded-xl p-4 border border-amber-500/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Lucro Líquido Projetado
                </span>
                <p className="font-mono text-2xl font-bold text-amber-400 mt-1">
                  {formatBrl(investmentOverview.projectedTotalProfit)}
                </p>
                <span className="text-xs text-amber-300/90 mt-2 block font-semibold">
                  ROI Projetado: +{investmentOverview.projectedRoi.toFixed(0)}% de retorno!
                </span>
              </div>
            </div>

            {/* Visual Step Comparison */}
            <div className="bg-neutral-950/70 rounded-xl p-4 border border-neutral-850 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Fluxo de Recuperação do Investimento
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">1. Capital Pago na Importação:</span>
                  <span className="font-mono font-bold text-rose-400">- {formatBrl(initialCostBrl)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">2. Dinheiro Já Recebido no Bolso:</span>
                  <span className="font-mono font-bold text-emerald-400">+ {formatBrl(investmentOverview.totalCashCollected)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">3. Parcelas a Receber Agendadas:</span>
                  <span className="font-mono font-bold text-amber-400">
                    + {formatBrl(installments.filter((i) => i.status !== 'Pago').reduce((sum, i) => sum + i.amount, 0))}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">4. Valor de Venda do Estoque Restante:</span>
                  <span className="font-mono font-bold text-neutral-200">
                    + {formatBrl(investmentOverview.remainingStockValue)}
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between font-bold text-sm">
                  <span className="text-neutral-200">Resultado Final Estimado (Lucro Líquido):</span>
                  <span className="font-mono text-emerald-400 text-base">
                    + {formatBrl(investmentOverview.projectedTotalProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
