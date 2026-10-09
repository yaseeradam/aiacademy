import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { OFFICIAL_PAYROLL_SCHEDULE, calculatePayrollTotals } from '@/lib/payrollData';
import { getAllStaff } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let records = OFFICIAL_PAYROLL_SCHEDULE;
    try {
      const dbStaff = await getAllStaff();
      if (dbStaff && dbStaff.length >= 20) {
        const dbMap = new Map(dbStaff.map(s => [s.idNumber || s.name.toLowerCase().trim(), s]));
        records = OFFICIAL_PAYROLL_SCHEDULE.map(item => {
          const matched = dbMap.get(item.idNumber) || dbMap.get(item.name.toLowerCase().trim());
          if (!matched) return item;
          const parsedSal = matched.salary ? parseInt(String(matched.salary).replace(/[^0-9]/g, ''), 10) : null;
          return {
            ...item,
            name: matched.name || item.name,
            bankName: matched.bankName || item.bankName,
            accountNumber: matched.accountNumber || item.accountNumber,
            salary: parsedSal && !isNaN(parsedSal) ? parsedSal : item.salary,
            classAllocated: matched.classAllocated || item.classAllocated,
            phone: matched.phone || item.phone,
          };
        });
      }
    } catch (e) {
      console.warn('Using canonical OFFICIAL_PAYROLL_SCHEDULE for Excel export:', e);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI Integrated Academy Finance';
    workbook.lastModifiedBy = 'Finance & Accounts Office';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Payroll Schedule', {
      views: [
        { state: 'frozen', xSplit: 0, ySplit: 5, showGridLines: true }
      ],
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      }
    });

    sheet.columns = [
      { key: 'sn', width: 8 },
      { key: 'name', width: 34 },
      { key: 'idNumber', width: 18 },
      { key: 'section', width: 16 },
      { key: 'bankName', width: 22 },
      { key: 'accountNumber', width: 22 },
      { key: 'salary', width: 22 },
      { key: 'status', width: 18 },
    ];

    const NAVY_HEADER_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }
    };
    const SUBHEADER_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    const TABLE_HEADER_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0A2540' }
    };
    const ROW_ZEBRA_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' }
    };
    const TOTAL_ROW_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };

    const THIN_BORDER: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    sheet.mergeCells('A1:H1');
    const r1 = sheet.getCell('A1');
    r1.value = 'AI INTEGRATED ACADEMY (AIA)';
    r1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    r1.alignment = { horizontal: 'center', vertical: 'middle' };
    r1.fill = NAVY_HEADER_FILL;
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:H2');
    const r2 = sheet.getCell('A2');
    r2.value = 'STAFF PAYROLL & REMUNERATION SCHEDULE • 2025/2026 ACADEMIC SESSION';
    r2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFE2E8F0' } };
    r2.alignment = { horizontal: 'center', vertical: 'middle' };
    r2.fill = SUBHEADER_FILL;
    sheet.getRow(2).height = 22;

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    sheet.mergeCells('A3:E3');
    const r3a = sheet.getCell('A3');
    r3a.value = 'Office of Finance, Bursary & Administration | Status: OFFICIAL DISBURSEMENT SCHEDULE';
    r3a.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
    r3a.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    sheet.mergeCells('F3:H3');
    const r3b = sheet.getCell('F3');
    r3b.value = 'Generated: ' + today;
    r3b.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } };
    r3b.alignment = { horizontal: 'right', vertical: 'middle' };
    sheet.getRow(3).height = 18;

    sheet.getRow(4).height = 8;

    const headers = [
      'S/N',
      'STAFF FULL NAME',
      'STAFF ID NO.',
      'CADRE / SECTION',
      'DISBURSEMENT BANK',
      'NUBAN ACCOUNT NO.',
      'MONTHLY SALARY (₦)',
      'ACCOUNT STATUS',
    ];

    const headerRow = sheet.getRow(5);
    headerRow.values = headers;
    headerRow.height = 28;
    headerRow.eachCell((cell, colNum) => {
      cell.fill = TABLE_HEADER_FILL;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 ? 'center' : (colNum === 7 ? 'right' : (colNum === 6 || colNum === 3 || colNum === 8 ? 'center' : 'left')),
        wrapText: true
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0A2540' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    const startRow = 6;
    let currentRow = startRow;

    records.forEach((rec, idx) => {
      const row = sheet.getRow(currentRow);
      const isZebra = idx % 2 === 1;

      const isPendingAcct = !rec.accountNumber || rec.accountNumber.trim().toLowerCase() === 'pending';
      const statusText = isPendingAcct ? 'Pending NUBAN' : 'Verified';
      const acctDisplay = isPendingAcct ? 'Pending' : String(rec.accountNumber).trim();

      row.values = [
        rec.sn,
        rec.name,
        rec.idNumber,
        rec.section || 'Academic',
        rec.bankName || 'Pending',
        acctDisplay,
        typeof rec.salary === 'number' && !isNaN(rec.salary) ? rec.salary : null,
        statusText,
      ];
      row.height = 22;

      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        cell.border = THIN_BORDER;

        if (isZebra) {
          cell.fill = ROW_ZEBRA_FILL;
        }

        if (colNum === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
        } else if (colNum === 2) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        } else if (colNum === 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Consolas', size: 9.5, color: { argb: 'FF334155' } };
        } else if (colNum === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum === 5) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        } else if (colNum === 6) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Consolas', size: 10, color: isPendingAcct ? { argb: 'FFD97706' } : { argb: 'FF0F172A' } };
          cell.numFmt = '@';
        } else if (colNum === 7) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof rec.salary === 'number' && !isNaN(rec.salary)) {
            cell.numFmt = '[$₦-470] #,##0;([$₦-470] #,##0);"-"';
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
          } else {
            cell.value = 'Pending Setup';
            cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
          }
        } else if (colNum === 8) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = {
            name: 'Calibri',
            size: 9,
            bold: true,
            color: isPendingAcct ? { argb: 'FFB45309' } : { argb: 'FF047857' }
          };
        }
      });

      currentRow++;
    });

    const endRow = currentRow - 1;

    const spacerRow = sheet.getRow(currentRow);
    spacerRow.height = 10;
    currentRow++;

    const totalRow = sheet.getRow(currentRow);
    totalRow.height = 26;
    totalRow.getCell(2).value = 'TOTAL MONTHLY PAYROLL DISBURSEMENT';
    totalRow.getCell(2).font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    totalRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    const totalSalaryCell = totalRow.getCell(7);
    totalSalaryCell.value = { formula: `SUM(G${startRow}:G${endRow})` };
    totalSalaryCell.numFmt = '[$₦-470] #,##0';
    totalSalaryCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF064E3B' } };
    totalSalaryCell.alignment = { horizontal: 'right', vertical: 'middle' };

    for (let c = 1; c <= 8; c++) {
      const cell = totalRow.getCell(c);
      cell.fill = TOTAL_ROW_FILL;
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }
    currentRow++;

    const avgRow = sheet.getRow(currentRow);
    avgRow.height = 22;
    avgRow.getCell(2).value = 'AVERAGE MONTHLY SALARY';
    avgRow.getCell(2).font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    avgRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    const avgSalaryCell = avgRow.getCell(7);
    avgSalaryCell.value = { formula: `AVERAGE(G${startRow}:G${endRow})` };
    avgSalaryCell.numFmt = '[$₦-470] #,##0';
    avgSalaryCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
    avgSalaryCell.alignment = { horizontal: 'right', vertical: 'middle' };

    for (let c = 1; c <= 8; c++) {
      const cell = avgRow.getCell(c);
      cell.fill = TOTAL_ROW_FILL;
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }
    currentRow++;

    currentRow++;
    const totals = calculatePayrollTotals(records);

    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = 'Total Active Staff On Roll:';
    sheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF334155' } };
    sheet.getCell(`D${currentRow}`).value = totals.totalStaff;
    sheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };

    currentRow++;
    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = 'Verified Disbursement Accounts:';
    sheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } };
    sheet.getCell(`D${currentRow}`).value = `${totals.verifiedAccounts} of ${totals.totalStaff}`;
    sheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF047857' } };

    currentRow++;
    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = 'Pending Account Details:';
    sheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } };
    sheet.getCell(`D${currentRow}`).value = totals.pendingAccounts;
    sheet.getCell(`D${currentRow}`).font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFB45309' } };

    currentRow += 3;
    sheet.getCell(`B${currentRow}`).value = 'Prepared by: _____________________________';
    sheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
    sheet.getCell(`F${currentRow}`).value = 'Approved by: _____________________________';
    sheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };

    currentRow++;
    sheet.getCell(`B${currentRow}`).value = 'Bursar / Accounts Officer';
    sheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FF475569' } };
    sheet.getCell(`F${currentRow}`).value = 'Director / Proprietor';
    sheet.getCell(`F${currentRow}`).font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FF475569' } };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="AI_Integrated_Academy_Payroll_Schedule_2026.xlsx"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Payroll Excel export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate modern finance payroll Excel', details: error?.message },
      { status: 500 }
    );
  }
}
