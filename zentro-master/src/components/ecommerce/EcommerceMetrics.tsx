import { useState, useEffect } from "react";
import { FiUsers, FiPackage, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import Badge from "../ui/badge/Badge";

type Metrics = {
  totalCustomers: number;
  customerGrowth: number;
  totalOrders: number;
  orderGrowth: number;
};

export default function EcommerceMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    // Mock data - replace with your actual fetch
    const mockMetrics: Metrics = {
      totalCustomers: 12543,
      customerGrowth: 12.5,
      totalOrders: 8765,
      orderGrowth: 18.3
    };
    setTimeout(() => setMetrics(mockMetrics), 300);
  }, []);

  if (!metrics) {
    return (
      <div className="p-4 text-center text-gray-500">Loading metrics...</div>
    );
  }

  const formatNumber = (n: number) => n.toLocaleString();

  const MetricCard = ({
    icon,
    label,
    value,
    percent,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    percent: number;
  }) => {
    const isNegative = percent < 0;
    const badgeColor = isNegative ? "error" : "success";
    const TrendIcon = isNegative ? FiTrendingDown : FiTrendingUp;

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-50 rounded-lg dark:bg-orange-900/20">
            {icon}
          </div>
          <Badge color={badgeColor} className="!px-2 !py-1 text-xs">
            <TrendIcon className="mr-1" />
            {Math.abs(percent)}%
          </Badge>
        </div>
        <div className="mt-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {label}
          </span>
          <h4 className="mt-1 font-bold text-gray-800 text-lg dark:text-white/90">
            {formatNumber(value)}
          </h4>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <MetricCard
        icon={<FiUsers className="text-orange-500 text-lg dark:text-orange-400" />}
        label="Total Customers"
        value={metrics.totalCustomers}
        percent={metrics.customerGrowth}
      />
      <MetricCard
        icon={<FiPackage className="text-orange-500 text-lg dark:text-orange-400" />}
        label="Total Orders"
        value={metrics.totalOrders}
        percent={metrics.orderGrowth}
      />
    </div>
  );
}