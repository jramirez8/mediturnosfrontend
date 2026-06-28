import React from 'react';
import { AppBottomNav } from './AppBottomNav';

export function RoleBottomNav({ role, active }: Readonly<{ role: 'medico' | 'secretaria' | 'admin'; active: string }>) {
  return <AppBottomNav role={role} active={active} />;
}
RoleBottomNav.displayName = 'MediturnosBottomNav';
