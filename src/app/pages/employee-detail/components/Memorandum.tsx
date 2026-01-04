import { Button } from '@/components/ui/button';
import { MemorandumTexts } from '@/constants/localize';
import { FileUp } from 'lucide-react';

export function Memorandum() {
  return (
    <section className="flex flex-col gap-6 p-4">
      <div className="flex justify-between">
        <span className="text-xl font-bold">{MemorandumTexts.title}</span>
        <section className="flex gap-4">
          <Button>
            <FileUp />
            <span>{MemorandumTexts.upload}</span>
          </Button>
        </section>
      </div>
      {/* // TODO: REPLACE this with List Component  */}
      <div>
        <div className="flex gap-2">
          <span>{MemorandumTexts.actualMonth}</span>
          <div>

          </div>
        </div>
      </div>
    </section>
  );
}
