import type { DashboardModel, View } from './model';

export const dashboardViews = [
  { id: 'sales', label: 'Vendas', icon: 'monitoring' },
  { id: 'channels', label: 'Canais', icon: 'hub' },
  { id: 'stock', label: 'Estoque', icon: 'inventory_2' },
  { id: 'customers', label: 'Clientes', icon: 'groups' },
  { id: 'categories', label: 'Categorias', icon: 'category' },
] satisfies { id: View; label: string; icon: string }[];

export type DashboardViewProps = { onViewChange: (view: View) => void };

/** No placeholder figures are used while the real controller has no response. */
export function waitingModel(view: View): DashboardModel {
  return { title: dashboardViews.find(item => item.id === view)!.label, kpis: [], pages: [] };
}
