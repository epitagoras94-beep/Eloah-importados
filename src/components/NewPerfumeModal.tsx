import { useState, useEffect, useRef } from 'react';
import { X, Package, DollarSign, Upload, Image as ImageIcon, Trash2, Link as LinkIcon } from 'lucide-react';
import { Perfume, Gender } from '../types';
import { formatBrl, formatUsd } from '../utils/currency';

interface NewPerfumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPerfume?: Perfume | null;
  currentDollarRate: number;
  onSavePerfume: (perfumeData: Omit<Perfume, 'id'>, editId?: string) => void;
}

// Compress uploaded image to max 500x500 JPEG so localStorage stays lightweight
function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const maxSize = 500;
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export function NewPerfumeModal({
  isOpen,
  onClose,
  editingPerfume,
  currentDollarRate,
  onSavePerfume,
}: NewPerfumeModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(editingPerfume?.name || '');
  const [brand, setBrand] = useState(editingPerfume?.brand || 'Lattafa');
  const [code, setCode] = useState(editingPerfume?.code || '');
  const [volume, setVolume] = useState(editingPerfume?.volume || '100ml');
  const [gender, setGender] = useState<Gender>(editingPerfume?.gender || 'UNISSEX');
  const [costUsd, setCostUsd] = useState<number>(editingPerfume?.costUsd || 20);
  const [exchangeRate, setExchangeRate] = useState<number>(
    editingPerfume?.exchangeRate || currentDollarRate
  );
  const [sellingPriceBrl, setSellingPriceBrl] = useState<number>(
    editingPerfume?.sellingPriceBrl || 250
  );
  const [stockQuantity, setStockQuantity] = useState<number>(
    editingPerfume?.stockQuantity !== undefined ? editingPerfume.stockQuantity : 2
  );
  const [imageUrl, setImageUrl] = useState<string>(editingPerfume?.imageUrl || '');
  const [imageError, setImageError] = useState<string>('');
  const [notes, setNotes] = useState(editingPerfume?.notes || '');

  useEffect(() => {
    if (!isOpen) return;
    setName(editingPerfume?.name || '');
    setBrand(editingPerfume?.brand || 'Lattafa');
    setCode(editingPerfume?.code || '');
    setVolume(editingPerfume?.volume || '100ml');
    setGender(editingPerfume?.gender || 'UNISSEX');
    setCostUsd(editingPerfume?.costUsd || 20);
    setExchangeRate(editingPerfume?.exchangeRate || currentDollarRate);
    setSellingPriceBrl(editingPerfume?.sellingPriceBrl || 250);
    setStockQuantity(
      editingPerfume?.stockQuantity !== undefined ? editingPerfume.stockQuantity : 2
    );
    setImageUrl(editingPerfume?.imageUrl || '');
    setImageError('');
    setNotes(editingPerfume?.notes || '');
  }, [isOpen, editingPerfume, currentDollarRate]);

  if (!isOpen) return null;

  // Calculated BRL cost
  const calculatedCostBrl = Number((costUsd * exchangeRate).toFixed(2));
  const unitProfitBrl = sellingPriceBrl - calculatedCostBrl;
  const marginPercent = sellingPriceBrl > 0 ? (unitProfitBrl / sellingPriceBrl) * 100 : 0;
  const markupPercent = calculatedCostBrl > 0 ? (unitProfitBrl / calculatedCostBrl) * 100 : 0;

  // Apply quick markup helper
  const applyMarkup = (percent: number) => {
    const suggested = calculatedCostBrl * (1 + percent / 100);
    // Round nicely to closest 5 or 10
    setSellingPriceBrl(Math.ceil(suggested / 5) * 5);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    try {
      const compressed = await compressImageToDataUrl(file);
      setImageUrl(compressed);
    } catch {
      setImageError('Não foi possível processar esta imagem. Tente outro arquivo.');
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSavePerfume(
      {
        name: name.trim(),
        brand: brand.trim(),
        code: code.trim() || `COD-${Date.now().toString().slice(-4)}`,
        volume,
        gender,
        costUsd,
        exchangeRate,
        costBrl: calculatedCostBrl,
        sellingPriceBrl,
        stockQuantity,
        initialStockQuantity: editingPerfume?.initialStockQuantity || stockQuantity,
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim(),
      },
      editingPerfume?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-xl w-full shadow-2xl p-5 sm:p-7 text-neutral-100 relative max-h-[92vh] flex flex-col my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-amber-200">
              {editingPerfume ? 'Editar Perfume Árabe' : 'Cadastrar Novo Perfume'}
            </h3>
            <p className="text-xs text-neutral-400">
              Conversão automática de Dólar para Real, foto do produto e cálculo de margem
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4">
          {/* Product Photo Field */}
          <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-800">
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
              Foto do Produto (Opcional)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
              {/* Thumbnail Preview Box */}
              <div className="relative w-20 h-20 rounded-xl bg-neutral-900 border border-neutral-750 overflow-hidden flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={name || 'Prévia do perfume'}
                      className="w-full h-full object-cover"
                      onError={() => setImageError('Link de imagem inválido ou inacessível.')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageError('');
                      }}
                      title="Remover foto"
                      className="absolute top-1 right-1 p-1 rounded-md bg-neutral-950/85 text-rose-400 hover:text-rose-300 border border-neutral-700 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-500 text-[10px] gap-1">
                    <ImageIcon className="w-5 h-5 text-neutral-600" />
                    <span>Sem foto</span>
                  </div>
                )}
              </div>

              {/* Upload Button + URL Input */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{imageUrl ? 'Trocar Foto' : 'Enviar Foto do Aparelho'}</span>
                  </button>
                  <span className="text-[11px] text-neutral-500">JPG, PNG ou WebP</span>
                </div>

                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="Ou cole o link (URL) da foto do perfume..."
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => {
                      setImageError('');
                      setImageUrl(e.target.value);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500/60 rounded-lg py-1.5 pl-8 pr-3 text-xs text-neutral-200 focus:outline-none placeholder:text-neutral-500"
                  />
                </div>
                {imageError && (
                  <p className="text-[11px] text-rose-400">{imageError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Nome do Perfume *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Khamrah Lattafa Unisex EDP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-750 focus:border-amber-500 rounded-xl py-2 px-3 text-sm text-neutral-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Marca
              </label>
              <input
                type="text"
                list="brands-list"
                placeholder="Ex: Lattafa, Al Wataniah..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl py-2 px-3 text-xs sm:text-sm text-neutral-100 focus:outline-none"
              />
              <datalist id="brands-list">
                <option value="Lattafa" />
                <option value="Al Wataniah" />
                <option value="Maison Alhambra" />
                <option value="Armaf" />
                <option value="Afnan" />
                <option value="Rasasi" />
                <option value="Swiss Arabian" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Código / Ref
              </label>
              <input
                type="text"
                placeholder="Ex: 2526-3"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl py-2 px-3 text-xs sm:text-sm text-neutral-100 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Gênero / Linha
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl py-2 px-3 text-xs sm:text-sm text-neutral-200 focus:outline-none"
              >
                <option value="FEM">Feminino</option>
                <option value="MEN">Masculino</option>
                <option value="UNISSEX">Unissex</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Volume / Concentração
              </label>
              <input
                type="text"
                placeholder="100ml EDP"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl py-2 px-3 text-xs sm:text-sm text-neutral-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Automatic USD to BRL Currency Converter section */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-amber-500/30 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Conversão de Custo USD ➔ BRL
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">
                  Valor Pago em Dólar ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costUsd}
                    onChange={(e) => setCostUsd(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-2 pl-8 pr-3 text-sm font-mono font-bold text-amber-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">
                  Cotação Dólar ($1 em R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-2 pl-9 pr-3 text-sm font-mono text-neutral-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Calculated cost highlight */}
            <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">
                Custo de Custo Convertido Automático:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-neutral-400">{formatUsd(costUsd)} × {exchangeRate.toFixed(2)} =</span>
                <span className="text-amber-400 font-bold text-sm">{formatBrl(calculatedCostBrl)}</span>
              </div>
            </div>
          </div>

          {/* Selling Price and Profit Margins */}
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Preço de Venda Final (R$) *
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-neutral-400">Margem rápida:</span>
                <button
                  type="button"
                  onClick={() => applyMarkup(100)}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                >
                  +100%
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkup(120)}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30"
                >
                  +120%
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkup(150)}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-emerald-300 border border-emerald-500/30"
                >
                  +150%
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={sellingPriceBrl}
                  onChange={(e) => setSellingPriceBrl(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-2 pl-9 pr-3 text-base font-mono font-bold text-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Quantidade em Estoque (Frascos)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-2 px-3 text-xs sm:text-sm font-mono text-neutral-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Profit preview card */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-400 text-[11px] block">Lucro Líquido por Frasco:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatBrl(unitProfitBrl)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 text-[11px] block">Margem / Markup:</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {marginPercent.toFixed(1)}% <span className="text-xs font-normal text-neutral-400">({markupPercent.toFixed(0)}% markup)</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Notas Olfativas / Descrição do Perfume
            </label>
            <input
              type="text"
              placeholder="Ex: Doce, floral oriental, âmbar, alta projeção"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-neutral-200 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs sm:text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              {editingPerfume ? 'Salvar Alterações' : 'Salvar no Estoque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
