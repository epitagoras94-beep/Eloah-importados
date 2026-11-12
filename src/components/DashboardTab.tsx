import { useMemo } from 'react';
import {
  TrendingUp,
  CircleDollarSign,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Receipt,
  Plus,
  Send,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { Perfume, Sale, Installment, PaymentLog, AppSettings } from '../types';
import { formatBrl, formatUsd, formatDateBr, getInstallmentUrgency } from '../utils/currency';

interface DashboardTabProps {
  perfumes: Perfume[];
  sales: Sale[];
  installments: Installment[];
  payments: PaymentLog[];
  settings: AppSettings;
  openNewSaleModal: () => void;
  openNewPerfumeModal: () => void;
  openWhatsAppModal: (inst: Installment) => void;
  openReceivePaymentModal: (inst: Installment) => void;
  openInvoiceModal: () => void;
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'sales' | 'payments' | 'reports') => void;
}

export function DashboardTab({
  perfumes,
  sales,
  installments,
  payments,
  settings,
  openNewSaleModal,
  openNewPerfumeModal,
  openWhatsAppModal,
  openReceivePaymentModal,
  openInvoiceModal,
  setActiveTab,
}: DashboardTabProps) {
  // Aggregate stats
  const stats = useMemo(() => {
    // Total bottles & inventory value
    const totalBottlesInStock = perfumes.reduce((sum, p) => sum + p.stockQuantity, 0);
    const totalInventoryCostBrl = perfumes.reduce((sum, p) => sum + p.costBrl * p.stockQuantity, 0);
    const totalInventoryValueBrl = perfumes.reduce(
      (sum, p) => sum + p.sellingPriceBrl * p.stockQuantity,
      0
    );

    // Initial purchase investment from the receipt
    const initialInvestmentUsd = 460.91;
    const initialInvestmentBrl = initialInvestmentUsd * settings.dollarRate;

    // Sales metrics
    const totalGrossSales = sales.reduce((sum, s) => sum + s.totalSellingPriceBrl, 0);
    const totalSalesProfit = sales.reduce((sum, s) => sum + s.totalProfitBrl, 0);

    // Payments received (real money collected so far)
    const totalCashCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    // Installments status
    const pendingInsts = installments.filter((i) => i.status !== 'Pago');
    const totalReceivables = pendingInsts.reduce((sum, i) => sum + i.amount, 0);

    const overdueInsts = pendingInsts.filter(
      (i) => getInstallmentUrgency(i.dueDate, false).status === 'Atrasado'
    );
    const totalOverdue = overdueInsts.reduce((sum, i) => sum + i.amount, 0);

    const dueTodayInsts = pendingInsts.filter(
      (i) => getInstallmentUrgency(i.dueDate, false).status === 'Hoje'
    );
    const totalDueToday = dueTodayInsts.reduce((sum, i) => sum + i.amount, 0);

    // Overall projected revenue if all perfumes sold
    const totalProjectedRevenue = totalGrossSales + totalInventoryValueBrl;
    const totalProjectedProfit = totalSalesProfit + (totalInventoryValueBrl - totalInventoryCostBrl);

    // Capital recovery progress
    const recoveryProgress = Math.min(
      100,
      initialInvestmentBrl > 0 ? (totalCashCollected / initialInvestmentBrl) * 100 : 0
    );

    return {
      totalBottlesInStock,
      totalInventoryCostBrl,
      totalInventoryValueBrl,
      initialInvestmentUsd,
      initialInvestmentBrl,
      totalGrossSales,
      totalSalesProfit,
      totalCashCollected,
      totalReceivables,
      totalOverdue,
      overdueCount: overdueInsts.length,
      dueTodayCount: dueTodayInsts.length,
      totalDueToday,
      totalProjectedRevenue,
      totalProjectedProfit,
      recoveryProgress,
      pendingInsts,
      overdueInsts,
    };
  }, [perfumes, sales, installments, payments, settings.dollarRate]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/25 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-serif-luxury text-sm font-semibold tracking-wider uppercase">
                Painel Financeiro & Estoque
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-neutral-400 font-mono">
                Câmbio: $1 = {formatBrl(settings.dollarRate)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-luxury text-neutral-100 mt-1">
              Olá, {settings.sellerName || 'Empreendedor(a)'}! Gestão do seu investimento
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              Acompanhe seu capital investido na compra dos perfumes árabes, controle de parcelas a receber e histórico de cobrança recorrente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={openNewSaleModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Venda</span>
            </button>
            <button
              onClick={openInvoiceModal}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Ver Nota ($460,91)</span>
            </button>
          </div>
        </div>

        {/* Investment Return Progress Meter */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Recuperação do Capital Investido (Nota Original: {formatBrl(stats.initialInvestmentBrl)})</span>
            </span>
            <span className="font-mono font-bold text-amber-300">
              {stats.recoveryProgress.toFixed(1)}% recuperado ({formatBrl(stats.totalCashCollected)} recebidos)
            </span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-2.5 border border-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.recoveryProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Investimento Inicial da Compra */}
        <div className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/30 rounded-2xl p-4 sm:p-5 transition shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Investimento Compra
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-100">
            {formatBrl(stats.initialInvestmentBrl)}
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
            <span>Nota: {formatUsd(stats.initialInvestmentUsd)}</span>
            <span className="text-amber-400 font-mono">$1 = {formatBrl(settings.dollarRate)}</span>
          </div>
        </div>

        {/* Card 2: Contas a Receber (Parcelas) */}
        <div
          onClick={() => setActiveTab('sales')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-300">
              Contas a Receber
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-amber-400">
            {formatBrl(stats.totalReceivables)}
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-neutral-400">{stats.pendingInsts.length} parcelas em aberto</span>
            <span className="text-amber-400 font-medium group-hover:underline flex items-center gap-0.5">
              Ver lista <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Lucro Bruto Realizado */}
        <div
          onClick={() => setActiveTab('reports')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 transition cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-emerald-300">
              Lucro Realizado
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
            {formatBrl(stats.totalSalesProfit)}
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
            <span>Faturado: {formatBrl(stats.totalGrossSales)}</span>
            <span className="text-emerald-400 font-bold">
              {stats.totalGrossSales > 0
                ? `${((stats.totalSalesProfit / stats.totalGrossSales) * 100).toFixed(0)}% margem`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Card 4: Frascos em Estoque */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-300">
              Estoque Atual
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-100">
            {stats.totalBottlesInStock} <span className="text-sm font-normal text-neutral-400">frascos</span>
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
            <span>Potencial: {formatBrl(stats.totalInventoryValueBrl)}</span>
            <span className="text-amber-400 font-medium group-hover:underline flex items-center gap-0.5">
              Estoque <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Action Alert: Overdue or Due Today Installments */}
      {(stats.overdueCount > 0 || stats.dueTodayCount > 0) && (
        <div className="bg-gradient-to-r from-rose-950/30 via-neutral-900 to-amber-950/20 border border-rose-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-base font-bold text-rose-200">
                  Atenção para Cobrança Imediata
                </h3>
                <p className="text-xs text-neutral-400">
                  {stats.overdueCount > 0 && `${stats.overdueCount} parcela(s) em atraso (${formatBrl(stats.totalOverdue)}) `}
                  {stats.dueTodayCount > 0 && `• ${stats.dueTodayCount} vencendo hoje (${formatBrl(stats.totalDueToday)})`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Ver todas
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {stats.overdueInsts.slice(0, 4).map((inst) => {
              const urgency = getInstallmentUrgency(inst.dueDate, false);
              return (
                <div
                  key={inst.id}
                  className="bg-neutral-950/80 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-200 truncate">{inst.customerName}</p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {inst.perfumeSummary} • Parcela {inst.installmentNumber}/{inst.totalInstallments}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${urgency.badgeClass}`}>
                      {urgency.label} ({formatDateBr(inst.dueDate)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-bold text-rose-400">
                      {formatBrl(inst.amount)}
                    </span>
                    <button
                      onClick={() => openWhatsAppModal(inst)}
                      title="Cobrar via WhatsApp com dados PIX"
                      className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openReceivePaymentModal(inst)}
                      title="Dar baixa / Receber"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition"
                    >
                      Receber
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Layout: Quick Stock Status & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fragrances Overview */}
        <div className="lg:col-span-7 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif-luxury text-base font-bold text-neutral-100">
                Perfumes Árabes no Estoque
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Gerenciar ({perfumes.length} modelos)</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {perfumes.slice(0, 6).map((perfume) => {
              const profit = perfume.sellingPriceBrl - perfume.costBrl;
              const margin = perfume.sellingPriceBrl > 0 ? (profit / perfume.sellingPriceBrl) * 100 : 0;
              return (
                <div
                  key={perfume.id}
                  className="bg-neutral-950/70 border border-neutral-850 hover:border-neutral-750 rounded-xl p-3 flex items-center justify-between transition"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-200 truncate">
                        {perfume.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                        {perfume.brand}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                      <span>Custo: {formatUsd(perfume.costUsd)} ({formatBrl(perfume.costBrl)})</span>
                      <span>•</span>
                      <span className="text-neutral-300 font-medium">Venda: {formatBrl(perfume.sellingPriceBrl)}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">+{margin.toFixed(0)}% margem</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                        perfume.stockQuantity === 0
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : perfume.stockQuantity <= 1
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {perfume.stockQuantity} un
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-xs text-neutral-400">
            <span>Todos os perfumes foram cadastrados a partir da nota fiscal de Cascavel.</span>
            <button
              onClick={openNewPerfumeModal}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              + Adicionar Novo
            </button>
          </div>
        </div>

        {/* Right Column: Recent Sales & Payments */}
        <div className="lg:col-span-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="font-serif-luxury text-base font-bold text-neutral-100">
                Últimas Vendas & Entradas
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {sales.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">
                Nenhuma venda registrada ainda. Clique em "Registrar Venda".
              </div>
            ) : (
              sales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  className="bg-neutral-950/70 border border-neutral-850 rounded-xl p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200">
                      {sale.customerName}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {formatBrl(sale.totalSellingPriceBrl)}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 truncate">
                    {sale.items.map((i) => `${i.perfumeName} (${i.quantity}x)`).join(', ')}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-850">
                    <span>
                      {sale.installmentsCount === 1
                        ? 'À vista'
                        : `${sale.installmentsCount}x de ${formatBrl(sale.installmentValueBrl)}`}
                    </span>
                    <span className="text-emerald-400/90 font-mono">
                      Lucro: {formatBrl(sale.totalProfitBrl)} ({sale.profitMarginPercent}%)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Total recebido em caixa:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatBrl(stats.totalCashCollected)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
