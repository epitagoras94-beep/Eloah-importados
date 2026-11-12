import { useState } from 'react';
import { usePerfumeStore } from './hooks/usePerfumeStore';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { InventoryTab } from './components/InventoryTab';
import { SalesAndInstallmentsTab } from './components/SalesAndInstallmentsTab';
import { PaymentHistoryTab } from './components/PaymentHistoryTab';
import { ReportsTab } from './components/ReportsTab';
import { DollarRateModal } from './components/DollarRateModal';
import { InvoiceModal } from './components/InvoiceModal';
import { NewSaleModal } from './components/NewSaleModal';
import { NewPerfumeModal } from './components/NewPerfumeModal';
import { WhatsAppCollectionModal } from './components/WhatsAppCollectionModal';
import { ReceivePaymentModal } from './components/ReceivePaymentModal';
import { SettingsModal } from './components/SettingsModal';
import { CancelSaleModal } from './components/CancelSaleModal';
import { SaleConfirmationModal } from './components/SaleConfirmationModal';
import { Perfume, Installment, Sale } from './types';
import { getInstallmentUrgency } from './utils/currency';

export default function App() {
  const {
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
  } = usePerfumeStore();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'inventory' | 'sales' | 'payments' | 'reports'
  >('dashboard');

  // Modal States
  const [isDollarModalOpen, setIsDollarModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [cancelingSale, setCancelingSale] = useState<Sale | null>(null);
  const [isNewPerfumeModalOpen, setIsNewPerfumeModalOpen] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<Perfume | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Installment & Sale confirmation modals
  const [activeWhatsAppInstallment, setActiveWhatsAppInstallment] = useState<Installment | null>(
    null
  );
  const [activeReceiveInstallment, setActiveReceiveInstallment] = useState<Installment | null>(
    null
  );
  const [confirmationData, setConfirmationData] = useState<{
    sale: Sale;
    installments: Installment[];
  } | null>(null);

  // Counters for Navbar badges
  const pendingInstallmentsCount = installments.filter((i) => i.status !== 'Pago').length;
  const overdueInstallmentsCount = installments.filter((i) => {
    return i.status !== 'Pago' && getInstallmentUrgency(i.dueDate, false).status === 'Atrasado';
  }).length;

  // Handlers
  const handleOpenEditPerfume = (perfume: Perfume) => {
    setEditingPerfume(perfume);
    setIsNewPerfumeModalOpen(true);
  };

  const handleSavePerfume = (perfumeData: Omit<Perfume, 'id'>, editId?: string) => {
    if (editId) {
      updatePerfume(editId, perfumeData);
    } else {
      addPerfume(perfumeData);
    }
  };

  const handleOpenNewSaleWithPerfume = (perfume: Perfume) => {
    setIsNewSaleModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storeName={settings.storeName}
        dollarRate={settings.dollarRate}
        openDollarModal={() => setIsDollarModalOpen(true)}
        openNewSaleModal={() => setIsNewSaleModalOpen(true)}
        openNewPerfumeModal={() => {
          setEditingPerfume(null);
          setIsNewPerfumeModalOpen(true);
        }}
        openInvoiceModal={() => setIsInvoiceModalOpen(true)}
        openSettingsModal={() => setIsSettingsModalOpen(true)}
        pendingInstallmentsCount={pendingInstallmentsCount}
        overdueInstallmentsCount={overdueInstallmentsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab
            perfumes={perfumes}
            sales={sales}
            installments={installments}
            payments={payments}
            settings={settings}
            openNewSaleModal={() => setIsNewSaleModalOpen(true)}
            openNewPerfumeModal={() => {
              setEditingPerfume(null);
              setIsNewPerfumeModalOpen(true);
            }}
            openWhatsAppModal={(inst) => setActiveWhatsAppInstallment(inst)}
            openReceivePaymentModal={(inst) => setActiveReceiveInstallment(inst)}
            openInvoiceModal={() => setIsInvoiceModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            perfumes={perfumes}
            dollarRate={settings.dollarRate}
            openNewPerfumeModal={() => {
              setEditingPerfume(null);
              setIsNewPerfumeModalOpen(true);
            }}
            openEditPerfumeModal={handleOpenEditPerfume}
            deletePerfume={deletePerfume}
            adjustStock={adjustStock}
            openNewSaleWithPerfume={handleOpenNewSaleWithPerfume}
            openInvoiceModal={() => setIsInvoiceModalOpen(true)}
            openDollarModal={() => setIsDollarModalOpen(true)}
          />
        )}

        {activeTab === 'sales' && (
          <SalesAndInstallmentsTab
            sales={sales}
            installments={installments}
            settings={settings}
            openNewSaleModal={() => {
              setEditingSale(null);
              setIsNewSaleModalOpen(true);
            }}
            openEditSaleModal={(sale) => {
              setEditingSale(sale);
              setIsNewSaleModalOpen(true);
            }}
            openCancelSaleModal={(sale) => {
              setCancelingSale(sale);
            }}
            openWhatsAppModal={(inst) => setActiveWhatsAppInstallment(inst)}
            openSaleConfirmationModal={(sale) => {
              const saleInsts = installments.filter((i) => i.saleId === sale.id);
              setConfirmationData({ sale, installments: saleInsts });
            }}
            openReceivePaymentModal={(inst) => setActiveReceiveInstallment(inst)}
            undoInstallmentPayment={undoInstallmentPayment}
            onUpdateInstallmentDueDate={updateInstallmentDueDate}
            deleteSale={deleteSale}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentHistoryTab payments={payments} settings={settings} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            perfumes={perfumes}
            sales={sales}
            installments={installments}
            payments={payments}
            settings={settings}
            openInvoiceModal={() => setIsInvoiceModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif-luxury tracking-wider font-semibold text-neutral-400 uppercase">
              {settings.storeName || 'Eloah Importados'}
            </span>
            <span>•</span>
            <span>Gestão de Perfumes Árabes & Contas a Receber</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <span>Dólar Base: R$ {settings.dollarRate.toFixed(2)}</span>
            <span>•</span>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="hover:text-amber-300 underline"
            >
              Nota Fiscal Original ($460.91)
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-amber-300 underline"
            >
              Chave PIX & Backup
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DollarRateModal
        isOpen={isDollarModalOpen}
        onClose={() => setIsDollarModalOpen(false)}
        currentRate={settings.dollarRate}
        onSave={(newRate, applyToInventory) => updateDollarRate(newRate, applyToInventory)}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        dollarRate={settings.dollarRate}
      />

      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => {
          setIsNewSaleModalOpen(false);
          setEditingSale(null);
        }}
        perfumes={perfumes}
        dollarRate={settings.dollarRate}
        editingSale={editingSale}
        onConfirmSale={(saleData) => {
          const result = addSale(saleData);
          if (result) {
            setConfirmationData(result);
          }
        }}
        onUpdateSale={(saleId, saleData) => {
          const result = updateSale(saleId, saleData);
          if (result) {
            setConfirmationData(result);
          }
        }}
      />

      <SaleConfirmationModal
        isOpen={!!confirmationData}
        onClose={() => setConfirmationData(null)}
        sale={confirmationData?.sale || null}
        installments={confirmationData?.installments || []}
        settings={settings}
        onUpdateDueDate={(installmentId, newDueDate) => {
          updateInstallmentDueDate(installmentId, newDueDate);
          setConfirmationData((prev) =>
            prev
              ? {
                  ...prev,
                  installments: prev.installments.map((inst) =>
                    inst.id === installmentId ? { ...inst, dueDate: newDueDate } : inst
                  ),
                }
              : null
          );
        }}
      />

      <CancelSaleModal
        isOpen={!!cancelingSale}
        onClose={() => setCancelingSale(null)}
        sale={cancelingSale}
        onConfirmCancel={cancelSale}
      />

      <NewPerfumeModal
        isOpen={isNewPerfumeModalOpen}
        onClose={() => {
          setIsNewPerfumeModalOpen(false);
          setEditingPerfume(null);
        }}
        editingPerfume={editingPerfume}
        currentDollarRate={settings.dollarRate}
        onSavePerfume={handleSavePerfume}
      />

      <WhatsAppCollectionModal
        isOpen={!!activeWhatsAppInstallment}
        onClose={() => setActiveWhatsAppInstallment(null)}
        installment={activeWhatsAppInstallment}
        settings={settings}
      />

      <ReceivePaymentModal
        isOpen={!!activeReceiveInstallment}
        onClose={() => setActiveReceiveInstallment(null)}
        installment={activeReceiveInstallment}
        settings={settings}
        onConfirm={receiveInstallmentPayment}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onExportJson={exportDataJson}
        onImportJson={importDataJson}
        onResetInvoiceData={resetToInvoiceData}
      />
    </div>
  );
}
