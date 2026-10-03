export const services = [
  { id: 'google', title: 'Google, Gmail or Google Photos', detail: 'An email ending in @gmail.com is one clue.' },
  { id: 'apple', title: 'An iPhone or other Apple device', detail: 'Includes Apple Family Sharing.' },
  { id: 'whatsapp', title: 'WhatsApp', detail: 'Messages on your phone or a linked computer.' },
  { id: 'other', title: 'Another app', detail: 'Keep your question and find a wider guide library.' },
  { id: 'unknown', title: 'I’m not sure which apps', detail: 'Start with support. You can choose apps later.' },
] as const
export type ServiceId = typeof services[number]['id']
