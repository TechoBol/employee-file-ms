import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  color?: string;
}

export function StatusBadge({ status, color }: StatusBadgeProps) {
  const getStatusColor = () => {
    if (color) return color;

    const normalizedStatus = status.toUpperCase();

    if (normalizedStatus === 'ACTIVE') return 'green';
    if (normalizedStatus === 'INACTIVE') return 'orange';

    return 'gray';
  };

  const getStatusLabel = () => {
    const normalizedStatus = status.toUpperCase();

    if (normalizedStatus === 'ACTIVE') return 'ACTIVO';
    if (normalizedStatus === 'INACTIVE') return 'INACTIVO';

    return status;
  };

  const statusColor = getStatusColor();
  const statusLabel = getStatusLabel();

  const colorClasses = {
    green: 'border-green-500 text-green-500',
    orange: 'border-orange-600 text-orange-600',
    gray: 'border-gray-500 text-gray-500',
  };

  const classes =
    colorClasses[statusColor as keyof typeof colorClasses] || colorClasses.gray;

  return (
    <Badge className={`${classes} font-semibold px-2`} variant="outline">
      {statusLabel}
    </Badge>
  );
}
