import { useState, useEffect } from 'react';
import {
  Perfume,
  Sale,
  Installment,
  PaymentLog,
  AppSettings,
  SaleItem,
  PaymentMethod,
} from '../types';
import {
  INITIAL_PERFUMES,
  INITIAL_SALES,
  INITIAL_INSTALLMENTS,
  INITIAL_PAYMENT_LOGS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import { getTodayDateString } from '../utils/currency';

const STORAGE_KEYS = {
  PERFUMES: 'sultan_oud_perfumes_v1',
  SALES: 'sultan_oud_sales_v1',
  INSTALLMENTS: 'sultan_oud_installments_v1',
  PAYMENTS: 'sultan_oud_payments_v1',
  SETTINGS: 'sultan_oud_settings_v1',
};

export function usePerfumeStore() {
  const [perfumes, setPerfumes] = useState<Perfume[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERFUMES);
      return saved ? JSON.parse(saved) : INITIAL_PERFUMES;
    } catch {
      return INITIAL_PERFUMES;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [installments, setInstallments] = useState<Installment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS);
      return saved ? JSON.parse(saved) : INITIAL_INSTALLMENTS;
    } catch {
      return INITIAL_INSTALLMENTS;
    }
  });

  const [payments, setPayments] = useState<PaymentLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENT_LOGS;
    } catch {
      return INITIAL_PAYMENT_LOGS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!saved) return INITIAL_SETTINGS;
      const parsed = JSON.parse(saved) as AppSettings;
      const legacyNames = ['Sultan Perfumes Árabes', 'Sultan Oud', 'Sultan Oud Perfumes', 'SULTAN OUD'];
      if (!parsed.storeName || legacyNames.includes(parsed.storeName.trim())) {
        return { ...parsed, storeName: 'Eloah Importados' };
      }
      return parsed;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERFUMES, JSON.stringify(perfumes));
  }, [perfumes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments));
  }, [installments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Actions
  const addPerfume = (newPerfume: Omit<Perfume, 'id' | 'costBrl'> & { costBrl?: number }) => {
    const rate = newPerfume.exchangeRate || settings.dollarRate || 5.50;
    const costBrl = newPerfume.costBrl ?? Number((newPerfume.costUsd * rate).toFixed(2));
    const perfume: Perfume = {
      ...newPerfume,
      id: `p-${Date.now()}`,
      exchangeRate: rate,
      costBrl,
    };
    setPerfumes((prev) => [perfume, ...prev]);
    return perfume;
  };

  const updatePerfume = (id: string, updates: Partial<Perfume>) => {
    setPerfumes((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const rate = updates.exchangeRate ?? item.exchangeRate ?? settings.dollarRate;
        const costUsd = updates.costUsd ?? item.costUsd;
        const costBrl = updates.costBrl ?? Number((costUsd * rate).toFixed(2));
        return {
          ...item,
          ...updates,
          exchangeRate: rate,
          costBrl,
        };
      })
    );
  };

  const deletePerfume = (id: string) => {
    setPerfumes((prev) => prev.filter((item) => item.id !== id));
  };

  const adjustStock = (id: string, delta: number) => {
    setPerfumes((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = Math.max(0, item.stockQuantity + delta);
        return { ...item, stockQuantity: updated };
      })
    );
  };

  const updateDollarRate = (newRate: number, applyToAllInventory: boolean) => {
    setSettings((prev) => ({ ...prev, dollarRate: newRate }));
    if (applyToAllInventory) {
      setPerfumes((prev) =>
        prev.map((p) => ({
          ...p,
          exchangeRate: newRate,
          costBrl: Number((p.costUsd * newRate).toFixed(2)),
        }))
      );
    }
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Add Sale with automatic stock deduction and installment creation
  const addSale = (saleData: {
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
    installmentIntervalDays?: number; // default 30 days
    isCashSale?: boolean;
    paymentMethod?: PaymentMethod;
    notes?: string;
  }) => {
    const saleId = `sale-${Date.now()}`;
    const intervalDays = saleData.installmentIntervalDays || 30;
    const paymentMethod: PaymentMethod = saleData.paymentMethod || 'PIX';

    let totalCostBrl = 0;
    let totalSellingPriceBrl = 0;
    const saleItems: SaleItem[] = [];

    // Build sale items synchronously from current perfumes state
    saleData.items.forEach((itemInSale) => {
      const p = perfumes.find((perf) => perf.id === itemInSale.perfumeId);
      if (p) {
        const itemTotalSale = itemInSale.unitSellingPriceBrl * itemInSale.quantity;
        const itemTotalCost = p.costBrl * itemInSale.quantity;
        const itemTotalProfit = itemTotalSale - itemTotalCost;
        const itemUnitProfit = itemInSale.unitSellingPriceBrl - p.costBrl;

        saleItems.push({
          perfumeId: p.id,
          perfumeName: p.name,
          brand: p.brand,
          quantity: itemInSale.quantity,
          unitCostUsd: p.costUsd,
          unitCostBrl: p.costBrl,
          unitSellingPriceBrl: itemInSale.unitSellingPriceBrl,
          totalSellingPriceBrl: itemTotalSale,
          unitProfitBrl: itemUnitProfit,
          totalProfitBrl: itemTotalProfit,
        });

        totalCostBrl += itemTotalCost;
        totalSellingPriceBrl += itemTotalSale;
      }
    });

    // Deduct stock
    setPerfumes((prev) =>
      prev.map((p) => {
        const itemInSale = saleData.items.find((si) => si.perfumeId === p.id);
        if (itemInSale) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - itemInSale.quantity),
          };
        }
        return p;
      })
    );

    const totalProfitBrl = totalSellingPriceBrl - totalCostBrl;
    const profitMarginPercent = totalSellingPriceBrl > 0 ? (totalProfitBrl / totalSellingPriceBrl) * 100 : 0;

    const isPaidInFull =
      Boolean(saleData.isCashSale) || saleData.downPaymentBrl >= totalSellingPriceBrl;
    const effectiveDownPayment = isPaidInFull ? totalSellingPriceBrl : saleData.downPaymentBrl;
    const remainingAmount = Math.max(0, totalSellingPriceBrl - effectiveDownPayment);
    const count = isPaidInFull ? 0 : Math.max(1, saleData.installmentsCount);
    const installmentValue = count > 0 ? Number((remainingAmount / count).toFixed(2)) : 0;

    const newSale: Sale = {
      id: saleId,
      saleNumber: sales.length + 1,
      customerName: saleData.customerName.trim(),
      customerPhone: saleData.customerPhone.trim(),
      customerAddress: saleData.customerAddress?.trim() || '',
      saleDate: saleData.saleDate,
      items: saleItems,
      totalCostBrl,
      totalSellingPriceBrl,
      totalProfitBrl,
      profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
      downPaymentBrl: effectiveDownPayment,
      installmentsCount: count,
      installmentValueBrl: installmentValue,
      isCashSale: isPaidInFull,
      paymentMethod,
      status: isPaidInFull ? 'Quitado' : 'Ativo',
      notes: saleData.notes,
    };

    // Generate installments (only if not paid in full)
    const perfumeNames = saleItems.map((si) => `${si.perfumeName} (${si.quantity}x)`).join(', ');
    const newInstallments: Installment[] = [];

    if (!isPaidInFull && count > 0) {
      const [startYear, startMonth, startDay] = saleData.firstDueDate.split('-').map(Number);
      const firstDateObj = new Date(startYear, startMonth - 1, startDay);

      for (let i = 1; i <= count; i++) {
        const dueDateObj = new Date(firstDateObj);
        if (intervalDays === 30) {
          dueDateObj.setMonth(dueDateObj.getMonth() + (i - 1));
        } else {
          dueDateObj.setDate(dueDateObj.getDate() + (i - 1) * intervalDays);
        }

        const dueYear = dueDateObj.getFullYear();
        const dueMonth = String(dueDateObj.getMonth() + 1).padStart(2, '0');
        const dueDay = String(dueDateObj.getDate()).padStart(2, '0');
        const dueDateStr = `${dueYear}-${dueMonth}-${dueDay}`;

        newInstallments.push({
          id: `inst-${saleId}-${i}`,
          saleId,
          installmentNumber: i,
          totalInstallments: count,
          customerName: saleData.customerName.trim(),
          customerPhone: saleData.customerPhone.trim(),
          customerAddress: saleData.customerAddress?.trim() || '',
          perfumeSummary: perfumeNames,
          amount: installmentValue,
          dueDate: dueDateStr,
          status: 'Pendente',
        });
      }
    }

    // Record cash payment or down payment in payment history immediately
    const newPayments: PaymentLog[] = [];
    if (effectiveDownPayment > 0) {
      newPayments.push({
        id: `pay-dp-${saleId}`,
        installmentId: isPaidInFull ? `cash-${saleId}` : `downpayment-${saleId}`,
        saleId,
        customerName: saleData.customerName.trim(),
        customerPhone: saleData.customerPhone.trim(),
        perfumeSummary: perfumeNames,
        installmentInfo: isPaidInFull ? 'Pagamento À Vista' : 'Entrada à Vista',
        amount: effectiveDownPayment,
        paidDate: saleData.saleDate,
        paymentMethod,
        notes: isPaidInFull
          ? `Compra quitada à vista (${paymentMethod})`
          : `Entrada paga no ato da compra (${paymentMethod})`,
      });
    }

    setSales((prev) => [newSale, ...prev]);
    if (newInstallments.length > 0) {
      setInstallments((prev) => [...newInstallments, ...prev]);
    }
    if (newPayments.length > 0) {
      setPayments((prev) => [...newPayments, ...prev]);
    }

    return { sale: newSale, installments: newInstallments };
  };

  // Receive installment payment
  const receiveInstallmentPayment = (
    installmentId: string,
    paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Transferência' | 'Outro',
    paidDate: string,
    paidAmount?: number,
    notes?: string
  ) => {
    let targetInstallment: Installment | undefined;

    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id === installmentId) {
          const finalAmount = paidAmount !== undefined && paidAmount > 0 ? paidAmount : inst.amount;
          targetInstallment = {
            ...inst,
            status: 'Pago',
            paidDate: paidDate || getTodayDateString(),
            paidAmount: finalAmount,
            paymentMethod,
            notes: notes ? `${inst.notes || ''} ${notes}`.trim() : inst.notes,
          };
          return targetInstallment;
        }
        return inst;
      })
    );

    if (targetInstallment) {
      const inst = targetInstallment;
      const newPaymentLog: PaymentLog = {
        id: `pay-${Date.now()}`,
        installmentId: inst.id,
        saleId: inst.saleId,
        customerName: inst.customerName,
        customerPhone: inst.customerPhone,
        perfumeSummary: inst.perfumeSummary,
        installmentInfo: `Parcela ${inst.installmentNumber} de ${inst.totalInstallments}`,
        amount: inst.paidAmount || inst.amount,
        paidDate: paidDate || getTodayDateString(),
        paymentMethod,
        notes,
      };

      setPayments((prev) => [newPaymentLog, ...prev]);

      // Check if all installments for this sale are paid
      setTimeout(() => {
        setInstallments((currentInsts) => {
          const saleInsts = currentInsts.filter((i) => i.saleId === inst.saleId);
          const allPaid = saleInsts.length > 0 && saleInsts.every((i) => i.status === 'Pago');
          if (allPaid) {
            setSales((prevSales) =>
              prevSales.map((s) => (s.id === inst.saleId ? { ...s, status: 'Quitado' } : s))
            );
          }
          return currentInsts;
        });
      }, 50);
    }
  };

  const undoInstallmentPayment = (installmentId: string) => {
    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id === installmentId) {
          return {
            ...inst,
            status: 'Pendente',
            paidDate: undefined,
            paidAmount: undefined,
            paymentMethod: undefined,
          };
        }
        return inst;
      })
    );

    // Remove from payments log
    setPayments((prev) => prev.filter((p) => p.installmentId !== installmentId));

    // Also update sale status to 'Ativo' if it was 'Quitado'
    const target = installments.find((i) => i.id === installmentId);
    if (target) {
      setSales((prev) =>
        prev.map((s) => (s.id === target.saleId ? { ...s, status: 'Ativo' } : s))
      );
    }
  };

  // Cancel sale and optionally restore stock to inventory
  const cancelSale = (saleId: string, restoreStock: boolean = true) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return;

    // Restore stock if requested and not already canceled
    if (restoreStock && targetSale.status !== 'Cancelado') {
      setPerfumes((prev) =>
        prev.map((p) => {
          const itemInSale = targetSale.items.find((si) => si.perfumeId === p.id);
          if (itemInSale) {
            return {
              ...p,
              stockQuantity: p.stockQuantity + itemInSale.quantity,
            };
          }
          return p;
        })
      );
    }

    // Mark sale as Cancelado
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: 'Cancelado' } : s))
    );

    // Remove pending installments for this canceled sale
    setInstallments((prev) =>
      prev.filter((i) => i.saleId !== saleId || i.status === 'Pago')
    );
  };

  // Permanently delete a sale
  const deleteSale = (saleId: string, restoreStock: boolean = true) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (targetSale && restoreStock && targetSale.status !== 'Cancelado') {
      setPerfumes((prev) =>
        prev.map((p) => {
          const itemInSale = targetSale.items.find((si) => si.perfumeId === p.id);
          if (itemInSale) {
            return {
              ...p,
              stockQuantity: p.stockQuantity + itemInSale.quantity,
            };
          }
          return p;
        })
      );
    }

    setSales((prev) => prev.filter((s) => s.id !== saleId));
    setInstallments((prev) => prev.filter((i) => i.saleId !== saleId));
    setPayments((prev) => prev.filter((p) => p.saleId !== saleId));
  };

  // Update existing sale with stock reconciliation and installment regeneration
  const updateSale = (
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
  ) => {
    const oldSale = sales.find((s) => s.id === saleId);
    if (!oldSale) return undefined;

    const intervalDays = saleData.installmentIntervalDays || 30;
    const paymentMethod: PaymentMethod = saleData.paymentMethod || oldSale.paymentMethod || 'PIX';

    let totalCostBrl = 0;
    let totalSellingPriceBrl = 0;
    const newSaleItems: SaleItem[] = [];

    saleData.items.forEach((newItem) => {
      const p = perfumes.find((perf) => perf.id === newItem.perfumeId);
      if (p) {
        const itemTotalSale = newItem.unitSellingPriceBrl * newItem.quantity;
        const itemTotalCost = p.costBrl * newItem.quantity;
        const itemTotalProfit = itemTotalSale - itemTotalCost;
        const itemUnitProfit = newItem.unitSellingPriceBrl - p.costBrl;

        newSaleItems.push({
          perfumeId: p.id,
          perfumeName: p.name,
          brand: p.brand,
          quantity: newItem.quantity,
          unitCostUsd: p.costUsd,
          unitCostBrl: p.costBrl,
          unitSellingPriceBrl: newItem.unitSellingPriceBrl,
          totalSellingPriceBrl: itemTotalSale,
          unitProfitBrl: itemUnitProfit,
          totalProfitBrl: itemTotalProfit,
        });

        totalCostBrl += itemTotalCost;
        totalSellingPriceBrl += itemTotalSale;
      }
    });

    // Adjust perfume stock
    setPerfumes((prevPerfumes) =>
      prevPerfumes.map((p) => {
        const oldItem = oldSale.items.find((si) => si.perfumeId === p.id);
        const oldQty = oldItem ? oldItem.quantity : 0;

        const newItem = saleData.items.find((si) => si.perfumeId === p.id);
        const newQty = newItem ? newItem.quantity : 0;

        const netDelta = oldQty - newQty;
        return {
          ...p,
          stockQuantity: Math.max(0, p.stockQuantity + netDelta),
        };
      })
    );

    const totalProfitBrl = totalSellingPriceBrl - totalCostBrl;
    const profitMarginPercent =
      totalSellingPriceBrl > 0 ? (totalProfitBrl / totalSellingPriceBrl) * 100 : 0;

    const isPaidInFull =
      Boolean(saleData.isCashSale) || saleData.downPaymentBrl >= totalSellingPriceBrl;
    const effectiveDownPayment = isPaidInFull ? totalSellingPriceBrl : saleData.downPaymentBrl;
    const remainingAmount = Math.max(0, totalSellingPriceBrl - effectiveDownPayment);
    const count = isPaidInFull ? 0 : Math.max(1, saleData.installmentsCount);
    const installmentValue = count > 0 ? Number((remainingAmount / count).toFixed(2)) : 0;

    const updatedSaleObj: Sale = {
      ...oldSale,
      customerName: saleData.customerName.trim(),
      customerPhone: saleData.customerPhone.trim(),
      customerAddress: saleData.customerAddress?.trim() || '',
      saleDate: saleData.saleDate,
      items: newSaleItems,
      totalCostBrl,
      totalSellingPriceBrl,
      totalProfitBrl,
      profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
      downPaymentBrl: effectiveDownPayment,
      installmentsCount: count,
      installmentValueBrl: installmentValue,
      isCashSale: isPaidInFull,
      paymentMethod,
      status: isPaidInFull ? 'Quitado' : 'Ativo',
      notes: saleData.notes,
    };

    // Update sale object
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? updatedSaleObj : s))
    );

    // Update installments
    const perfumeNames = newSaleItems
      .map((si) => `${si.perfumeName} (${si.quantity}x)`)
      .join(', ');
    const regenerated: Installment[] = [];

    if (!isPaidInFull && count > 0) {
      const existingPaidInstallments = installments.filter(
        (i) => i.saleId === saleId && i.status === 'Pago'
      );
      const [startYear, startMonth, startDay] = saleData.firstDueDate.split('-').map(Number);
      const firstDateObj = new Date(startYear, startMonth - 1, startDay);

      for (let i = 1; i <= count; i++) {
        const existingPaid = existingPaidInstallments.find((ep) => ep.installmentNumber === i);

        if (existingPaid) {
          regenerated.push({
            ...existingPaid,
            customerName: saleData.customerName.trim(),
            customerPhone: saleData.customerPhone.trim(),
            customerAddress: saleData.customerAddress?.trim() || '',
            perfumeSummary: perfumeNames,
            totalInstallments: count,
          });
        } else {
          const dueDateObj = new Date(firstDateObj);
          if (intervalDays === 30) {
            dueDateObj.setMonth(dueDateObj.getMonth() + (i - 1));
          } else {
            dueDateObj.setDate(dueDateObj.getDate() + (i - 1) * intervalDays);
          }

          const dueYear = dueDateObj.getFullYear();
          const dueMonth = String(dueDateObj.getMonth() + 1).padStart(2, '0');
          const dueDay = String(dueDateObj.getDate()).padStart(2, '0');
          const dueDateStr = `${dueYear}-${dueMonth}-${dueDay}`;

          regenerated.push({
            id: `inst-${saleId}-${i}`,
            saleId,
            installmentNumber: i,
            totalInstallments: count,
            customerName: saleData.customerName.trim(),
            customerPhone: saleData.customerPhone.trim(),
            customerAddress: saleData.customerAddress?.trim() || '',
            perfumeSummary: perfumeNames,
            amount: installmentValue,
            dueDate: dueDateStr,
            status: 'Pendente',
          });
        }
      }
    }

    setInstallments((prev) => {
      const otherInstallments = prev.filter((i) => i.saleId !== saleId);
      return [...regenerated, ...otherInstallments];
    });

    return { sale: updatedSaleObj, installments: regenerated };
  };

  // Update individual installment due date
  const updateInstallmentDueDate = (installmentId: string, newDueDate: string) => {
    if (!newDueDate) return;
    setInstallments((prev) =>
      prev.map((inst) =>
        inst.id === installmentId ? { ...inst, dueDate: newDueDate } : inst
      )
    );
  };

  // Reset to initial receipt data
  const resetToInvoiceData = () => {
    setPerfumes(INITIAL_PERFUMES);
    setSales(INITIAL_SALES);
    setInstallments(INITIAL_INSTALLMENTS);
    setPayments(INITIAL_PAYMENT_LOGS);
    setSettings(INITIAL_SETTINGS);
  };

  // Export & Import backup JSON
  const exportDataJson = () => {
    const backup = {
      perfumes,
      sales,
      installments,
      payments,
      settings,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.perfumes && Array.isArray(parsed.perfumes)) {
        setPerfumes(parsed.perfumes);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.installments) setInstallments(parsed.installments);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.settings) setSettings(parsed.settings);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    perfumes,
    sales,
    installments,
    payments,
    settings,
    addPerfume,
    updatePerfume,
    deletePerfume,
    adjustStock,
    updateDollarRate,
    updateSettings,
    addSale,
    updateSale,
    cancelSale,
    deleteSale,
    receiveInstallmentPayment,
    undoInstallmentPayment,
    updateInstallmentDueDate,
    resetToInvoiceData,
    exportDataJson,
    importDataJson,
  };
}
