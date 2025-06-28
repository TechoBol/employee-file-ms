interface MemoProps {
  hasSalaryImpact?: boolean;
}

export function Memo({ hasSalaryImpact = false }: MemoProps) {
  return (
    <section className="flex flex-col gap-6 p-4 border rounded-lg">
      <section className="flex justify-between">
        {
          hasSalaryImpact ? (
            <span className="text-xl font-bold">Memorandum with Salary Impact</span>
          ) : (
            <span className="text-xl font-bold">Memorandum</span>
          )
        }
      </section>
    </section>
  );
}
