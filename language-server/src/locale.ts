// Locale management for QTN Language Server
// Separated into its own module to avoid circular dependencies.

import { SupportedLocale } from './builtins.js';

let currentLocale: SupportedLocale = 'en';

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
}
