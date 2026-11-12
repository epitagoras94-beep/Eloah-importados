import { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  Calendar,
  AlertTriangle,
  Edit2,
  MapPin,
  CreditCard,
  Clock,
} from 'lucide-react';
import { Perfume, Sale, PaymentMethod } from '../types';
import { formatBrl, getTodayDateString } from '../utils/currency';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfumes: Perfume[];
  dollarRate: number;
  editingSale?: Sale | null;
  onConfirmSale: (saleData: {
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    saleDate: string;
    items: {
      perfumeId: string;
      quantity: number;
      unitSellingPriceBrl: number;
    }[];
    downPaymentBrl: number;
    installmentsCount: number;
    firstDueDate: string;
    installmentIntervalDays?: number;
    isCashSale?: boolean;
    paymentMethod?: PaymentMethod;
    notes?: string;
  }) => void;
  onUpdateSale?: (
    saleId: string,
    saleData: {
      customerName: string;
      customerPhone: string;
      customerAddress?: string;
      saleDate: string;
      items: {
        perfumeId: string;
        quantity: number;
        unitSellingPriceBrl: number;
      }[];
      downPaymentBrl: number;
      installmentsCount: number;
      firstDueDate: string;
      installmentIntervalDays?: number;
      isCashSale?: boolean;
      paymentMethod?: PaymentMethod;
      notes?: string;
    }
  ) => void;
}

interface SaleDraftItem {
  perfumeId: string;
  quantity: number;
  unitSellingPriceBrl: number;
}

