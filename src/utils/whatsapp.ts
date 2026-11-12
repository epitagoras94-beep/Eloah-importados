import { formatBrl, formatDateBr } from './currency';
import { AppSettings, Installment, Sale } from '../types';

export function cleanPhoneNumber(phone: string): string {
  // Remove non-digit chars
  const digits = phone.replace(/\D/g, '');
  // If Brazilian format without country code (e.g. 11999999999 or 45999999999), prepend 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export type WhatsAppMessageType = 'lembrete' | 'vence_hoje' | 'atrasado' | 'recibo';

export function generateWhatsAppMessage(
  installment: Installment,
  settings: AppSettings,
  type: WhatsAppMessageType
): string {
  const customerFirstName = installment.customerName.split(' ')[0];
  const formattedAmount = formatBrl(installment.amount);
  const formattedDueDate = formatDateBr(installment.dueDate);
  const pixInfo = settings.pixKey ? `\n🔑 *Chave PIX (${settings.pixType}):* \`${settings.pixKey}\`\n👤 *Favorecido:* ${settings.sellerName || settings.storeName}` : '';
  const storeSignature = settings.storeName ? `\n\nAtt,\n*${settings.storeName}* ✨` : `\n\nAtt,\n*${settings.sellerName || 'Eloah Importados'}* ✨`;

  switch (type) {
    case 'lembrete':
      return `Olá, ${customerFirstName}! Tudo bem com você? 😊\n\nPassando para lembrar que a *Parcela ${installment.installmentNumber}/${installment.totalInstallments}* referente ao seu perfume (*${installment.perfumeSummary}*) vence no dia *${formattedDueDate}* no valor de *${formattedAmount}*.\n${pixInfo}\n\nSe já efetuou o pagamento, por favor desconsidere esta mensagem. Muito obrigado pela preferência!${storeSignature}`;

    case 'vence_hoje':
      return `Olá, ${customerFirstName}! Bom dia! 🌟\n\nHoje (*${formattedDueDate}*) vence a *Parcela ${installment.installmentNumber}/${installment.totalInstallments}* do seu perfume (*${installment.perfumeSummary}*) no valor de *${formattedAmount}*.\n${pixInfo}\n\nAssim que fizer o pagamento, pode me enviar o comprovante por aqui. Muito obrigado!${storeSignature}`;

    case 'atrasado':
      return `Olá, ${customerFirstName}! Tudo bem? Espero que sim! 🤝\n\nConsta em nosso sistema uma pendência da *Parcela ${installment.installmentNumber}/${installment.totalInstallments}* do perfume (*${installment.perfumeSummary}*), no valor de *${formattedAmount}*, vencida em *${formattedDueDate}*.\n${pixInfo}\n\nCaso tenha acontecido algum imprevisto ou já tenha feito o pagamento, me avise por aqui para atualizarmos. Obrigado!${storeSignature}`;

    case 'recibo':
      return `Olá, ${customerFirstName}! Pagamento confirmado com sucesso! ✅\n\nRecebemos o valor de *${formattedAmount}* referente à *Parcela ${installment.installmentNumber}/${installment.totalInstallments}* (*${installment.perfumeSummary}*).\n\nSeu saldo foi atualizado em nosso controle. Agradecemos muito a sua pontualidade e confiança!${storeSignature}`;
  }
}

export function generateSaleConfirmationMessage(
  sale: Sale,
  saleInstallments: Installment[],
  settings: AppSettings
): string {
  const customerFirstName = sale.customerName.split(' ')[0];
  const storeLabel = settings.storeName || settings.sellerName || 'Eloah Importados';
  const storeSignature = `\n\nAtt,\n*${storeLabel}* ✨`;

  const itemsText = sale.items
    .map((item) => `• ${item.quantity}x ${item.perfumeName} — *${formatBrl(item.totalSellingPriceBrl)}*`)
    .join('\n');

  const sortedInstallments = [...saleInstallments].sort(
    (a, b) => a.installmentNumber - b.installmentNumber
  );

  const isPaidInFull =
    sale.isCashSale ||
    sale.status === 'Quitado' ||
    sortedInstallments.length === 0 ||
    sale.downPaymentBrl >= sale.totalSellingPriceBrl;

  if (isPaidInFull) {
    const methodLabel = sale.paymentMethod || 'PIX';
    return `Olá, ${customerFirstName}! Tudo bem? 😊\n\nConfirmamos a sua compra na *${storeLabel}*! ✅\n\n🛍️ *Itens adquiridos:*\n${itemsText}\n\n💰 *Valor Total:* *${formatBrl(sale.totalSellingPriceBrl)}*\n💳 *Forma de Pagamento:* Pago à vista via *${methodLabel}*\n📅 *Data da Compra:* ${formatDateBr(sale.saleDate)}\n📌 *Status:* Compra quitada integralmente! ✨\n\nMuito obrigado pela confiança e preferência! Qualquer dúvida estamos à disposição.${storeSignature}`;
  }

  const downPaymentLine =
    sale.downPaymentBrl > 0
      ? `\n💵 *Entrada paga (${sale.paymentMethod || 'PIX'}):* *${formatBrl(sale.downPaymentBrl)}*`
      : '';

  const installmentsLines = sortedInstallments
    .map((inst) => {
      const statusSuffix = inst.status === 'Pago' ? ' ✅ (Pago)' : '';
      return `• *Parcela ${inst.installmentNumber}/${inst.totalInstallments}:* ${formatBrl(inst.amount)} — Vencimento: *${formatDateBr(inst.dueDate)}*${statusSuffix}`;
    })
    .join('\n');

  const pixInfo = settings.pixKey
    ? `\n\n🔑 *Chave PIX (${settings.pixType}):* \`${settings.pixKey}\`\n👤 *Favorecido:* ${settings.sellerName || settings.storeName}`
    : '';

  return `Olá, ${customerFirstName}! Tudo bem? 😊\n\nConfirmamos a sua compra na *${storeLabel}*! ✅\n\n🛍️ *Itens adquiridos:*\n${itemsText}\n\n💰 *Valor Total:* *${formatBrl(sale.totalSellingPriceBrl)}*${downPaymentLine}\n📅 *Data da Compra:* ${formatDateBr(sale.saleDate)}\n\n🗓️ *Datas de Vencimento das Parcelas:*\n${installmentsLines}${pixInfo}\n\nMuito obrigado pela confiança e preferência! Qualquer dúvida estamos à disposição.${storeSignature}`;
}

export function openWhatsApp(phone: string, text: string): void {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  const url = cleaned
    ? `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank');
}
