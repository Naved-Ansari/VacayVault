import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Expense, Trip } from '../types';
import { formatDate } from './dateUtils';

interface GenerateReportOptions {
  title: string;
  subtitle?: string;
  trip?: Trip | null;
  expenses: Expense[];
  filterSummary?: string[];
}

export function generateExpenseReportPdf({
  title,
  subtitle,
  trip,
  expenses,
  filterSummary = [],
}: GenerateReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // Deep Navy Slate
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('VacayVault Expense Report', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('Personal Travel & Vacation Expense Record', 14, 26);

  // Generation Date on Top Right
  const generatedAt = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${generatedAt}`, pageWidth - 14, 18, { align: 'right' });
  doc.text('Base Currency: INR (₹)', pageWidth - 14, 26, { align: 'right' });

  let currentY = 48;

  // Trip Summary Box if single trip
  if (trip) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Trip: ${trip.name}`, 18, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const dates = `${formatDate(trip.start_date)} to ${formatDate(trip.end_date)}`;
    const dests =
      trip.destinations && trip.destinations.length > 0
        ? trip.destinations.map((d) => d.name).join(', ')
        : 'None specified';

    doc.text(`Dates: ${dates}   |   Travelers: ${trip.travelers_count} person(s)`, 18, currentY + 15);
    doc.text(`Destinations: ${dests}`, 18, currentY + 21);

    currentY += 34;
  } else {
    // General Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, currentY);
    currentY += 8;
  }

  // Active Filters if any
  if (filterSummary.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Applied Filters: ${filterSummary.join('  •  ')}`, 14, currentY);
    currentY += 8;
  }

  // Calculate Totals & Category Summaries
  const totalSpentInr = expenses.reduce((acc, e) => acc + parseFloat(String(e.amount_inr || 0)), 0);

  // Category Breakdown Map
  const catTotals: Record<string, { total: number; count: number }> = {};
  for (const exp of expenses) {
    const cName = exp.category_name || 'Uncategorized';
    if (!catTotals[cName]) catTotals[cName] = { total: 0, count: 0 };
    catTotals[cName].total += parseFloat(String(exp.amount_inr || 0));
    catTotals[cName].count += 1;
  }

  // KPI Metrics Banner
  doc.setFillColor(238, 242, 255); // Soft Indigo
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(67, 56, 202);
  doc.text('TOTAL EXPENSES COUNT', 22, currentY + 7);
  doc.text('TOTAL AMOUNT SPENT', pageWidth / 2 + 10, currentY + 7);

  doc.setFontSize(14);
  doc.text(`${expenses.length} item(s)`, 22, currentY + 15);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(
    `₹ ${totalSpentInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth / 2 + 10,
    currentY + 15
  );

  currentY += 28;

  // Category Breakdown Summary Table (Compact)
  const catTableData = Object.entries(catTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, stat]) => [
      name,
      String(stat.count),
      `₹ ${stat.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalSpentInr > 0 ? `${((stat.total / totalSpentInr) * 100).toFixed(1)}%` : '0%',
    ]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Spending by Category', 14, currentY);
  currentY += 4;

  (doc as any).autoTable({
    startY: currentY,
    head: [['Category', 'Expenses', 'Total (INR)', '% Share']],
    body: catTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' },
      3: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Full Itemized Expense List Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Itemized Expense Details', 14, currentY);
  currentY += 4;

  const expenseRows = expenses.map((e) => {
    const formattedDate = formatDate(e.expense_date);
    
    const origAmount = `${e.currency} ${parseFloat(String(e.amount)).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
    const inrAmount = `₹ ${parseFloat(String(e.amount_inr)).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return [
      formattedDate,
      e.name,
      e.category_name || '-',
      e.destination_name || '-',
      e.paid_by_name || '-',
      origAmount,
      inrAmount,
    ];
  });

  (doc as any).autoTable({
    startY: currentY,
    head: [['Date', 'Expense', 'Category', 'Destination', 'Paid By', 'Original', 'INR Equivalent']],
    body: expenseRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 42 },
      2: { cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { cellWidth: 22 },
      5: { cellWidth: 24, halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
    foot: [
      [
        'Total',
        '',
        '',
        '',
        '',
        '',
        `₹ ${totalSpentInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'right',
    },
  });

  // Save the PDF
  const filename = trip
    ? `VacayVault_${trip.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`
    : `VacayVault_Expense_Report_${generatedAt.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  doc.save(filename);
}
