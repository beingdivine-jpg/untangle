export const VERIFIED_DATE = '2026-10-03'
export const sources = {
  devices: { title: 'Google · See devices with account access', url: 'https://support.google.com/accounts/answer/3067630?hl=en', checked: VERIFIED_DATE },
  password: { title: 'Google · Change or reset your password', url: 'https://support.google.com/accounts/answer/41078?hl=en', checked: VERIFIED_DATE },
  recovery: { title: 'Google · Set up recovery options', url: 'https://support.google.com/accounts/answer/183723?hl=en', checked: VERIFIED_DATE },
  safety: { title: 'NNEDV Safety Net · Quick exit & its limits (US)', url: 'https://www.techsafety.org/exit-from-this-website-quickly', checked: VERIFIED_DATE },
  accessibility: { title: 'W3C · What’s new in WCAG 2.2', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/', checked: VERIFIED_DATE },
} as const
