import ExcelJS from 'exceljs';

const downloadExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Portfolio');
  worksheet.addRow(headers);
  filteredRows.forEach((row, i) => {
    worksheet.addRow([i + 1, ...row.slice(1, -1)]);
  });
  // Set all cells as text
  worksheet.eachRow(row => {
    row.eachCell(cell => {
      cell.numFmt = '@';
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'portfolio.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};