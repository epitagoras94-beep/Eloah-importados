import { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Receipt,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  Camera,
  ZoomIn,
  X,
} from 'lucide-react';
import { Perfume, Gender } from '../types';
import { formatBrl, formatUsd, formatPercent } from '../utils/currency';

interface InventoryTabProps {
  perfumes: Perfume[];
  dollarRate: number;
  openNewPerfumeModal: () => void;
  openEditPerfumeModal: (perfume: Perfume) => void;
  deletePerfume: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  openNewSaleWithPerfume: (perfume: Perfume) => void;
  openInvoiceModal: () => void;
  openDollarModal: () => void;
}

export function InventoryTab({
  perfumes,
  dollarRate,
  openNewPerfumeModal,
  openEditPerfumeModal,
  deletePerfume,
  adjustStock,
  openNewSaleWithPerfume,
  openInvoiceModal,
  openDollarModal,
}: InventoryTabProps) {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'name' | 'profit' | 'stock' | 'margin'>('name');
  const [previewPerfume, setPreviewPerfume] = useState<Perfume | null>(null);

  // Available brands in the list
  const brands = useMemo(() => {
    const set = new Set<string>();
    perfumes.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [perfumes]);

  // Filtered & sorted perfumes
  const filteredPerfumes = useMemo(() => {
    return perfumes
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase()) ||
          p.code.toLowerCase().includes(search.toLowerCase()) ||
          (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

        const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
        const matchesGender = selectedGender === 'all' || p.gender === selectedGender;

        const matchesStock =
          stockStatusFilter === 'all'
            ? true
            : stockStatusFilter === 'in_stock'
            ? p.stockQuantity > 0
            : stockStatusFilter === 'low_stock'
            ? p.stockQuantity === 1
            : p.stockQuantity === 0;

        return matchesSearch && matchesBrand && matchesGender && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stock') return b.stockQuantity - a.stockQuantity;
        if (sortBy === 'profit') {
          const profitA = a.sellingPriceBrl - a.costBrl;
          const profitB = b.sellingPriceBrl - b.costBrl;
          return profitB - profitA;
        }
        if (sortBy === 'margin') {
          const marginA = a.sellingPriceBrl > 0 ? (a.sellingPriceBrl - a.costBrl) / a.sellingPriceBrl : 0;
          const marginB = b.sellingPriceBrl > 0 ? (b.sellingPriceBrl - b.costBrl) / b.sellingPriceBrl : 0;
          return marginB - marginA;
        }
        return 0;
      });
  }, [perfumes, search, selectedBrand, selectedGender, stockStatusFilter, sortBy]);

  // Aggregate totals for the top banner
  const totals = useMemo(() => {
    const totalBottles = perfumes.reduce((sum, p) => sum + p.stockQuantity, 0);
    const totalCostUsd = perfumes.reduce((sum, p) => sum + p.costUsd * p.stockQuantity, 0);
    const totalCostBrl = perfumes.reduce((sum, p) => sum + p.costBrl * p.stockQuantity, 0);
    const totalValueBrl = perfumes.reduce((sum, p) => sum + p.sellingPriceBrl * p.stockQuantity, 0);
    const totalPotentialProfitBrl = totalValueBrl - totalCostBrl;
    const averageMargin = totalValueBrl > 0 ? (totalPotentialProfitBrl / totalValueBrl) * 100 : 0;

    return {
      totalBottles,
      totalCostUsd,
      totalCostBrl,
      totalValueBrl,
      totalPotentialProfitBrl,
      averageMargin,
    };
  }, [perfumes]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Summary & Actions */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/20 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-neutral-100">
                Estoque de Perfumes Árabes
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {perfumes.length} modelos cadastrados • Custo em Dólar convertido a R$ {dollarRate.toFixed(2)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openDollarModal}
              className="px-3 py-2 rounded-xl bg-neutral-950 border border-amber-500/30 text-xs font-mono text-amber-400 hover:border-amber-400 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span>Dólar: $1 = {formatBrl(dollarRate)}</span>
            </button>

            <button
              onClick={openInvoiceModal}
              className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-750 hover:border-amber-500/40 text-xs text-neutral-300 hover:text-amber-300 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Conferir Nota Original</span>
            </button>

            <button
              onClick={openNewPerfumeModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span>Cadastrar Perfume</span>
            </button>
          </div>
        </div>

        {/* Inventory Financial Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-800">
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-850">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Total em Estoque
            </span>
            <p className="font-mono text-lg sm:text-xl font-bold text-neutral-100 mt-0.5">
              {totals.totalBottles} <span className="text-xs font-normal text-neutral-400">frascos</span>
            </p>
          </div>

          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-850">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Custo Total Estoque
            </span>
            <p className="font-mono text-lg sm:text-xl font-bold text-amber-300 mt-0.5">
              {formatBrl(totals.totalCostBrl)}
            </p>
            <span className="text-[10px] text-neutral-400 font-mono">
              ({formatUsd(totals.totalCostUsd)})
            </span>
          </div>

          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-850">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Valor de Venda Projetado
            </span>
            <p className="font-mono text-lg sm:text-xl font-bold text-neutral-100 mt-0.5">
              {formatBrl(totals.totalValueBrl)}
            </p>
          </div>

          <div className="bg-neutral-950/60 p-3 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-neutral-950">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              Lucro Potencial Total
            </span>
            <p className="font-mono text-lg sm:text-xl font-bold text-emerald-400 mt-0.5">
              {formatBrl(totals.totalPotentialProfitBrl)}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold">
              +{totals.averageMargin.toFixed(1)}% margem média
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filter Bar and View Toggles */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar perfume por nome, marca (Lattafa, Al Wataniah...), código ou notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-neutral-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-xl p-1 text-xs">
              <span className="text-neutral-500 px-2 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                <span>Ordenar:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-neutral-300 text-xs focus:outline-none pr-2 cursor-pointer font-medium"
              >
                <option value="name">Nome (A-Z)</option>
                <option value="profit">Maior Lucro (R$)</option>
                <option value="margin">Maior Margem (%)</option>
                <option value="stock">Estoque</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  viewMode === 'cards'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Tabela
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-850 text-xs">
          <span className="text-neutral-500 font-medium">Marcas:</span>
          <button
            onClick={() => setSelectedBrand('all')}
            className={`px-2.5 py-1 rounded-lg transition ${
              selectedBrand === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
            }`}
          >
            Todas ({perfumes.length})
          </button>
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedBrand === b
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
              }`}
            >
              {b}
            </button>
          ))}

          <span className="text-neutral-500 font-medium ml-2">Linha:</span>
          <button
            onClick={() => setSelectedGender('all')}
            className={`px-2 py-0.5 rounded text-[11px] ${
              selectedGender === 'all' ? 'text-amber-400 underline font-bold' : 'text-neutral-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedGender('FEM')}
            className={`px-2 py-0.5 rounded text-[11px] ${
              selectedGender === 'FEM' ? 'text-rose-400 underline font-bold' : 'text-neutral-400'
            }`}
          >
            Feminino
          </button>
          <button
            onClick={() => setSelectedGender('MEN')}
            className={`px-2 py-0.5 rounded text-[11px] ${
              selectedGender === 'MEN' ? 'text-sky-400 underline font-bold' : 'text-neutral-400'
            }`}
          >
            Masculino
          </button>
          <button
            onClick={() => setSelectedGender('UNISSEX')}
            className={`px-2 py-0.5 rounded text-[11px] ${
              selectedGender === 'UNISSEX' ? 'text-purple-400 underline font-bold' : 'text-neutral-400'
            }`}
          >
            Unissex
          </button>

          <span className="text-neutral-500 font-medium ml-2">Status:</span>
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="bg-neutral-950 text-neutral-300 text-[11px] border border-neutral-800 rounded px-2 py-1"
          >
            <option value="all">Todos os status</option>
            <option value="in_stock">Em Estoque (&gt;0)</option>
            <option value="low_stock">Último frasco (1 un)</option>
            <option value="out_of_stock">Esgotados (0 un)</option>
          </select>
        </div>
      </div>

      {/* Main Content: Cards or Table */}
      {filteredPerfumes.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400 space-y-3">
          <Package className="w-12 h-12 text-neutral-600 mx-auto" />
          <p className="text-sm font-semibold">Nenhum perfume encontrado com estes filtros.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedBrand('all');
              setSelectedGender('all');
              setStockStatusFilter('all');
            }}
            className="text-xs text-amber-400 hover:underline"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPerfumes.map((perfume) => {
            const unitProfit = perfume.sellingPriceBrl - perfume.costBrl;
            const margin = perfume.sellingPriceBrl > 0 ? (unitProfit / perfume.sellingPriceBrl) * 100 : 0;
            const markup = perfume.costBrl > 0 ? (unitProfit / perfume.costBrl) * 100 : 0;

            return (
              <div
                key={perfume.id}
                className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-300">
                      {perfume.brand}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          perfume.gender === 'FEM'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : perfume.gender === 'MEN'
                            ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                            : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        }`}
                      >
                        {perfume.gender === 'FEM' ? 'Feminino' : perfume.gender === 'MEN' ? 'Masculino' : 'Unissex'}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {perfume.code}
                      </span>
                    </div>
                  </div>

                  {/* Title, Volume & Product Photo Field */}
                  <div className="flex items-start gap-3">
                    {perfume.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewPerfume(perfume)}
                        title="Clique para ampliar a foto do produto"
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 overflow-hidden shrink-0 group/img transition"
                      >
                        <img
                          src={perfume.imageUrl}
                          alt={perfume.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-neutral-950/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                          <ZoomIn className="w-4 h-4 text-amber-300" />
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditPerfumeModal(perfume)}
                        title="Adicionar foto do produto"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-neutral-950/80 border border-dashed border-neutral-800 hover:border-amber-500/50 flex flex-col items-center justify-center gap-1 text-neutral-500 hover:text-amber-300 shrink-0 transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span className="text-[10px] font-medium">+ Foto</span>
                      </button>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base text-neutral-100 group-hover:text-amber-200 transition leading-snug">
                        {perfume.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {perfume.volume} • Eau de Parfum
                      </p>
                    </div>
                  </div>

                  {perfume.notes && (
                    <p className="text-[11px] text-neutral-400 mt-2.5 line-clamp-2 italic bg-neutral-950/60 p-2 rounded-lg border border-neutral-850">
                      "{perfume.notes}"
                    </p>
                  )}

                  {/* Financial Breakdown Box */}
                  <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-850 mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Custo Pago em Dólar:</span>
                      <span className="font-mono font-semibold text-neutral-200">
                        {formatUsd(perfume.costUsd)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">
                        Custo Convertido (R$ {perfume.exchangeRate.toFixed(2)}):
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatBrl(perfume.costBrl)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-neutral-850">
                      <span className="text-neutral-300 font-semibold">Preço de Venda:</span>
                      <span className="font-mono font-bold text-base text-emerald-400">
                        {formatBrl(perfume.sellingPriceBrl)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-850 text-emerald-400">
                      <span className="text-[11px]">Lucro Líquido:</span>
                      <span className="font-mono font-bold">
                        +{formatBrl(unitProfit)} ({margin.toFixed(0)}% margem)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Stepper & Card Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-850">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-neutral-400 font-medium">Estoque Atual:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustStock(perfume.id, -1)}
                        disabled={perfume.stockQuantity <= 0}
                        title="Diminuir 1 frasco"
                        className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 text-neutral-300 font-bold flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <span
                        className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md min-w-[36px] text-center ${
                          perfume.stockQuantity === 0
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : perfume.stockQuantity === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {perfume.stockQuantity} un
                      </span>
                      <button
                        onClick={() => adjustStock(perfume.id, 1)}
                        title="Aumentar 1 frasco"
                        className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openNewSaleWithPerfume(perfume)}
                      disabled={perfume.stockQuantity <= 0}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Vender Este</span>
                    </button>

                    <button
                      onClick={() => openEditPerfumeModal(perfume)}
                      title="Editar perfume"
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-amber-300 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir "${perfume.name}" do estoque?`)) {
                          deletePerfume(perfume.id);
                        }
                      }}
                      title="Excluir"
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Perfume Árabe</th>
                  <th className="py-3 px-3 text-center">Gênero</th>
                  <th className="py-3 px-3 text-right">Custo ($)</th>
                  <th className="py-3 px-3 text-right">Custo (R$)</th>
                  <th className="py-3 px-3 text-right">Venda (R$)</th>
                  <th className="py-3 px-3 text-right">Lucro Un.</th>
                  <th className="py-3 px-3 text-right">Margem</th>
                  <th className="py-3 px-3 text-center">Estoque</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {filteredPerfumes.map((perfume) => {
                  const unitProfit = perfume.sellingPriceBrl - perfume.costBrl;
                  const margin =
                    perfume.sellingPriceBrl > 0 ? (unitProfit / perfume.sellingPriceBrl) * 100 : 0;
                  return (
                    <tr key={perfume.id} className="hover:bg-neutral-850/60 transition">
                      <td className="py-3 px-4 font-mono text-neutral-400">{perfume.code}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {perfume.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPerfume(perfume)}
                              title="Ver foto ampliada"
                              className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 overflow-hidden shrink-0"
                            >
                              <img
                                src={perfume.imageUrl}
                                alt={perfume.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditPerfumeModal(perfume)}
                              title="Adicionar foto"
                              className="w-9 h-9 rounded-lg bg-neutral-950 border border-dashed border-neutral-800 hover:border-amber-500/40 flex items-center justify-center text-neutral-600 hover:text-amber-300 shrink-0"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                          <div>
                            <p className="font-semibold text-neutral-200">{perfume.name}</p>
                            <span className="text-[10px] text-amber-400/80">{perfume.brand} • {perfume.volume}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-300">
                          {perfume.gender}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-neutral-300">
                        {formatUsd(perfume.costUsd)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-amber-300">
                        {formatBrl(perfume.costBrl)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-neutral-100">
                        {formatBrl(perfume.sellingPriceBrl)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        +{formatBrl(unitProfit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-300">
                        {margin.toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            perfume.stockQuantity === 0
                              ? 'bg-rose-500/20 text-rose-300'
                              : perfume.stockQuantity === 1
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {perfume.stockQuantity} un
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openNewSaleWithPerfume(perfume)}
                            disabled={perfume.stockQuantity <= 0}
                            title="Vender"
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 disabled:opacity-30"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditPerfumeModal(perfume)}
                            title="Editar"
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir "${perfume.name}"?`)) {
                                deletePerfume(perfume.id);
                              }
                            }}
                            title="Excluir"
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Photo Lightbox Modal */}
      {previewPerfume && (
        <div
          onClick={() => setPreviewPerfume(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-5 shadow-2xl relative space-y-4"
          >
            <button
              type="button"
              onClick={() => setPreviewPerfume(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {previewPerfume.brand} • {previewPerfume.volume}
              </span>
              <h3 className="font-serif-luxury text-lg font-bold text-neutral-100 mt-0.5">
                {previewPerfume.name}
              </h3>
            </div>

            <div className="rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden aspect-square flex items-center justify-center">
              {previewPerfume.imageUrl ? (
                <img
                  src={previewPerfume.imageUrl}
                  alt={previewPerfume.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-neutral-700" />
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-neutral-400 block">Preço de Venda</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  {formatBrl(previewPerfume.sellingPriceBrl)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = previewPerfume;
                  setPreviewPerfume(null);
                  openEditPerfumeModal(target);
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-amber-300 font-semibold flex items-center gap-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Alterar Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
