import { useState, useRef } from 'react';
import {
  X,
  Settings,
  DollarSign,
  Download,
  Upload,
  RotateCcw,
  Check,
  Key,
  Store,
  Percent,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings } from '../types';
import { formatBrl } from '../utils/currency';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportJson: () => string;
  onImportJson: (json: string) => boolean;
  onResetInvoiceData: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportJson,
  onImportJson,
  onResetInvoiceData,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const [dollarRate, setDollarRate] = useState<number>(settings.dollarRate || 5.50);
  const [storeName, setStoreName] = useState(settings.storeName || '');
  const [sellerName, setSellerName] = useState(settings.sellerName || '');
  const [pixKey, setPixKey] = useState(settings.pixKey || '');
  const [pixType, setPixType] = useState(settings.pixType || 'Celular');
  const [defaultMarkup, setDefaultMarkup] = useState<number>(settings.defaultMarkupPercent || 120);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      dollarRate,
      storeName: storeName.trim(),
      sellerName: sellerName.trim(),
      pixKey: pixKey.trim(),
      pixType,
      defaultMarkupPercent: defaultMarkup,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleExport = () => {
    const dataStr = onExportJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-perfumes-arabes-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImportJson(content);
      if (success) {
        setImportStatus('Backup restaurado com sucesso!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Erro: Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full shadow-2xl p-5 sm:p-7 text-neutral-100 relative max-h-[92vh] flex flex-col my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-amber-200">
              Configurações & Chave PIX
            </h3>
            <p className="text-xs text-neutral-400">
              Personalize cobranças do WhatsApp, cotação base do dólar e backups
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="overflow-y-auto pr-1 space-y-5">
          {/* Cotação do Dólar & Marcação */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-850 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Câmbio Padrão & Margem
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">
                  Cotação Dólar Base (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={dollarRate}
                    onChange={(e) => setDollarRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-xl py-2 pl-9 pr-3 text-sm font-mono font-bold text-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">
                  Markup Sugerido Padrão (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                    %
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={defaultMarkup}
                    onChange={(e) => setDefaultMarkup(parseInt(e.target.value, 10) || 100)}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-xl py-2 pl-8 pr-3 text-sm font-mono text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dados para Cobrança PIX */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-850 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-400" />
              Chave PIX para Cobrança no WhatsApp
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs text-neutral-400 mb-1">Tipo de Chave</label>
                <select
                  value={pixType}
                  onChange={(e) => setPixType(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-xl py-2 px-3 text-xs sm:text-sm text-neutral-200 focus:outline-none"
                >
                  <option value="Celular">Celular</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Aleatória">Chave Aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">Chave PIX</label>
                <input
                  type="text"
                  placeholder="Ex: 45991234567 ou email@exemplo.com"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-xl py-2 px-3 text-xs sm:text-sm text-neutral-100 font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Nome do Vendedor / Favorecido
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aline Sales"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-xl py-2 px-3 text-xs sm:text-sm text-neutral-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Nome da Loja / Marca
                </label>
                <input
                  type="text"
                  placeholder="Ex: Eloah Importados"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-xl py-2 px-3 text-xs sm:text-sm text-neutral-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Backup e Restauração */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-850 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
              Backup e Dados
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Restaurar Backup (JSON)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            {importStatus && (
              <p className="text-xs font-semibold text-emerald-400 bg-emerald-950/30 p-2 rounded-lg text-center">
                {importStatus}
              </p>
            )}

            <div className="pt-2 border-t border-neutral-850">
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      'Tem certeza que deseja restaurar o estoque inicial da Nota Fiscal de 25 frascos? Dados não salvos serão redefinidos.'
                    )
                  ) {
                    onResetInvoiceData();
                    onClose();
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Estoque da Nota Original (25 frascos)</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs sm:text-sm font-semibold transition"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <span>Salvar Configurações</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
