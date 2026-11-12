import { useState, useMemo } from 'react';
import {
  CircleDollarSign,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  CreditCard,
  User,
  ShoppingBag,
  RotateCcw,
  Calendar,
  Sparkles,
  Edit2,
  Ban,
  Trash2,
  X,
  ChevronRight,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Installment, Sale, AppSettings } from '../types';
import { formatBrl, formatDateBr, getInstallmentUrgency } from '../utils/currency';

interface SalesAndInstallmentsTabProps {
  sales: Sale[];
  installments: Installment[];
  settings: AppSettings;
  openNewSaleModal: () => void;
  openEditSaleModal: (sale: Sale) => void;
  openCancelSaleModal: (sale: Sale) => void;
  openWhatsAppModal: (inst: Installment) => void;
  openSaleConfirmationModal: (sale: Sale) => void;
  openReceivePaymentModal: (inst: Installment) => void;
  undoInstallmentPayment: (installmentId: string) => void;
  onUpdateInstallmentDueDate?: (installmentId: string, newDueDate: string) => void;
  deleteSale: (saleId: string) => void;
}

export function SalesAndInstallmentsTab({
  sales,
  installments,
  settings,
  openNewSaleModal,
  openEditSaleModal,
  openCancelSaleModal,
  openWhatsAppModal,
  openSaleConfirmationModal,
  openReceivePaymentModal,
  undoInstallmentPayment,
  onUpdateInstallmentDueDate,
  deleteSale,
}: SalesAndInstallmentsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'installments' | 'sales'>('installments');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'paid'>('all');

  // Modal to pick which sale to edit or cancel when clicked from header
  const [pickerMode, setPickerMode] = useState<'edit' | 'cancel' | null>(null);

  // Active sales (not yet canceled)
  const activeSales = useMemo(() => sales.filter((s) => s.status !== 'Cancelado'), [sales]);

  // Handle header "Editar Venda" click
  const handleHeaderEditClick = () => {
    if (sales.length === 0) return;
    if (sales.length === 1) {
      openEditSaleModal(sales[0]);
    } else {
      setPickerMode('edit');
    }
  };

  // Handle header "Cancelar Venda" click
  const handleHeaderCancelClick = () => {
    if (activeSales.length === 0) return;
    if (activeSales.length === 1) {
      openCancelSaleModal(activeSales[0]);
    } else {
      setPickerMode('cancel');
    }
  };

  // Open address on Google Maps in a new tab
  const openGoogleMaps = (address: string) => {
    if (!address || !address.trim()) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filtered installments
  const filteredInstallments = useMemo(() => {
    return installments
      .filter((inst) => {
        const matchesSearch =
          inst.customerName.toLowerCase().includes(search.toLowerCase()) ||
          inst.customerPhone.includes(search) ||
          (inst.customerAddress && inst.customerAddress.toLowerCase().includes(search.toLowerCase())) ||
          inst.perfumeSummary.toLowerCase().includes(search.toLowerCase());

        const urgency = getInstallmentUrgency(inst.dueDate, inst.status === 'Pago');

        let matchesStatus = true;
        if (statusFilter === 'overdue') {
          matchesStatus = inst.status !== 'Pago' && urgency.status === 'Atrasado';
        } else if (statusFilter === 'today') {
          matchesStatus = inst.status !== 'Pago' && urgency.status === 'Hoje';
        } else if (statusFilter === 'upcoming') {
          matchesStatus = inst.status !== 'Pago' && (urgency.status === 'Pendente' || urgency.status === 'Hoje');
        } else if (statusFilter === 'paid') {
          matchesStatus = inst.status === 'Pago';
        }

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (a.status === 'Pago' && b.status !== 'Pago') return 1;
        if (a.status !== 'Pago' && b.status === 'Pago') return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [installments, search, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const pending = installments.filter((i) => i.status !== 'Pago');
    const totalPending = pending.reduce((sum, i) => sum + i.amount, 0);

    const overdue = pending.filter(
      (i) => getInstallmentUrgency(i.dueDate, false).status === 'Atrasado'
    );
    const totalOverdue = overdue.reduce((sum, i) => sum + i.amount, 0);

    const today = pending.filter(
      (i) => getInstallmentUrgency(i.dueDate, false).status === 'Hoje'
    );
    const totalToday = today.reduce((sum, i) => sum + i.amount, 0);

    const paid = installments.filter((i) => i.status === 'Pago');
    const totalPaid = paid.reduce((sum, i) => sum + (i.paidAmount || i.amount), 0);

    return {
      totalPending,
      pendingCount: pending.length,
      totalOverdue,
      overdueCount: overdue.length,
      totalToday,
      todayCount: today.length,
      totalPaid,
      paidCount: paid.length,
    };
  }, [installments]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner (Updated with direct Editar Venda & Cancelar Venda buttons) */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/20 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-neutral-100">
                Contas a Receber & Vendas Parceladas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Monitore parcelas, cobre pelo WhatsApp, edite condições e cancele vendas com devolução de estoque
            </p>
          </div>

          {/* Action Toolbar with Editar Venda, Cancelar Venda, and Nova Venda */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Sub-tab Pill Switcher */}
            <div className="bg-neutral-950 p-1 rounded-xl border border-neutral-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSubTab('installments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeSubTab === 'installments'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Parcelas ({installments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('sales')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeSubTab === 'sales'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vendas ({sales.length})</span>
              </button>
            </div>

            {/* Direct Button: Editar Venda */}
            <button
              type="button"
              onClick={handleHeaderEditClick}
              disabled={sales.length === 0}
              title="Editar uma venda (alterar cliente, parcelas, perfumes ou valores)"
              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 disabled:opacity-40 border border-neutral-750 hover:border-amber-500/40 text-neutral-200 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Editar Venda</span>
            </button>

            {/* Direct Button: Cancelar Venda */}
            <button
              type="button"
              onClick={handleHeaderCancelClick}
              disabled={activeSales.length === 0}
              title="Cancelar uma venda com devolução automática de estoque"
              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 disabled:opacity-40 border border-neutral-750 hover:border-rose-500/40 text-neutral-200 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>Cancelar Venda</span>
            </button>

            {/* Primary Action Button: Nova Venda (Single Clean Plus) */}
            <button
              type="button"
              onClick={openNewSaleModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Nova Venda</span>
            </button>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-800">
          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-850">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Total a Receber
            </span>
            <p className="font-mono text-xl font-bold text-amber-400 mt-0.5">
              {formatBrl(stats.totalPending)}
            </p>
            <span className="text-[10px] text-neutral-400">
              {stats.pendingCount} parcelas em aberto
            </span>
          </div>

          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-950/20 to-neutral-950">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
              Total em Atraso
            </span>
            <p className="font-mono text-xl font-bold text-rose-400 mt-0.5">
              {formatBrl(stats.totalOverdue)}
            </p>
            <span className="text-[10px] text-rose-300 font-medium">
              {stats.overdueCount} {stats.overdueCount === 1 ? 'parcela atrasada' : 'parcelas atrasadas'}
            </span>
          </div>

          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
              Vencendo Hoje
            </span>
            <p className="font-mono text-xl font-bold text-amber-300 mt-0.5">
              {formatBrl(stats.totalToday)}
            </p>
            <span className="text-[10px] text-amber-300/80">
              {stats.todayCount} cobrança(s) para hoje
            </span>
          </div>

          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-neutral-950">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              Já Recebido em Parcelas
            </span>
            <p className="font-mono text-xl font-bold text-emerald-400 mt-0.5">
              {formatBrl(stats.totalPaid)}
            </p>
            <span className="text-[10px] text-emerald-400/80">
              {stats.paidCount} parcelas quitadas
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('installments')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeSubTab === 'installments'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Parcelas a Receber ({installments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sales')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeSubTab === 'sales'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Todas as Vendas ({sales.length})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
              Editar / Cancelar
            </span>
          </button>
        </div>
      </div>

      {activeSubTab === 'installments' ? (
        <>
          {/* Filters & Search */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome do cliente, telefone ou perfume..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-neutral-100 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-850 text-xs">
              <span className="text-neutral-500 font-medium mr-1">Filtrar:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'all'
                    ? 'bg-neutral-800 text-neutral-100 font-bold border border-neutral-700'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-850'
                }`}
              >
                Todas ({installments.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'overdue'
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/50'
                    : 'bg-neutral-950 text-rose-400 hover:bg-rose-500/10 border border-neutral-850'
                }`}
              >
                🚨 Em Atraso ({stats.overdueCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('today')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'today'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50'
                    : 'bg-neutral-950 text-amber-400 hover:bg-amber-500/10 border border-neutral-850'
                }`}
              >
                📅 Vence Hoje ({stats.todayCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'upcoming'
                    ? 'bg-neutral-800 text-amber-300 font-bold border border-neutral-700'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-850'
                }`}
              >
                ⏳ Pendentes ({stats.pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/50'
                    : 'bg-neutral-950 text-emerald-400 hover:bg-emerald-500/10 border border-neutral-850'
                }`}
              >
                ✅ Pagas ({stats.paidCount})
              </button>
            </div>
          </div>

          {/* Installments List */}
          {filteredInstallments.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold">Nenhuma parcela encontrada para este filtro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInstallments.map((inst) => {
                const isPaid = inst.status === 'Pago';
                const urgency = getInstallmentUrgency(inst.dueDate, isPaid);
                const parentSale = sales.find((s) => s.id === inst.saleId);
                const effectiveAddress = inst.customerAddress || parentSale?.customerAddress;

                return (
                  <div
                    key={inst.id}
                    className={`bg-neutral-900 border rounded-2xl p-4 sm:p-5 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isPaid
                        ? 'border-neutral-800 opacity-80'
                        : urgency.status === 'Atrasado'
                        ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/15 via-neutral-900 to-neutral-900'
                        : urgency.status === 'Hoje'
                        ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/15 via-neutral-900 to-neutral-900'
                        : 'border-neutral-800 hover:border-neutral-750'
                    }`}
                  >
                    {/* Left: Customer, Fragrance, & Address details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm sm:text-base text-neutral-100">
                          {inst.customerName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgency.badgeClass}`}>
                          {urgency.label}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300 font-medium">
                        {inst.perfumeSummary}
                      </p>

                      {/* Address & Google Maps Button */}
                      {effectiveAddress ? (
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-300 bg-neutral-950/70 px-2.5 py-1 rounded-lg border border-neutral-800 max-w-full sm:max-w-md">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{effectiveAddress}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openGoogleMaps(effectiveAddress)}
                            title="Abrir rota no Google Maps para entrega ou cobrança"
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0"
                          >
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>Google Maps ↗</span>
                          </button>
                        </div>
                      ) : parentSale ? (
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                          <MapPin className="w-3 h-3 text-neutral-600" />
                          <span>Sem endereço</span>
                          <button
                            type="button"
                            onClick={() => openEditSaleModal(parentSale)}
                            className="text-amber-400/80 hover:text-amber-300 underline font-medium"
                          >
                            + cadastrar endereço
                          </button>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 pt-0.5">
                        <span className="font-semibold text-amber-400/90">
                          Parcela {inst.installmentNumber} de {inst.totalInstallments}
                        </span>
                        <span>•</span>
                        {!isPaid && onUpdateInstallmentDueDate ? (
                          <div
                            title="Clique para abrir o calendário e alterar o vencimento"
                            className="relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-amber-200 transition cursor-pointer"
                          >
                            <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>
                              Vencimento: <strong>{formatDateBr(inst.dueDate)}</strong>
                            </span>
                            <input
                              type="date"
                              aria-label={`Alterar vencimento da parcela ${inst.installmentNumber} de ${inst.customerName}`}
                              value={inst.dueDate}
                              onClick={(e) => {
                                try {
                                  (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                                } catch {
                                  // Fallback to native date picker
                                }
                              }}
                              onChange={(e) => {
                                if (e.target.value) {
                                  onUpdateInstallmentDueDate(inst.id, e.target.value);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [color-scheme:dark]"
                            />
                          </div>
                        ) : (
                          <span>
                            Vencimento: <strong>{formatDateBr(inst.dueDate)}</strong>
                          </span>
                        )}
                        {inst.customerPhone && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-neutral-300">{inst.customerPhone}</span>
                          </>
                        )}
                        {isPaid && inst.paidDate && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                              Pago em {formatDateBr(inst.paidDate)} ({inst.paymentMethod || 'PIX'})
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Value & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-800">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Valor da Parcela
                        </span>
                        <span
                          className={`font-mono text-lg sm:text-xl font-bold ${
                            isPaid
                              ? 'text-emerald-400'
                              : urgency.status === 'Atrasado'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {formatBrl(inst.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {!isPaid ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openWhatsAppModal(inst)}
                              title="Enviar cobrança personalizada no WhatsApp com chave PIX"
                              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Cobrar WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openReceivePaymentModal(inst)}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Dar Baixa</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openWhatsAppModal(inst)}
                              title="Reenviar recibo de pagamento"
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs flex items-center gap-1 transition"
                            >
                              <Send className="w-3 h-3 text-emerald-400" />
                              <span>Enviar Recibo</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja desfazer o pagamento da parcela de ${inst.customerName}?`)) {
                                  undoInstallmentPayment(inst.id);
                                }
                              }}
                              title="Desfazer pagamento e voltar para pendente"
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Quick Edit/Cancel Parent Sale from installment */}
                        {parentSale && (
                          <div className="flex items-center border-l border-neutral-800 pl-1.5 gap-1">
                            <button
                              type="button"
                              onClick={() => openEditSaleModal(parentSale)}
                              title="Editar venda inteira (valores, datas, itens)"
                              className="p-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openCancelSaleModal(parentSale)}
                              title="Cancelar esta venda e devolver perfumes ao estoque"
                              className="p-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Full Sales View (With prominent EDIT and CANCEL buttons) */
        <div className="space-y-4">
          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Mostrando todas as <strong>{sales.length} vendas</strong> cadastradas. Você pode <strong>editar</strong> preços e parcelas ou <strong>cancelar</strong> a venda com retorno automático de estoque.
            </span>
          </div>

          {sales.map((sale) => {
            const isCanceled = sale.status === 'Cancelado';

            return (
              <div
                key={sale.id}
                className={`bg-neutral-900 border rounded-2xl p-5 shadow-sm space-y-4 transition ${
                  isCanceled
                    ? 'border-neutral-850 opacity-60 bg-neutral-950/50'
                    : 'border-neutral-800 hover:border-neutral-750'
                }`}
              >
                {/* Sale Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-400">
                        Venda #{String(sale.saleNumber).padStart(3, '0')}
                      </span>
                      <span className="font-bold text-base text-neutral-100">{sale.customerName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isCanceled
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : sale.status === 'Quitado'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isCanceled
                          ? 'Venda Cancelada'
                          : sale.status === 'Quitado'
                          ? 'Totalmente Quitado'
                          : 'Em Andamento'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Data da Venda: {formatDateBr(sale.saleDate)}{' '}
                      {sale.customerPhone && `• WhatsApp: ${sale.customerPhone}`}
                    </p>

                    {/* Customer Address & Google Maps in Sale view */}
                    {sale.customerAddress ? (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-200 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Endereço: <strong className="text-neutral-100">{sale.customerAddress}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openGoogleMaps(sale.customerAddress!)}
                          title="Abrir rota no Google Maps para entrega ou cobrança"
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>Abrir no Google Maps ↗</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                        <MapPin className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Sem endereço cadastrado</span>
                        <button
                          type="button"
                          onClick={() => openEditSaleModal(sale)}
                          className="text-amber-400/90 hover:text-amber-300 underline font-medium"
                        >
                          + Adicionar endereço
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Top Right: Total Value & Direct Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                        Valor Total
                      </span>
                      <span
                        className={`font-mono text-xl font-bold ${
                          isCanceled ? 'line-through text-neutral-500' : 'text-neutral-100'
                        }`}
                      >
                        {formatBrl(sale.totalSellingPriceBrl)}
                      </span>
                    </div>

                    {/* Action Buttons: Enviar Confirmação, Editar Venda & Cancelar Venda */}
                    <div className="flex flex-wrap items-center gap-2">
                      {!isCanceled && (
                        <button
                          type="button"
                          onClick={() => openSaleConfirmationModal(sale)}
                          title="Enviar confirmação da compra e vencimentos pelo WhatsApp"
                          className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Confirmação</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditSaleModal(sale)}
                        title="Editar esta venda (cliente, perfumes, valor, parcelas)"
                        className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Venda</span>
                      </button>

                      {!isCanceled && (
                        <button
                          type="button"
                          onClick={() => openCancelSaleModal(sale)}
                          title="Cancelar venda e devolver estoque ao inventário"
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Cancelar Venda</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Deseja realmente excluir definitivamente o registro da Venda #${sale.saleNumber} de ${sale.customerName}?`
                            )
                          ) {
                            deleteSale(sale.id);
                          }
                        }}
                        title="Excluir do sistema"
                        className="p-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items sold table */}
                <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-850 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Itens da Venda:
                  </span>
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-200">
                        {item.quantity}x {item.perfumeName} ({item.brand})
                      </span>
                      <div className="flex items-center gap-4 font-mono">
                        <span className="text-neutral-400">
                          Custo: {formatBrl(item.unitCostBrl * item.quantity)}
                        </span>
                        <span className="text-neutral-200">
                          Total: {formatBrl(item.totalSellingPriceBrl)}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          Lucro: +{formatBrl(item.totalProfitBrl)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Condition & Profit Margin */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  <div className="text-neutral-300">
                    Condição:{' '}
                    {sale.isCashSale || sale.installmentsCount === 0 ? (
                      <strong className="text-emerald-400">
                        Pago À Vista ({sale.paymentMethod || 'PIX'})
                      </strong>
                    ) : (
                      <>
                        {sale.downPaymentBrl > 0 && (
                          <strong className="text-emerald-400">
                            Entrada de {formatBrl(sale.downPaymentBrl)} ({sale.paymentMethod || 'PIX'}) +{' '}
                          </strong>
                        )}
                        <strong>
                          {sale.installmentsCount}x de {formatBrl(sale.installmentValueBrl)}
                        </strong>
                      </>
                    )}
                    {sale.notes && (
                      <span className="text-neutral-400 italic ml-2">"{sale.notes}"</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-neutral-400">
                      Custo total: {formatBrl(sale.totalCostBrl)}
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      Lucro líquido: {formatBrl(sale.totalProfitBrl)} ({sale.profitMarginPercent}% margem)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sale Picker Modal (when clicked from header) */}
      {pickerMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-lg w-full shadow-2xl p-5 sm:p-6 text-neutral-100 relative max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setPickerMode(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  pickerMode === 'edit'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                }`}
              >
                {pickerMode === 'edit' ? <Edit2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-serif-luxury text-lg font-bold text-neutral-100">
                  {pickerMode === 'edit'
                    ? 'Selecione a Venda para Editar'
                    : 'Selecione a Venda para Cancelar'}
                </h3>
                <p className="text-xs text-neutral-400">
                  {pickerMode === 'edit'
                    ? 'Clique na venda que deseja alterar dados, perfumes ou valores'
                    : 'Escolha qual venda deseja cancelar com devolução ao estoque'}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-2.5 my-2 pr-1">
              {(pickerMode === 'cancel' ? activeSales : sales).map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    if (pickerMode === 'edit') {
                      openEditSaleModal(s);
                    } else {
                      openCancelSaleModal(s);
                    }
                    setPickerMode(null);
                  }}
                  className="bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-400">
                        #{String(s.saleNumber).padStart(3, '0')}
                      </span>
                      <span className="text-sm font-bold text-neutral-200 group-hover:text-amber-200 transition">
                        {s.customerName}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {s.items.map((i) => `${i.perfumeName} (${i.quantity}x)`).join(', ')}
                    </p>
                    <span className="text-[10px] text-neutral-500">
                      {formatDateBr(s.saleDate)} • {s.installmentsCount}x de {formatBrl(s.installmentValueBrl)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-bold text-neutral-100">
                      {formatBrl(s.totalSellingPriceBrl)}
                    </span>
                    <div
                      className={`p-1.5 rounded-lg ${
                        pickerMode === 'edit'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPickerMode(null)}
                className="py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
