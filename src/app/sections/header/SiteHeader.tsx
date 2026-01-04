import { SidebarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { HeaderTexts } from '@/constants/localize';

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-[var(--header-height)] w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <h1 className="text-lg font-semibold">{HeaderTexts.title}</h1>
      </div>
    </header>
  );
}
