import type { User } from '@/app/shared/interfaces/user';
import { useNavigate } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnsTexts } from '@/constants/localize';

export function Actions({ user }: { user: User }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/employees/${user.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{DataTableColumnsTexts.openMenu}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{DataTableColumnsTexts.actions}</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(user.id)}
        >
          {DataTableColumnsTexts.copyId}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleViewDetails}>
          {DataTableColumnsTexts.viewDetails}
        </DropdownMenuItem>
        <DropdownMenuItem>{DataTableColumnsTexts.editUser}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
