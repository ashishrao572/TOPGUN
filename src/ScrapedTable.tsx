import { useEffect, useMemo, useState } from 'react';
import FinancialPeriod from './FinancialPeriod';
import ExcelJS from 'exceljs';

const { getCurrentIndianQuarter, getPreviousIndianQuarter } = FinancialPeriod;

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

function formatQuarterString(qtrObj: { quarter: string; financialYear: number }) {
  return `${qtrObj.quarter} ${qtrObj.financialYear}`;
} 

function ScrapedTable() {
  const current = getCurrentIndianQuarter();
  const [rows, setRows] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState<string>(current.quarter);
  const [selectedFY] = useState<number>(current.financialYear);

  // Build headers once to avoid duplicates on re-render
  const headers = useMemo(() => {
    const base = ['SL', 'Company Name', 'Shares Held', 'Filing Status', '—'];
    const prev = Array.from({ length: 8 }, (_, k) => formatQuarterString(getPreviousIndianQuarter(k + 1)));
    return base.concat(prev);
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = encodeURIComponent(selectedQuarter);
    const fy = encodeURIComponent(String(selectedFY));
    fetch(`${SERVER_URL}/portfolio?quarter=${q}&fy=${fy}`)
      .then((res) => res.json())
      .then((data) => {
        setRows(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error:', err);
        setRows([]);
        setLoading(false);
      });
  }, [selectedQuarter, selectedFY]);

  // Count occurrences of each unique key in cell 1
  const occurrenceMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    rows.forEach(row => {
      const key = row[1];
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [rows]);

  // Unique filtered rows (based on cell[1]) and only 'New' filing status
  const filteredRows = useMemo(() => {
    const out: any[][] = [];
    const seen = new Set<string>();
    rows.filter(row => row[3] === 'New').forEach(row => {
      const key = row[1];
      if (!seen.has(key)) {
        seen.add(key);
        out.push(row);
      }
    });
    return out;
  }, [rows]);

  // Download Excel uses selectedQuarter and selectedFY for file/sheet naming and preserves row colors
  const downloadExcel = async (headersParam: string[], rowsParam: any[][]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Portfolio_${selectedQuarter}_${selectedFY}`);
    worksheet.addRow(headersParam);

    // Precompute occurrence map for the rowsParam set (in case it's filtered)
    const localOcc: { [key: string]: number } = {};
    rowsParam.forEach(r => {
      const key = r[1];
      localOcc[key] = (localOcc[key] || 0) + 1;
    });

    rowsParam.forEach((row, i) => {
      const key = row[1];
      const count = localOcc[key] || 1;
      const bgColor = (count > 1) ? 'CFFFE3' : 'BAE5CC'; // hex without '#'

      const rowData = [i + 1, ...row.slice(1, -1)];
      const excelRow = worksheet.addRow(rowData);

      excelRow.eachCell((cell, colNumber) => {
        const cellHeader = headersParam[colNumber - 1]; // -1 because colNumber is 1-indexed
        if (cell.value === '-') cell.value = '';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        // Set formats
        if (cellHeader === 'Company Name' || cellHeader === 'Filing Status') {
          // text
          // exceljs handles strings automatically but set numFmt as text symbol
          // Note: '@' is not standard numFmt for exceljs; leave types to library
        } else if (cellHeader === 'SL') {
          // numeric
          // ensure it's a number
          // leave as-is
        } else {
          // default, leave as-is
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Portfolio_${selectedQuarter}_${selectedFY}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <p>Loading portfolio data...</p>;
  if (!rows.length) return <p>No data found.</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ textAlign: 'center' }}>Investor Portfolio Viewer ({selectedQuarter} {selectedFY})</h1>

      {/* Quarter selector for current financial year */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
        <label htmlFor="currentQuarter">Select current quarter (for FY {selectedFY}):</label>
        <select
          id="currentQuarter"
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(e.target.value)}
          style={{ padding: '4px 8px' }}
        >
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <button onClick={() => downloadExcel(headers, filteredRows)}>Download Excel</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          backgroundColor: '#faf9f0', // cream white
          color: '#000', // black text
        }}>
          <thead>
            <tr>
              {headers.map((head, index) => (
                <th key={index} style={{
                  border: '1px solid #ddd',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  textAlign: 'left'
                }}>
                  {head || '-'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => {
              const key = row[1];
              const count = occurrenceMap[key] || 1;
              const bgColor = (count > 1) ? `#cfffe3` : `#bae5cc`;

              return (
                <tr key={i}>
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      fontWeight: 'bold',
                      backgroundColor: bgColor,
                      color: '#000',
                    }}
                  >
                    {i + 1}
                  </td>
                  {row.slice(1, -1).map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        border: '1px solid #ddd',
                        padding: '8px',
                        backgroundColor: bgColor,
                        color: '#000',
                      }}
                    >
                      {cell || '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ScrapedTable;
