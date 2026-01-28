import { useState, useMemo } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Download,
  Loader2,
  BarChart3,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { useFullReport, ReportPeriod } from '@/hooks/useReports';
import COLORS, { getGradientColor } from '@/constants/colors';

type ItemAnalysisFilter = 
  | 'top-qty' 
  | 'bottom-qty' 
  | 'top-revenue' 
  | 'bottom-revenue';

const filterDescriptions: Record<ItemAnalysisFilter, string> = {
  'top-qty': 'Ordenado por quantidade vendida (maior para menor)',
  'bottom-qty': 'Ordenado por quantidade vendida (menor para maior)',
  'top-revenue': 'Ordenado por receita gerada (maior para menor)',
  'bottom-revenue': 'Ordenado por receita gerada (menor para maior)',
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('7days');
  const [itemFilter, setItemFilter] = useState<ItemAnalysisFilter>('top-qty');
  const { data: report, isLoading, error } = useFullReport(period);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
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

  const { stats, dailySales, topItems } = report || {
    stats: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, avgPrepTime: 0, revenueChange: 0, ordersChange: 0, avgOrderChange: 0, prepTimeChange: 0 },
    dailySales: [],
    topItems: [],
  };

  const daysWithSales = dailySales.filter(d => d.orders > 0).length || 1;

  const enrichedItems = useMemo(() => {
    if (topItems.length === 0) return [];
    
    return topItems.map(item => ({
      ...item,
      avgPerDay: item.qty / daysWithSales,
      avgRevenuePerDay: item.revenue / daysWithSales,
    }));
  }, [topItems, daysWithSales]);

  const filteredItems = useMemo(() => {
    if (enrichedItems.length === 0) return [];

    const sorted = [...enrichedItems];

    switch (itemFilter) {
      case 'top-qty':
        sorted.sort((a, b) => b.qty - a.qty);
        break;
      case 'bottom-qty':
        sorted.sort((a, b) => a.qty - b.qty);
        break;
      case 'top-revenue':
        sorted.sort((a, b) => b.revenue - a.revenue);
        break;
      case 'bottom-revenue':
        sorted.sort((a, b) => a.revenue - b.revenue);
        break;
    }

    return sorted;
  }, [enrichedItems, itemFilter]);

  const maxValue = useMemo(() => {
    if (filteredItems.length === 0) return 1;
    if (itemFilter.includes('qty')) {
      return Math.max(...filteredItems.map(i => i.qty));
    }
    return Math.max(...filteredItems.map(i => i.revenue));
  }, [filteredItems, itemFilter]);

  const getBarDataKey = () => {
    if (itemFilter.includes('qty')) return 'qty';
    return 'revenue';
  };

  // Custom tooltip for the area chart
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="rounded-lg p-3 shadow-xl border min-w-[160px]"
          style={{ 
            backgroundColor: COLORS.tooltip.bg,
            borderColor: COLORS.tooltip.border,
          }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: COLORS.neutral.textMuted }}>
            {label}
          </p>
          <p className="text-lg font-bold" style={{ color: COLORS.chart.revenue }}>
            {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-sm" style={{ color: COLORS.chart.orders }}>
              {payload[1].value} pedidos
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for the bar chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div 
          className="rounded-lg p-3 shadow-xl border min-w-[200px]"
          style={{ 
            backgroundColor: COLORS.tooltip.bg,
            borderColor: COLORS.tooltip.border,
          }}
        >
          <p className="font-medium mb-2 text-sm pb-2 border-b" style={{ 
            color: COLORS.tooltip.highlight,
            borderColor: COLORS.tooltip.border,
          }}>
            {data.name}
          </p>
          <div className="space-y-1 text-sm" style={{ color: COLORS.tooltip.text }}>
            <div className="flex justify-between gap-4">
              <span className="opacity-70">Total vendido:</span>
              <span className="font-medium">{data.qty} unidades</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="opacity-70">Receita total:</span>
              <span className="font-medium" style={{ color: COLORS.chart.revenue }}>
                {formatCurrency(data.revenue)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-2 mt-1 border-t" style={{ borderColor: COLORS.tooltip.border }}>
              <span className="opacity-70">Média/dia:</span>
              <span className="font-bold" style={{ color: COLORS.tooltip.highlight }}>
                {data.avgPerDay.toFixed(1)} un/dia
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="opacity-70">Receita/dia:</span>
              <span className="font-bold" style={{ color: COLORS.tooltip.highlight }}>
                {formatCurrency(data.avgRevenuePerDay)}/dia
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
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
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select 
              className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 cursor-pointer"
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            >
              {Object.entries(periodLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <button className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Overview - Using new color system */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="stat-card stat-card-revenue">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-icon">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className={`stat-change ${stats.revenueChange >= 0 ? 'stat-change-positive' : 'stat-change-negative'}`}>
              {stats.revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPercentage(stats.revenueChange)}
            </span>
          </div>
          <p className="stat-label">Receita Total</p>
          <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
        </div>

        {/* Orders Card */}
        <div className="stat-card stat-card-orders">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-icon">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className={`stat-change ${stats.ordersChange >= 0 ? 'stat-change-positive' : 'stat-change-negative'}`}>
              {stats.ordersChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPercentage(stats.ordersChange)}
            </span>
          </div>
          <p className="stat-label">Total de Pedidos</p>
          <p className="stat-value">{stats.totalOrders}</p>
        </div>

        {/* Ticket Card */}
        <div className="stat-card stat-card-ticket">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-icon">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className={`stat-change ${stats.avgOrderChange >= 0 ? 'stat-change-positive' : 'stat-change-negative'}`}>
              {stats.avgOrderChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPercentage(stats.avgOrderChange)}
            </span>
          </div>
          <p className="stat-label">Ticket Médio</p>
          <p className="stat-value">{formatCurrency(stats.avgOrderValue)}</p>
        </div>

        {/* Time Card */}
        <div className="stat-card stat-card-time">
          <div className="flex items-center justify-between mb-3">
            <div className="stat-icon">
              <Clock className="w-5 h-5" />
            </div>
            {stats.avgPrepTime > 0 && stats.prepTimeChange !== 0 && (
              <span className={`stat-change ${stats.prepTimeChange <= 0 ? 'stat-change-positive' : 'stat-change-negative'}`}>
                {stats.prepTimeChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {formatPercentage(stats.prepTimeChange)}
              </span>
            )}
          </div>
          <p className="stat-label">Tempo Médio</p>
          <p className="stat-value">{stats.avgPrepTime > 0 ? `${stats.avgPrepTime} min` : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">Pedido até pronto</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-semibold text-gray-900 text-lg">
              Evolução de Vendas
            </h3>
            <p className="text-sm text-gray-500">{periodLabels[period]}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.chart.revenue }} />
              <span className="text-gray-600">Receita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.chart.orders }} />
              <span className="text-gray-600">Pedidos</span>
            </div>
          </div>
        </div>
        
        {dailySales.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.chart.revenue} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.chart.revenue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.chart.axis, fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.chart.axis, fontSize: 12 }}
                  tickFormatter={formatCurrencyShort}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.chart.axis, fontSize: 12 }}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.chart.revenue}
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                  dot={{ fill: COLORS.chart.revenue, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke={COLORS.chart.orders}
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="5 5"
                  dot={{ fill: COLORS.chart.orders, strokeWidth: 2, r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum dado disponível para o período selecionado</p>
            </div>
          </div>
        )}
      </div>

      {/* Items Analysis Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="font-heading font-semibold text-gray-900 text-lg">
              Análise de Itens
            </h3>
            <p className="text-sm text-gray-500">
              {filterDescriptions[itemFilter]} • {filteredItems.length} itens • {daysWithSales} dia(s) com vendas
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value as ItemAnalysisFilter)}
            >
              <optgroup label="Por Quantidade">
                <option value="top-qty">🏆 Mais Vendidos</option>
                <option value="bottom-qty">📉 Menos Vendidos</option>
              </optgroup>
              <optgroup label="Por Receita">
                <option value="top-revenue">💰 Maior Receita</option>
                <option value="bottom-revenue">💸 Menor Receita</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Bar Chart */}
        {filteredItems.length > 0 ? (
          <div style={{ height: Math.max(300, filteredItems.length * 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={filteredItems} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} horizontal={false} />
                <XAxis 
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.chart.axis, fontSize: 11 }}
                  tickFormatter={itemFilter.includes('revenue') 
                    ? (v) => formatCurrencyShort(v) 
                    : undefined
                  }
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.neutral.text, fontSize: 12 }}
                  width={140}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey={getBarDataKey()} radius={[0, 4, 4, 0]} barSize={20}>
                  {filteredItems.map((entry, index) => {
                    const value = itemFilter.includes('qty') ? entry.qty : entry.revenue;
                    const ratio = value / maxValue;
                    return <Cell key={`cell-${index}`} fill={getGradientColor(ratio)} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-72 text-gray-400">
            <div className="text-center">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum item vendido no período</p>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Passe o mouse sobre as barras para ver a média individual de cada item
        </p>
      </div>

      {/* Daily Performance Table */}
      {dailySales.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-semibold text-gray-900 text-lg mb-4">
            Detalhamento Diário
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dia</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Pedidos</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Receita</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {dailySales.map((day, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-900">{day.date}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{day.day}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{day.orders}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-right" style={{ color: COLORS.stats.revenue.text }}>
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">
                      {day.orders > 0 ? formatCurrency(day.revenue / day.orders) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
