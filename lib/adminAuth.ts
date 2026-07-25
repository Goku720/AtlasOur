'use client'
export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('admin_authenticated') === 'true'
}

export function setAdminAuthenticated(value: boolean) {
  sessionStorage.setItem('admin_authenticated', value ? 'true' : 'false')
}