import {
  Sparkles,
  Package,
  CircleDollarSign,
  History,
  TrendingUp,
  Receipt,
  Settings,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { formatBrl } from '../utils/currency';

interface NavbarProps {
  activeTab: 'dashboard' | 'inventory' | 'sales' | 'payments' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'sales' | 'payments' | 'reports') => void;
  storeName: string;
  dollarRate: number;
  openDollarModal: () => void;
  openNewSaleModal: () => void;
  openNewPerfumeModal: () => void;
  openInvoiceModal: () => void;
  openSettingsModal: () => void;
  pendingInstallmentsCount: number;
  overdueInstallmentsCount: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  storeName,
  dollarRate,
  openDollarModal,
  openNewSaleModal,
  openNewPerfumeModal,
  openInvoiceModal,
  openSettingsModal,
  pendingInstallmentsCount,
  overdueInstallmentsCount,
}: NavbarProps) {
  const displayName = storeName.trim() || 'Eloah Importados';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Estoque de Perfumes',
      icon: Package,
      badge: null,
    },
    {
      id: 'sales',
      label: 'Vendas & Parcelas',
      icon: CircleDollarSign,
      badge: overdueInstallmentsCount > 0 ? `${overdueInstallmentsCount} atrasadas` : pendingInstallmentsCount > 0 ? `${pendingInstallmentsCount} a receber` : null,
      badgeVariant: overdueInstallmentsCount > 0 ? 'danger' : 'neutral',
    },
    {
      id: 'payments',
      label: 'Histórico de Pagamentos',
      icon: History,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Lucro & Relatórios',
      icon: Wallet,
      badge: null,
    },
  ] as const;

  return (
    <header className="relative z-40 bg-neutral-950 border-b border-amber-500/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3 min-h-[4.5rem]">
          {/* Logo & Store Title */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0 min-w-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 p-[1.5px] shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif-luxury tracking-widest text-base sm:text-xl font-bold text-amber-300 uppercase whitespace-nowrap">
                  {displayName}
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  Perfumes Árabes
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium hidden xl:block truncate">
                Gestão de Estoque, Câmbio USD/BRL & Cobrança de Parcelas
              </p>
            </div>
          </div>

          {/* Center Quick Stats / Dollar Rate pill (shown on lg+ where there is room without wrapping) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <button
              onClick={openDollarModal}
              title="Clique para alterar a cotação do dólar"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-amber-500/30 text-xs hover:border-amber-400 hover:bg-neutral-850 transition group whitespace-nowrap"
            >
              <span className="text-neutral-400 font-medium">Dólar:</span>
              <span className="font-mono font-bold text-amber-400 group-hover:text-amber-300">
                $1 = {formatBrl(dollarRate)}
              </span>
              <RefreshCw className="w-3 h-3 text-amber-400/60 group-hover:rotate-180 transition-transform duration-300" />
            </button>

            <button
              onClick={openInvoiceModal}
              title="Ver nota fiscal original de 25 frascos ($460.91)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-amber-300 hover:border-amber-500/30 transition whitespace-nowrap"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Nota Fiscal ($460,91)</span>
            </button>
          </div>

          {/* Quick Action CTA buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openNewSaleModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span className="hidden sm:inline">Nova Venda</span>
              <span className="sm:hidden">Venda</span>
            </button>

            <button
              onClick={openNewPerfumeModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 text-xs font-semibold transition whitespace-nowrap"
            >
              <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>+ Perfume</span>
            </button>

            <button
              onClick={openSettingsModal}
              title="Configurações e Backup"
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-amber-300 transition shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none border-t border-neutral-900">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      item.badgeVariant === 'danger'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Compact Quick Banner for Dollar & Invoice on mobile/tablet (< lg) */}
      <div className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-1.5 bg-neutral-900/90 border-t border-neutral-850 text-[11px] text-neutral-400">
        <button onClick={openDollarModal} className="flex items-center gap-1.5 text-amber-400 font-mono whitespace-nowrap">
          <span>Dólar: $1 = {formatBrl(dollarRate)}</span>
          <RefreshCw className="w-2.5 h-2.5" />
        </button>
        <button onClick={openInvoiceModal} className="text-neutral-300 hover:text-amber-300 flex items-center gap-1 whitespace-nowrap">
          <Receipt className="w-3 h-3 text-amber-400" />
          <span>Nota Fiscal ($460,91)</span>
        </button>
      </div>
    </header>
  );
}
