import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const generatePDF = (data: any[], totals: any, title: string, period?: string) => {
  try {
    toast.loading('Generando PDF...', { id: 'pdf-generation' });

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const fecha = new Date().toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Generado: ${fecha}`, 14, 17);

    const tableData = data.map((row: any) => {
      const employeeName =
        row.employeeName ??
        `${row.employee?.firstName ?? ''} ${row.employee?.lastName ?? ''}`;
      const employeeCI = row.employeeCI ?? row.employee?.ci ?? '-';
      const nameWithCI = `${employeeName}\nCI: ${employeeCI}`;

      const deductions = [
        ...(row.payroll?.deductions ?? row.payment?.deductions ?? []),
      ].reduce<Record<string, number>>((acc, d) => {
        acc[d.type] = (acc[d.type] ?? 0) + d.totalDeduction;
        return acc;
      }, {});

      return [
        nameWithCI,
        row.employee?.branchName ?? '-',

        formatCurrency(row.payroll?.baseSalary || row.payment?.baseSalary || 0),
        row.payroll?.workedDays || row.payment?.workedDays || '-',
        formatCurrency(
          row.payroll?.basicEarnings || row.payment?.basicEarnings || 0
        ),
        formatCurrency(
          row.payroll?.seniorityBonus || row.payment?.seniorityBonus || 0
        ),
        `${
          row.payroll?.seniorityIncreasePercentage ||
          row.payment?.seniorityIncreasePercentage ||
          0
        }%`,
        formatCurrency(
          row.payroll?.otherBonuses || row.payment?.otherBonuses || 0
        ),
        formatCurrency(
          (row.payroll?.seniorityBonus || 0) + (row.payment?.otherBonuses || 0)
        ),
        formatCurrency(
          row.payroll?.totalEarnings || row.payment?.totalEarnings || 0
        ),

        formatCurrency(deductions.PERMISSION ?? 0),
        formatCurrency(deductions.ABSENCE ?? 0),
        formatCurrency(deductions.ADVANCE ?? 0),
        formatCurrency(deductions.OTHER ?? 0),
        formatCurrency(
          row.payroll?.deductionAfp || row.payment?.deductionAfp || 0
        ),

        formatCurrency(
          row.payroll?.totalDeductions || row.payment?.totalDeductions || 0
        ),
        formatCurrency(row.payroll?.netAmount || row.payment?.netAmount || 0),
      ];
    });

    tableData.push([
      {
        content: 'TOTALES',
        colSpan: 2,
        styles: {
          halign: 'center',
          fontStyle: 'bold',
          fillColor: [229, 231, 235],
        },
      },
      '-',
      '-',
      '-',
      formatCurrency(totals?.totalSeniorityBonuses || 0),
      '-',
      formatCurrency(totals?.totalOtherBonuses || 0),
      formatCurrency(totals?.totalBonuses || 0),
      formatCurrency(totals?.totalEarnings || 0),

      formatCurrency(totals?.deductions?.PERMISSION || 0),
      formatCurrency(totals?.deductions?.ABSENCE || 0),
      formatCurrency(totals?.deductions?.ADVANCE || 0),
      formatCurrency(totals?.deductions?.OTHER || 0),
      formatCurrency(totals?.totalAfpDeductions || 0),

      formatCurrency(totals?.totalDeductions || 0),
      formatCurrency(totals?.netAmount || 0),
    ]);

    autoTable(doc, {
      startY: 22,
      head: [
        [
          { content: 'Empleado', colSpan: 2, styles: { halign: 'center' } },
          'Haber\nBásico',
          'Días\nTrab.',
          'Sueldo\nBásico',
          'Bono\nAntig.',
          '%\nAntig.',
          'Otros\nBonos',
          'Total\nBonos',
          'Total\nGanado',
          { content: 'Descuentos', colSpan: 5, styles: { halign: 'center' } },
          'Total\nDesc.',
          'Líquido\nPagable',
        ],
        [
          'Nombre',
          'Sucursal',

          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',

          'Permisos',
          'Faltas',
          'Anticipos',
          'Otros',
          'AFP',

          '',
          '',
        ],
      ],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.5,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
        valign: 'middle',
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
      },
      willDrawCell: (data: any) => {
        if (
          data.section === 'head' &&
          data.row.index === 1 &&
          data.column.index >= 10 &&
          data.column.index <= 14
        ) {
          data.cell.text = [];
        }
      },
      didDrawCell: (data: any) => {
        if (
          data.section === 'head' &&
          data.row.index === 1 &&
          data.column.index >= 10 &&
          data.column.index <= 14
        ) {
          const cell = data.cell;
          const titles = ['Permisos', 'Faltas', 'Anticipos', 'Otros', 'AFP'];
          const title = titles[data.column.index - 10];

          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(title, cell.x + cell.width / 2, cell.y + cell.height / 2, {
            align: 'center',
            baseline: 'middle',
          });
        }
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'left', fontSize: 6 },
        1: { cellWidth: 16, halign: 'center' },

        2: { cellWidth: 16, halign: 'right' },
        3: { cellWidth: 8, halign: 'center' },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 16, halign: 'right' },
        6: { cellWidth: 8, halign: 'center' },
        7: { cellWidth: 16, halign: 'right' },
        8: { cellWidth: 17, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },

        10: { cellWidth: 16, halign: 'right' },
        11: { cellWidth: 16, halign: 'right' },
        12: { cellWidth: 16, halign: 'right' },
        13: { cellWidth: 16, halign: 'right' },
        14: { cellWidth: 16, halign: 'right' },

        15: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
        16: { cellWidth: 20, halign: 'right', fontStyle: 'bold', fontSize: 7 },
      },
      didParseCell: (d: any) => {
        if (d.row.index === tableData.length - 1) {
          d.cell.styles.fillColor = [229, 231, 235];
          d.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 22;
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Total de empleados: ${data.length}`, 14, finalY + 6);

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 25,
        doc.internal.pageSize.getHeight() - 8
      );
    }

    doc.save(`nomina-detallada-${period? period : format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF generado exitosamente', { id: 'pdf-generation' });
  } catch (error) {
    toast.error('Error al generar PDF', {
      id: 'pdf-generation',
      description: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
