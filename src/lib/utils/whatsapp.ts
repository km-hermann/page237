export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  // Strip any non-digit characters to satisfy WhatsApp wa.me requirements
  const cleanNumber = phoneNumber.replace(/\D/g, '')
  
  // URL-encode the message
  const encodedText = encodeURIComponent(message)
  
  return `https://wa.me/${cleanNumber}?text=${encodedText}`
}