export function NewSaleModal({
  isOpen,
  onClose,
  perfumes,
  dollarRate,
  editingSale,
  onConfirmSale,
  onUpdateSale,
}: NewSaleModalProps) {
  const customerNameInputRef = useRef<HTMLInputElement | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const [customerName, setCustomerName] = useState(editingSale?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(editingSale?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(editingSale?.customerAddress || '');
  const [saleDate, setSaleDate] = useState(editingSale?.saleDate || getTodayDateString());
  const [downPayment, setDownPayment] = useState<number>(editingSale?.downPaymentBrl || 0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(
    editingSale?.installmentsCount || 2
  );
  const [frequency, setFrequency] = useState<'mensal' | 'quinzenal'>('mensal');
  const [isCashSale, setIsCashSale] = useState<boolean>(Boolean(editingSale?.isCashSale));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingSale?.paymentMethod || 'PIX'
  );
  const [notes, setNotes] = useState(editingSale?.notes || '');

  // Default first due date 30 days ahead
  const getDefaultDueDate = (freq: 'mensal' | 'quinzenal' = 'mensal') => {
    const d = new Date();
    d.setDate(d.getDate() + (freq === 'mensal' ? 30 : 15));
    return d.toISOString().split('T')[0];
  };
  const [firstDueDate, setFirstDueDate] = useState<string>(() => getDefaultDueDate('mensal'));

  // Selected items in this sale
  const [items, setItems] = useState<SaleDraftItem[]>(() => {
    if (editingSale && editingSale.items && editingSale.items.length > 0) {
      return editingSale.items.map((i) => ({
        perfumeId: i.perfumeId,
        quantity: i.quantity,
        unitSellingPriceBrl: i.unitSellingPriceBrl,
      }));
    }

    const firstAvailable = perfumes.find((p) => p.stockQuantity > 0) || perfumes[0];
    return firstAvailable
      ? [
          {
            perfumeId: firstAvailable.id,
            quantity: 1,
            unitSellingPriceBrl: firstAvailable.sellingPriceBrl,
          },
        ]
      : [];
  });

  // Synchronize state when editingSale changes or modal opens
  useEffect(() => {
    if (!isOpen) return;
    setValidationError('');

    if (editingSale) {
      setCustomerName(editingSale.customerName || '');
      setCustomerPhone(editingSale.customerPhone || '');
      setCustomerAddress(editingSale.customerAddress || '');
      setSaleDate(editingSale.saleDate || getTodayDateString());
      setDownPayment(editingSale.downPaymentBrl || 0);
      setInstallmentsCount(editingSale.installmentsCount || 2);
      setIsCashSale(Boolean(editingSale.isCashSale));
      setPaymentMethod(editingSale.paymentMethod || 'PIX');
      setNotes(editingSale.notes || '');
      if (editingSale.items && editingSale.items.length > 0) {
        setItems(
          editingSale.items.map((i) => ({
            perfumeId: i.perfumeId,
            quantity: i.quantity,
            unitSellingPriceBrl: i.unitSellingPriceBrl,
          }))
        );
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setSaleDate(getTodayDateString());
      setDownPayment(0);
      setInstallmentsCount(2);
      setFrequency('mensal');
      setIsCashSale(false);
      setPaymentMethod('PIX');
      setFirstDueDate(getDefaultDueDate('mensal'));
      setNotes('');
      const firstAvailable = perfumes.find((p) => p.stockQuantity > 0) || perfumes[0];
      setItems(
        firstAvailable
          ? [
              {
                perfumeId: firstAvailable.id,
                quantity: 1,
                unitSellingPriceBrl: firstAvailable.sellingPriceBrl,
              },
            ]
          : []
      );
    }
  }, [isOpen, editingSale]);

  if (!isOpen) return null;

  // Calculate totals
  let totalSalePrice = 0;
  let totalCostBrl = 0;

  items.forEach((item) => {
    const perfume = perfumes.find((p) => p.id === item.perfumeId);
    if (perfume) {
      totalSalePrice += item.unitSellingPriceBrl * item.quantity;
      totalCostBrl += perfume.costBrl * item.quantity;
    }
  });

  const totalProfit = totalSalePrice - totalCostBrl;
  const profitMargin = totalSalePrice > 0 ? (totalProfit / totalSalePrice) * 100 : 0;

  const remainingToInstallment = Math.max(0, totalSalePrice - downPayment);
  const installmentValue =
    installmentsCount > 0 ? remainingToInstallment / installmentsCount : remainingToInstallment;

  const handleAddItem = () => {
    const firstAvailable = perfumes.find(
      (p) => p.stockQuantity > 0 && !items.some((i) => i.perfumeId === p.id)
    ) || perfumes[0];

    if (firstAvailable) {
      setItems((prev) => [
        ...prev,
        {
          perfumeId: firstAvailable.id,
          quantity: 1,
          unitSellingPriceBrl: firstAvailable.sellingPriceBrl,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, updates: Partial<SaleDraftItem>) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, ...updates };
        if (updates.perfumeId && updates.perfumeId !== item.perfumeId) {
          const newPerfume = perfumes.find((p) => p.id === updates.perfumeId);
          if (newPerfume) {
            updated.unitSellingPriceBrl = newPerfume.sellingPriceBrl;
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setValidationError('Informe o nome do cliente antes de finalizar a venda.');
      customerNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      customerNameInputRef.current?.focus();
      return;
    }
    if (items.length === 0) {
      setValidationError('Adicione pelo menos um perfume à venda.');
      return;
    }
    setValidationError('');

    const payload = {
      customerName,
      customerPhone,
      customerAddress: customerAddress.trim(),
      saleDate,
      items,
      downPaymentBrl: isCashSale ? totalSalePrice : downPayment,
      installmentsCount: isCashSale ? 0 : installmentsCount,
      firstDueDate,
      installmentIntervalDays: frequency === 'mensal' ? 30 : 15,
      isCashSale,
      paymentMethod,
      notes,
    };

    if (editingSale && onUpdateSale) {
      onUpdateSale(editingSale.id, payload);
    } else {
      onConfirmSale(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full shadow-2xl p-5 sm:p-6 text-neutral-100 relative max-h-[92vh] flex flex-col my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            {editingSale ? <Edit2 className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-amber-200">
              {editingSale
                ? `Editar Venda #${String(editingSale.saleNumber).padStart(3, '0')}`
                : 'Registrar Nova Venda'}
            </h3>
            <p className="text-xs text-neutral-400">
              {editingSale
                ? 'Atualize dados do cliente, endereço, perfumes, valores e parcelas'
                : 'Controle de parcelas, margem de ganho, endereço no Maps e baixa de estoque'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto pr-1 space-y-5 flex-1">
          {/* Customer Details */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              1. Dados do Cliente & Endereço de Cobrança / Entrega
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">
                  Nome do Cliente *
                </label>
                <input
                  ref={customerNameInputRef}
                  type="text"
                  required
                  placeholder="Ex: Amanda Ferreira"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className={`w-full h-10 bg-neutral-900 border ${
                    validationError && !customerName.trim()
                      ? 'border-rose-500 ring-1 ring-rose-500/40'
                      : 'border-neutral-700 focus:border-amber-500/60'
                  } rounded-xl px-3 text-xs sm:text-sm text-neutral-100 leading-normal focus:outline-none`}
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">
                  WhatsApp / Telefone (para cobrança)
                </label>
                <input
                  type="text"
                  placeholder="(45) 99123-4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-10 bg-neutral-900 border border-neutral-700 focus:border-amber-500/60 rounded-xl px-3 text-xs sm:text-sm text-neutral-100 leading-normal focus:outline-none"
                />
              </div>
            </div>

            {/* Customer Address with direct Google Maps button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Endereço Completo / Ponto de Entrega</span>
                </label>
                {customerAddress.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerAddress.trim())}`,
                        '_blank',
                        'noopener,noreferrer'
                      );
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                  >
                    <span>📍 Ver rota no Google Maps ↗</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Ex: Rua Vinícius de Moraes, 340 - Centro, Cascavel - PR"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full h-10 bg-neutral-900 border border-neutral-700 focus:border-amber-500/60 rounded-xl px-3 text-xs sm:text-sm text-neutral-100 leading-normal focus:outline-none placeholder:text-neutral-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Coloque rua, número, bairro e cidade. O botão de localização abrirá o endereço exato no Google Maps com 1 clique.
              </p>
            </div>

            <div className="pt-1">
              <label className="block text-xs text-neutral-400 font-medium mb-1">
                Data da Venda
              </label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full sm:w-1/2 h-10 bg-neutral-900 border border-neutral-700 rounded-xl px-3 text-xs text-neutral-200 leading-normal focus:outline-none"
              />
            </div>
          </div>

          {/* Perfume Items Selection */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                2. Perfumes Vendidos
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar outro perfume</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedPerfume = perfumes.find((p) => p.id === item.perfumeId);

                // If editing, add back old quantity reserved for stock check
                const previouslyReservedQty =
                  editingSale?.items.find((i) => i.perfumeId === item.perfumeId)?.quantity || 0;
                const effectiveAvailableStock = (selectedPerfume?.stockQuantity ?? 0) + previouslyReservedQty;
                const isOutOfStock = effectiveAvailableStock <= 0;

                return (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-6">
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Fragrância em Estoque
                        </label>
                        <select
                          value={item.perfumeId}
                          onChange={(e) => handleItemChange(index, { perfumeId: e.target.value })}
                          className="w-full h-9 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 text-xs text-neutral-200 leading-normal focus:outline-none focus:border-amber-500/50"
                        >
                          {perfumes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.brand}) • {p.stockQuantity} un em estoque
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Qtd
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={effectiveAvailableStock > 0 ? effectiveAvailableStock : 99}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, {
                              quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="w-full h-9 bg-neutral-950 border border-neutral-700 rounded-lg px-2 text-xs font-mono text-center text-neutral-100 leading-normal focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Preço Unit. (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={item.unitSellingPriceBrl}
                          onChange={(e) =>
                            handleItemChange(index, {
                              unitSellingPriceBrl: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full h-9 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 text-xs font-mono font-bold text-amber-400 leading-normal focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedPerfume && (
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-850">
                        <span>
                          Custo de compra: <strong>{formatBrl(selectedPerfume.costBrl)}</strong> (${selectedPerfume.costUsd.toFixed(2)})
                        </span>
                        <span className="text-emerald-400 font-semibold">
                          Lucro unitário: {formatBrl(item.unitSellingPriceBrl - selectedPerfume.costBrl)}
                        </span>
                        {isOutOfStock && (
                          <span className="text-rose-400 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Aviso: estoque zerado!
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Terms & Installments */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                3. Condições de Pagamento & Parcelas
              </span>

              {/* Mode Switch: Parcelado vs Pago À Vista */}
              <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsCashSale(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    !isCashSale
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Parcelado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCashSale(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isCashSale
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pago À Vista</span>
                </button>
              </div>
            </div>

            {isCashSale ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1.5">
                    Modalidade do Pagamento À Vista *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(
                      ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Outro'] as PaymentMethod[]
                    ).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                          paymentMethod === method
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 font-medium mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Entregue em mãos, pago na hora, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-10 bg-neutral-900 border border-neutral-700 rounded-xl px-3 text-xs text-neutral-200 leading-normal focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">
                      Entrada à Vista (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={downPayment}
                      onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 bg-neutral-900 border border-neutral-700 rounded-xl px-3 text-xs sm:text-sm font-mono text-emerald-400 font-bold leading-normal focus:outline-none"
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">
                      Número de Parcelas
                    </label>
                    <select
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                      className="w-full h-10 bg-neutral-900 border border-neutral-700 rounded-xl px-3 text-xs sm:text-sm text-neutral-200 leading-normal focus:outline-none"
                    >
                      <option value={1}>1x (Parcela Única)</option>
                      <option value={2}>2x</option>
                      <option value={3}>3x</option>
                      <option value={4}>4x</option>
                      <option value={5}>5x</option>
                      <option value={6}>6x</option>
                      <option value={10}>10x</option>
                      <option value={12}>12x</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">
                      Periodicidade
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="w-full h-10 bg-neutral-900 border border-neutral-700 rounded-xl px-3 text-xs sm:text-sm text-neutral-200 leading-normal focus:outline-none"
                    >
                      <option value="mensal">Mensal (a cada 30 dias)</option>
                      <option value="quinzenal">Quinzenal (a cada 15 dias)</option>
                    </select>
                  </div>
                </div>

                {downPayment > 0 && (
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">
                      Modalidade da Entrada ({formatBrl(downPayment)})
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full sm:w-1/2 h-10 bg-neutral-900 border border-neutral-700 rounded-xl px-3 text-xs sm:text-sm text-neutral-200 leading-normal focus:outline-none"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Vencimento da 1ª Parcela</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                      className="w-full h-10 bg-neutral-900 border border-neutral-700 rounded-xl px-3 text-xs text-neutral-200 leading-normal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 font-medium mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Entregue em mãos, vizinho, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-10 bg-neutral-900 border border-neutral-700 rounded-xl px-3 text-xs text-neutral-200 leading-normal focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Financial Summary Box */}
            <div className="bg-gradient-to-r from-amber-950/30 to-emerald-950/20 border border-amber-500/30 rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                    Valor Total da Venda
                  </span>
                  <p className="font-mono text-base font-bold text-neutral-100 mt-0.5">
                    {formatBrl(totalSalePrice)}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                    {isCashSale ? 'Pagamento' : 'Valor da Parcela'}
                  </span>
                  <p
                    className={`font-mono text-base font-bold mt-0.5 ${
                      isCashSale ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isCashSale
                      ? `À Vista (${paymentMethod})`
                      : `${installmentsCount}x de ${formatBrl(installmentValue)}`}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                    Custo Mercadoria
                  </span>
                  <p className="font-mono text-base text-neutral-300 mt-0.5">
                    {formatBrl(totalCostBrl)}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                    Lucro Líquido
                  </span>
                  <p className="font-mono text-base font-bold text-emerald-400 mt-0.5">
                    {formatBrl(totalProfit)} ({profitMargin.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

          {validationError && (
            <div className="mt-3 px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Pinned Action buttons */}
          <div className="flex items-center gap-3 pt-4 mt-3 border-t border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
            >
              {editingSale ? 'Salvar Alterações da Venda' : 'Finalizar Venda & Gerar Parcelas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
