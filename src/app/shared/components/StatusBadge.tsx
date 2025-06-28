import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  color: string;
}

export function StatusBadge({ status, color }: StatusBadgeProps) {
  return (
    <Badge
      className={`border-${color}-500 font-semibold px-2`}
      variant="outline"
    >
      <span className={`text-${color}-500`}>{status}</span>
    </Badge>
  );
}
