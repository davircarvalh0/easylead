import React from 'react';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const percentage = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

export const formatMoney = value => Number.isFinite(value) ? currency.format(value) : '—';
export const formatNumber = value => Number.isFinite(value) ? number.format(value) : '—';
export const formatPercent = value => percentage.format(value);
export const formatDate = value => value && Number.isFinite(Date.parse(value))
  ? date.format(new Date(value))
  : 'Sem data registrada';

export function DashboardValue({ value, money = false, className = '', fallback = '—' }) {
  const text = Number.isFinite(value) ? (money ? formatMoney(value) : formatNumber(value)) : fallback;
  return <strong className={`dashboard-value ${className}`} style={{ '--value-length': text.length }}>
    {text}
  </strong>;
}

