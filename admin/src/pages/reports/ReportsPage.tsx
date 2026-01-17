import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Download,
  Loader2,
} from 'lucide-react';
import { useFullReport, ReportPeriod } from '@/hooks/useReports';

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('7days');
  const { data: report, isLoading, error } = useFullReport(period);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const periodLabels: Record<ReportPeriod, string> = {
    today: 'Hoje',
    '7days': 'Últimos 7 dias',
    '30days': 'Últimos 30 dias',
    month: 'Este mês',
    lastMonth: 'Mês passado',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <p className="text-red-500 mb-2">Erro ao carregar relatórios</p>
        <p className="text-gray-500 text-sm">Verifique se você está logado e tente novamente</p>
      </div>
    );
  }

  const { stats, dailySales, topItems } = report || {
    stats: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, avgPrepTime: 18, revenueChange: 0, ordersChange: 0, avgOrderChange: 0 },
    dailySales: [],
    topItems: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Relatórios
          </h1>
          <p className="text-gray-600">Análise de vendas e desempenho</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button className="btn-outline">
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className={`text-sm flex items-center gap-1 mt-1 ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {formatPercentage(stats.revenueChange)} vs período anterior
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className={`text-sm flex items-center gap-1 mt-1 ${stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.ordersChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {formatPercentage(stats.ordersChange)} vs período anterior
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.avgOrderValue)}
              </p>
              <p className={`text-sm flex items-center gap-1 mt-1 ${stats.avgOrderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.avgOrderChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {formatPercentage(stats.avgOrderChange)} vs período anterior
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgPrepTime} min</p>
              <p className="text-sm text-gray-500 mt-1">
                Preparo até entrega
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="card">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">
            Vendas por Dia
          </h3>
          {dailySales.length > 0 ? (
            <div className="flex items-end justify-between h-48 gap-2">
              {dailySales.map((stat, i) => {
                const maxRevenue = Math.max(...dailySales.map(s => s.revenue));
                const height = maxRevenue > 0 ? (stat.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div 
                      className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600 cursor-pointer"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-gray-500">{stat.day}</span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      <div>{stat.date}</div>
                      <div>{formatCurrency(stat.revenue)}</div>
                      <div>{stat.orders} pedidos</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </div>

        {/* Top Items */}
        <div className="card">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">
            Itens Mais Vendidos
          </h3>
          {topItems.length > 0 ? (
            <div className="space-y-4">
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.qty} unidades</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              Nenhum item vendido no período selecionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
