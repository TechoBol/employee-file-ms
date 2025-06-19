import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="w-full border-b">
      <div className="flex h-16 items-center justify-end px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Gestión de Empleados</h1>
        </div>
      </div>
    </header>
  );
}
