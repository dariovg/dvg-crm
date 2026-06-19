// components/marketing/AnalyticsWidget.tsx
'use client';

interface AnalyticsWidgetProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'orange';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
}

const colorClasses: { [key: string]: string } = {
  blue: 'from-blue-500 to-blue-600 text-blue-600',
  red: 'from-red-500 to-red-600 text-red-600',
  green: 'from-green-500 to-green-600 text-green-600',
  purple: 'from-purple-500 to-purple-600 text-purple-600',
  orange: 'from-orange-500 to-orange-600 text-orange-600',
};

const trendIcons: { [key: string]: string } = {
  up: '📈',
  down: '📉',
  stable: '➡️',
};

export default function AnalyticsWidget({
  title,
  value,
  icon,
  color,
  trend,
}: AnalyticsWidgetProps) {
  const formattedValue = value.toLocaleString('es-ES');

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-4xl font-bold mt-2 ${colorClasses[color]}`}>
            {formattedValue}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>

      {trend && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
          <span className="text-xl">{trendIcons[trend.direction]}</span>
          <span className={`text-sm font-semibold ${
            trend.direction === 'up' 
              ? 'text-green-600' 
              : trend.direction === 'down' 
              ? 'text-red-600' 
              : 'text-gray-600'
          }`}>
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
            {trend.value}% vs período anterior
          </span>
        </div>
      )}
    </div>
  );
}
