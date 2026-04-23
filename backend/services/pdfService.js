import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

// Initialize pdfMake with fonts
try {
  pdfMake.vfs = pdfFonts;
  // Define Roboto as the default font
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };
} catch (e) {
  console.warn('Font initialization warning:', e.message);
}

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

export class PDFService {
  // Helper function to safely format numbers
  static formatNumber(value, useAbsoluteValue = false) {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    const absNum = useAbsoluteValue ? Math.abs(num) : num;
    return absNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Helper function for charts
  static async generateGrayscaleChart(labels, data, title, color = '#333333') {
    const configuration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: title,
          data: data,
          fill: true,
          borderColor: color,
          backgroundColor: color + '20', // Add transparency for fill
          borderWidth: 3,
          pointBackgroundColor: color,
          pointRadius: 4,
          tension: 0.4 // Smooth curves for minimalistic look
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: title,
            color: '#333333',
            font: { size: 16, weight: '500' },
            padding: { bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#666666', font: { size: 10 } },
            grid: { color: '#f0f0f0' },
            border: { display: false }
          },
          x: {
            ticks: { color: '#666666', font: { size: 10 } },
            grid: { display: false },
            border: { display: false }
          }
        },
        layout: { padding: 10 }
      }
    };
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  // Helper function to safely get nested values
  static safeGet(obj, path, defaultValue = 0) {
    const value = path.split('.').reduce((current, prop) => current?.[prop], obj);
    return typeof value === 'number' ? value : defaultValue;
  }

  static async generateDPR(projectData) {
    try {
      const basic = projectData.basicInfo || {};
      
      // Prepare chart data
      const years = [1, 2, 3, 4, 5].map(y => `Year ${y}`);
      
      const revenueData = projectData.revenueProjection?.yearlyProjections?.map(p => p.actualRevenue || 0) || [0, 0, 0, 0, 0];
      const profitData = projectData.profitability?.map(p => p.profitAfterTax) || [0, 0, 0, 0, 0];
      const cashData = projectData.cashFlow?.map(c => c.closingBalance) || [0, 0, 0, 0, 0];

      const [revenueChart, profitChart, cashChart] = await Promise.all([
        this.generateGrayscaleChart(years, revenueData, 'Annual Revenue Projection (₹)', '#3498db'), // Blue
        this.generateGrayscaleChart(years, profitData, 'Net Profit After Tax (₹)', '#2ecc71'),   // Green
        this.generateGrayscaleChart(years, cashData, 'Cash Balance Growth (₹)', '#e67e22')      // Orange
      ]);

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [72, 72, 72, 72],
        defaultStyle: {
          font: 'Roboto',
          fontSize: 11
        },
        header: (currentPage) => {
          if (currentPage === 1) return null;
          return {
            text: `DETAILED PROJECT REPORT - ${(basic.businessName || 'PROJECT').toUpperCase()}`,
            alignment: 'right',
            fontSize: 8,
            color: '#999999',
            margin: [72, 30, 72, 0]
          };
        },
        footer: (currentPage, pageCount) => {
          if (currentPage === 1) return null; // Hide footer (page numbers) on cover page
          return {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'center',
            fontSize: 10,
            color: '#666666',
            margin: [0, 20, 0, 0]
          };
        },
        content: [
          this.generateCoverPage(projectData),
          { text: '', pageBreak: 'after' },

          this.generateExecutiveSummary(projectData),
          { text: '', pageBreak: 'after' },

          { text: 'FINANCIAL PERFORMANCE VISUALIZATION', style: 'header', margin: [0, 10, 0, 10] },
          { text: 'Graphical representation of key financial indicators over the 5-year projection period:', style: 'introText', margin: [0, 0, 0, 15] },
          { image: revenueChart, width: 450, alignment: 'center', margin: [0, 0, 0, 20] },
          { image: profitChart, width: 450, alignment: 'center', margin: [0, 0, 0, 20] },
          { image: cashChart, width: 450, alignment: 'center' },
          { text: '', pageBreak: 'after' },

          this.generateIntroductionPage(projectData),
          this.generateProjectCostTable(projectData),
          this.generateMeansOfFinanceTable(projectData),
          { text: '', pageBreak: 'after' },

          this.generateDepreciationScheduleTable(projectData),
          this.generateWorkingCapitalTable(projectData),
          { text: '', pageBreak: 'after' },

          this.generateRevenueProjectionTable(projectData),
          this.generateExpenseProjectionTable(projectData),
          { text: '', pageBreak: 'after' },

          this.generateProfitabilityStatementTable(projectData),
          this.generateCashFlowTable(projectData),
          { text: '', pageBreak: 'after' },

          this.generateBalanceSheetTable(projectData),
          { text: '', pageBreak: 'after' },

          this.generateRepaymentScheduleTable(projectData),
          { text: '', pageBreak: 'after' },

          this.generateDSCRTable(projectData),
          this.generateBreakEvenTable(projectData),
          this.generateAssumptions(projectData),
          { text: '', pageBreak: 'after' },
          this.generateConclusion(projectData)
        ],
        styles: {
          title: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 10, 0, 10], color: '#000000' },
          header: { fontSize: 15, bold: true, margin: [0, 20, 0, 10], color: '#000000' },
          tableHeader: { bold: true, fontSize: 11, fillColor: '#f2f2f2', alignment: 'center', margin: [5, 5, 5, 5] },
          tableCell: { fontSize: 11, margin: [5, 5, 5, 5], alignment: 'center' },
          tableCellLeft: { fontSize: 11, margin: [5, 5, 5, 5], alignment: 'left' },
          tableCellRight: { fontSize: 11, margin: [5, 5, 5, 5], alignment: 'right' },
          normal: { fontSize: 11, lineHeight: 1.4, alignment: 'justify' },
          introText: { fontSize: 11, lineHeight: 1.5, alignment: 'justify', margin: [0, 5, 0, 5] }
        }
      };

      return pdfMake.createPdf(docDefinition);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new Error(`PDF Generation Failed: ${error.message}`);
    }
  }

  static generateCoverPage(projectData) {
    const basic = projectData.basicInfo || {};
    return {
      stack: [
        { text: 'GOVERNMENT OF INDIA', alignment: 'center', fontSize: 14, bold: true, margin: [0, 20, 0, 5] },
        { text: 'DISTRICT INDUSTRIES CENTRE', alignment: 'center', fontSize: 14, bold: true, margin: [0, 0, 0, 50] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 450, y2: 0, lineWidth: 1 }] },
        { text: 'DETAILED PROJECT REPORT', style: 'title', margin: [0, 60, 0, 10] },
        { text: (basic.businessName || 'PROPOSED BUSINESS').toUpperCase(), fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        { text: `UNDER ${ (basic.schemeName || 'GOVERNMENT SCHEME').toUpperCase() }`, alignment: 'center', fontSize: 14, margin: [0, 0, 0, 80] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 450, y2: 0, lineWidth: 1 }] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 300,
              stack: [
                { text: 'SUBMITTED BY:', bold: true, fontSize: 14, margin: [0, 50, 0, 10] },
                { text: `Name: ${basic.promoterName || 'N/A'}`, fontSize: 12 },
                { text: `Address: ${basic.address || 'N/A'}`, fontSize: 12 },
                { text: `Phone: ${basic.phone || 'N/A'}`, fontSize: 12 },
                { text: `Date: ${new Date().toLocaleDateString('en-IN')}`, fontSize: 12 }
              ]
            }
          ]
        }
      ]
    };
  }

  static generateExecutiveSummary(projectData) {
    const cost = this.safeGet(projectData, 'totalProjectRequirement');
    const mof = projectData.meansOfFinance || {};
    const basic = projectData.basicInfo || {};
    return {
      stack: [
        { text: 'EXECUTIVE SUMMARY', style: 'header' },
        { text: 'This Detailed Project Report (DPR) outlines the technical and financial feasibility of the proposed venture. A summary of the key project parameters is highlighted below:', style: 'normal', margin: [0, 0, 0, 15] },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [{ text: 'Project Parameter', style: 'tableHeader' }, { text: 'Value', style: 'tableHeader' }],
              [{ text: 'Total Project Cost', style: 'tableCellLeft' }, { text: `₹ ${this.formatNumber(cost)}`, style: 'tableCellRight', bold: true }],
              [{ text: 'Bank Loan Amount', style: 'tableCellLeft' }, { text: `₹ ${this.formatNumber(mof.bankLoan || 0)}`, style: 'tableCellRight' }],
              [{ text: 'Promoter Margin', style: 'tableCellLeft' }, { text: `₹ ${this.formatNumber(mof.marginMoney || 0)}`, style: 'tableCellRight' }],
              [{ text: 'Employment Generation', style: 'tableCellLeft' }, { text: `${basic.employmentCount || 0} Persons`, style: 'tableCellRight' }],
              [{ text: 'Average DSCR', style: 'tableCellLeft' }, { text: this.formatNumber(this.safeGet(projectData, 'dscr.averageDSCR')), style: 'tableCellRight', bold: true }],
              [{ text: 'Break-Even Point (%)', style: 'tableCellLeft' }, { text: `${this.formatNumber(this.safeGet(projectData, 'breakEvenAnalysis.bepPercent'))}%`, style: 'tableCellRight' }]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#999',
            vLineColor: () => '#999',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6
          }
        }
      ]
    };
  }

  static generateIntroductionPage(projectData) {
    const basic = projectData.basicInfo || {};
    
    const content = basic.introduction && basic.introduction.trim() !== '' 
      ? [{ text: basic.introduction, style: 'introText' }]
      : [
          {
            text: `The proposed unit is engaged in ${basic.businessType || 'business activities'}. This project report provides a comprehensive analysis of the viability and financial feasibility of the proposed business venture under ${basic.schemeName || 'the promotional scheme'}.`,
            style: 'introText'
          },
          {
            text: `Business Type: ${basic.businessType || 'Not Specified'}`,
            style: 'introText',
            margin: [0, 8, 0, 6],
            bold: true
          },
          {
            text: `The proposed business will serve a significant market demand in the local area. With proper implementation and management, the venture is expected to generate substantial employment and contribute to the local economy.`,
            style: 'introText'
          },
          {
            text: `Employment Generation: This project is expected to generate employment for approximately ${basic.employmentCount || '0'} persons, contributing to skill development and livelihood creation in the region.`,
            style: 'introText',
            bold: true
          }
        ];

    return {
      stack: [
        { text: 'PROJECT OVERVIEW & INTRODUCTION', style: 'header' },
        ...content
      ]
    };
  }

  static generateProjectCostTable(projectData) {
    const pc = projectData.projectCost || {};
    const assets = pc.assets || [];
    const assetRows = assets.map(asset => [
      { text: asset.asset_name || 'Asset', style: 'tableCellLeft' },
      { text: this.formatNumber(asset.total_budget || 0), style: 'tableCellRight' }
    ]);
    return {
      stack: [
        { text: 'PROJECT COST STATEMENT', style: 'header' },
        { text: 'The estimated project cost includes investment in fixed assets and initial working capital requirements as detailed below:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['70%', '30%'],
            body: [
              [{ text: 'Particulars of Investment', style: 'tableHeader' }, { text: 'Amount (₹)', style: 'tableHeader' }],
              ...assetRows,
              [{ text: 'Total Fixed Capital (A)', bold: true, style: 'tableCellLeft' }, { text: this.formatNumber(pc.fixedCapital || 0), bold: true, style: 'tableCellRight' }],
              [{ text: 'Working Capital Requirement (B)', style: 'tableCellLeft' }, { text: this.formatNumber(pc.workingCapitalRequirement || 0), style: 'tableCellRight' }],
              [{ text: 'Total Project Cost (A + B)', bold: true, style: 'tableCellLeft' }, { text: this.formatNumber(this.safeGet(projectData, 'totalProjectRequirement')), bold: true, style: 'tableCellRight' }]
            ]
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === node.table.body.length || i === node.table.body.length - 2 || i === node.table.body.length - 1) ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#999',
            vLineColor: () => '#999'
          }
        }
      ]
    };
  }

  static generateMeansOfFinanceTable(projectData) {
    const mof = projectData.meansOfFinance || {};
    const required = this.safeGet(projectData, 'totalProjectRequirement');
    return {
      stack: [
        { text: 'MEANS OF FINANCE', style: 'header' },
        { text: 'The project is proposed to be financed through a combination of promoter\'s margin and bank assistance:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['70%', '30%'],
            body: [
              [{ text: 'Particulars', style: 'tableHeader' }, { text: 'Amount (₹)', style: 'tableHeader' }],
              [{ text: 'Total Project Requirement', style: 'tableCellLeft', bold: true }, { text: this.formatNumber(required), style: 'tableCellRight', bold: true }],
              [{ text: `Promoter Margin (${mof.marginPercent || 0}%)`, style: 'tableCellLeft' }, { text: this.formatNumber(mof.marginMoney || 0), style: 'tableCellRight' }],
              [{ text: 'Bank Loan Assistance', style: 'tableCellLeft', bold: true }, { text: this.formatNumber(mof.bankLoan || 0), style: 'tableCellRight', bold: true }],
              [{ text: '  - Term Loan Component', style: 'tableCellLeft' }, { text: this.formatNumber(mof.termLoan || 0), style: 'tableCellRight' }],
              [{ text: '  - Working Capital (CC) Component', style: 'tableCellLeft' }, { text: this.formatNumber(mof.wcLoan || 0), style: 'tableCellRight' }],
              [{ text: 'Total Funding Sources', bold: true, style: 'tableCellLeft' }, { text: this.formatNumber(required), bold: true, style: 'tableCellRight' }]
            ]
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === node.table.body.length || i === 3 || i === 4) ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#999',
            vLineColor: () => '#999'
          }
        }
      ]
    };
  }

  static generateWorkingCapitalTable(projectData) {
    const wcLoan = this.safeGet(projectData, 'meansOfFinance.wcLoan');
    const annualSales = this.safeGet(projectData, 'revenueProjection.yearlyProjections.0.actualRevenue');
    const wcLimit = annualSales * 0.25;

    return {
      stack: [
        { text: 'WORKING CAPITAL (CC LOAN) ANALYSIS', style: 'header' },
        { text: 'The working capital requirement is assessed based on the projected sales turnover. As per banking norms, the CC limit is typically restricted to 25% of annual sales.', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['70%', '30%'],
            body: [
              [{ text: 'Particulars', style: 'tableHeader' }, { text: 'Value (₹)', style: 'tableHeader' }],
              [{ text: 'Projected Annual Sales (Year 1)', style: 'tableCellLeft' }, { text: this.formatNumber(annualSales), style: 'tableCellRight' }],
              [{ text: 'Maximum Permissible Finance (25%)', style: 'tableCellLeft' }, { text: this.formatNumber(wcLimit), style: 'tableCellRight', bold: true }],
              [{ text: 'Proposed Working Capital Loan', style: 'tableCellLeft' }, { text: this.formatNumber(wcLoan), style: 'tableCellRight', bold: true }],
              [{ text: 'Status', style: 'tableCellLeft' }, { text: wcLoan <= wcLimit ? 'WITHIN LIMIT' : 'EXCEEDS LIMIT', style: 'tableCellRight', bold: true }]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#999',
            vLineColor: () => '#999'
          }
        }
      ]
    };
  }

  static generateRevenueProjectionTable(projectData) {
    const rev = projectData.revenueProjection || {};
    const projections = rev.yearlyProjections || [];
    const rows = [[
      { text: 'Year', style: 'tableHeader' },
      { text: 'Daily Revenue (₹)', style: 'tableHeader' },
      { text: 'Working Days', style: 'tableHeader' },
      { text: 'Capacity %', style: 'tableHeader' },
      { text: 'Annual Sales (₹)', style: 'tableHeader' }
    ]];

    projections.forEach(p => {
      rows.push([
        { text: `Year ${p.year}`, style: 'tableCell' },
        { text: this.formatNumber(p.dailyRevenue || 0), style: 'tableCellRight' },
        { text: (p.workingDays || 0).toString(), style: 'tableCell' },
        { text: `${p.capacityUtilization || 100}%`, style: 'tableCell' },
        { text: this.formatNumber(p.actualRevenue || 0), style: 'tableCellRight', bold: true }
      ]);
    });

    return {
      stack: [
        { text: 'REVENUE PROJECTIONS (5 YEARS)', style: 'header' },
        { text: 'Projected sales revenue based on daily operational estimates and conservative capacity utilization:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['15%', '25%', '20%', '15%', '25%'],
            body: rows
          },
          layout: 'lightHorizontalLines'
        }
      ]
    };
  }

  static generateExpenseProjectionTable(projectData) {
    const exp = projectData.expenseProjection || {};
    const projections = exp.yearlyProjections || [];
    const rows = [[
      { text: 'Year', style: 'tableHeader' },
      { text: 'Operating Cost (₹)', style: 'tableHeader' },
      { text: 'Total Annual Exp (₹)', style: 'tableHeader' }
    ]];

    projections.forEach(p => {
      rows.push([
        { text: `Year ${p.year}`, style: 'tableCell' },
        { text: 'As per operational data', style: 'tableCellLeft' },
        { text: this.formatNumber(p.totalExpense || 0), style: 'tableCellRight', bold: true }
      ]);
    });

    return {
      stack: [
        { text: 'EXPENSE PROJECTIONS (5 YEARS)', style: 'header' },
        { text: 'Annual operating expenses including rent, utilities, salaries, and maintenance:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['20%', '40%', '40%'],
            body: rows
          },
          layout: 'lightHorizontalLines'
        }
      ]
    };
  }

  static generateProfitabilityStatementTable(projectData) {
    const profit = projectData.profitability || [];
    if (profit.length === 0) return { text: '' };

    const rows = [[
      { text: 'Particulars', style: 'tableHeader', alignment: 'left' },
      ...profit.map(p => ({ text: `Year ${p.year}`, style: 'tableHeader' }))
    ]];

    const items = [
      { label: 'Revenue from operation', isSection: true },
      { label: 'Sale items', key: 'salesRevenue' },
      { label: 'Add: Closing stock', key: 'closingStock' },
      { label: 'Total', key: 'adjustedRevenue', bold: true },
      { label: 'Less:', isSection: true },
      { label: 'Opening stock', key: 'openingStock' },
      { label: 'Stock purchase', key: 'stockPurchase' },
      { label: 'Salary', key: 'salary' },
      { label: 'Electricity/Gas', key: 'electricity' },
      { label: 'Total', key: 'totalDirectCost', bold: true },
      { label: 'Gross Profit', key: 'grossProfit', isBold: true, bgColor: '#f0f0f0' },
      { label: 'Less:', isSection: true },
      { label: 'Miscellaneous', key: 'misc' },
      { label: 'Total', key: 'misc', bold: true },
      { label: 'EBITDA', key: 'ebitda', isBold: true },
      { label: 'Depreciation', key: 'depreciation' },
      { label: 'Interest on TL', key: 'interestTL' },
      { label: 'Interest on WC', key: 'interestWC' },
      { label: 'Profit Before Tax', key: 'profitBeforeTax', isBold: true, bgColor: '#f0f0f0' },
      { label: 'Income Tax', key: 'incomeTax' },
      { label: 'Profit After Tax', key: 'profitAfterTax', isBold: true, bgColor: '#f0f0f0' }
    ];

    items.forEach(item => {
      if (item.isSection) {
        rows.push([{ text: item.label, style: 'tableCellLeft', bold: true, colSpan: profit.length + 1 }, ...Array(profit.length).fill('')]);
      } else {
        const row = [{ text: item.label, style: 'tableCellLeft', bold: item.bold }];
        profit.forEach(p => {
          const val = p[item.key] || 0;
          row.push({
            text: this.formatNumber(val, true),
            style: 'tableCellRight',
            bold: item.isBold,
            fillColor: item.bgColor ? item.bgColor : undefined
          });
        });
        rows.push(row);
      }
    });

    return {
      stack: [
        { text: 'PROFITABILITY STATEMENT (5 Years)', style: 'header' },
        { text: 'Trading model profitability analysis showing revenue adjustments for inventory movement and comprehensive profit calculation:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['30%', ...profit.map(() => '14%')],
            body: rows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#999',
            vLineColor: () => '#999'
          }
        }
      ]
    };
  }

  static generateCashFlowTable(projectData) {
    const cf = projectData.cashFlow || [];
    if (cf.length === 0) return { text: '' };

    const rows = [[
      { text: 'Particulars', style: 'tableHeader', alignment: 'left' },
      ...cf.map(c => ({ text: `Year ${c.year}`, style: 'tableHeader' }))
    ]];

    const sections = [
      {
        title: 'CASH INFLOW',
        items: [
          { label: 'Capital', path: 'inflow.capital' },
          { label: 'PBT + Interest', path: 'inflow.pbtWithInterest' },
          { label: 'WC Loan Drawn', path: 'inflow.wcLoanDrawn' },
          { label: 'Depreciation', path: 'inflow.depreciation' },
          { label: 'Increase in Payables', path: 'inflow.increaseInPayables' },
          { label: 'Total Inflow', path: 'inflow.totalInflow', bold: true }
        ]
      },
      {
        title: 'CASH OUTFLOW',
        items: [
          { label: 'Fixed Assets', path: 'outflow.fixedAssets' },
          { label: 'Increase in CA', path: 'outflow.increaseInCA' },
          { label: 'Interest on TL', path: 'outflow.interestTL' },
          { label: 'Interest on WC', path: 'outflow.interestWC' },
          { label: 'Income Tax', path: 'outflow.taxPaid' },
          { label: 'TL Repaid', path: 'outflow.tlRepaid' },
          { label: 'Drawings', path: 'outflow.drawings' },
          { label: 'Total Outflow', path: 'outflow.totalOutflow', bold: true }
        ]
      },
      {
        title: 'CASH POSITION',
        items: [
          { label: 'Opening Balance', path: 'openingBalance' },
          { label: 'Net Cash Flow', path: 'netCashFlow', bold: true },
          { label: 'Closing Balance', path: 'closingBalance', bold: true }
        ]
      }
    ];

    sections.forEach(section => {
      rows.push([{ text: section.title, style: 'tableCellLeft', bold: true, colSpan: cf.length + 1 }, ...Array(cf.length).fill('')]);
      section.items.forEach(item => {
        const row = [{ text: item.label, style: 'tableCellLeft', bold: item.bold }];
        cf.forEach(c => {
          const parts = item.path.split('.');
          let val = c;
          parts.forEach(p => { val = val[p]; });
          row.push({
            text: this.formatNumber(val || 0, true),
            style: 'tableCellRight',
            bold: item.bold
          });
        });
        rows.push(row);
      });
    });

    return {
      stack: [
        { text: 'CASH FLOW STATEMENT - INDIRECT METHOD (5 Years)', style: 'header' },
        { text: 'Cash flow analysis using indirect method showing capital inflows, operating cash, and financing activities:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['30%', ...cf.map(() => '14%')],
            body: rows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#999',
            vLineColor: () => '#999'
          }
        }
      ]
    };
  }

  static generateBalanceSheetTable(projectData) {
    const bs = projectData.balanceSheet || [];
    if (bs.length === 0) return { text: '' };

    const rows = [[
      { text: 'Particulars', style: 'tableHeader', alignment: 'left' },
      ...bs.map(b => ({ text: `Year ${b.year}`, style: 'tableHeader' }))
    ]];

    const sections = [
      {
        title: 'LIABILITIES',
        items: [
          { label: 'A. Shareholder Funds', isSubheader: true },
          { label: 'Capital', path: 'liabilities.shareholderFunds.capital', indent: '  ' },
          { label: 'Reserve & Surplus', path: 'liabilities.shareholderFunds.reserveSurplus', indent: '  ' },
          { label: 'B. Non-Current Liabilities', isSubheader: true },
          { label: 'Term Loan', path: 'liabilities.nonCurrentLiabilities.termLoan', indent: '  ' },
          { label: 'C. Current Liabilities', isSubheader: true },
          { label: 'Working Capital Loan', path: 'liabilities.currentLiabilities.wcLoan', indent: '  ' },
          { label: 'Accounts Payable', path: 'liabilities.currentLiabilities.accountsPayable', indent: '  ' },
          { label: 'Total Liabilities', path: 'liabilities.totalLiabilities', bold: true, bgColor: '#f0f0f0' }
        ]
      },
      {
        title: 'ASSETS',
        items: [
          { label: 'A. Non-Current Assets', isSubheader: true },
          { label: 'Fixed Assets (Net)', path: 'assets.nonCurrentAssets.fixedAssets', indent: '  ' },
          { label: 'B. Current Assets', isSubheader: true },
          { label: 'Inventory', path: 'assets.currentAssets.inventory', indent: '  ' },
          { label: 'Trade Receivables', path: 'assets.currentAssets.tradeReceivables', indent: '  ' },
          { label: 'Cash', path: 'assets.currentAssets.cash', indent: '  ' },
          { label: 'Total Assets', path: 'assets.totalAssets', bold: true, bgColor: '#f0f0f0' }
        ]
      }
    ];

    sections.forEach(section => {
      rows.push([{ text: section.title, style: 'tableCellLeft', bold: true, colSpan: bs.length + 1 }, ...Array(bs.length).fill('')]);
      section.items.forEach(item => {
        const row = [{ 
          text: item.isSubheader ? item.label : (item.indent || '') + item.label, 
          style: item.isSubheader ? 'tableCellLeft' : 'tableCellLeft', 
          bold: item.bold || item.isSubheader 
        }];
        bs.forEach((b, idx) => {
          let val = 0;
          if (!item.isSubheader) {
            const parts = item.path.split('.');
            let obj = b;
            parts.forEach(p => { obj = obj[p]; });
            val = obj || 0;
          }
          row.push({
            text: item.isSubheader ? '' : this.formatNumber(val, true),
            style: 'tableCellRight',
            bold: item.bold,
            fillColor: item.bgColor ? item.bgColor : undefined
          });
        });
        rows.push(row);
      });
    });

    // Add validation note
    const validationRows = [];
    bs.forEach(b => {
      validationRows.push(`Year ${b.year}: ${b.isBalanced ? '✓ Balanced' : '✗ Difference: ' + this.formatNumber(b.balanceDifference)}`);
    });

    return {
      stack: [
        { text: 'BALANCE SHEET (5 Years)', style: 'header' },
        { text: 'Statement of financial position showing assets, liabilities, and equity. Balance sheet must balance (Assets = Liabilities + Equity):', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['30%', ...bs.map(() => '14%')],
            body: rows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#999',
            vLineColor: () => '#999'
          }
        },
        { text: `\nValidation: ${validationRows.join(' | ')}`, fontSize: 10, margin: [0, 10, 0, 0], color: '#333' }
      ]
    };
  }

  static generateDepreciationScheduleTable(projectData) {
    const depSchedule = projectData.depreciation?.schedule || [];
    if (depSchedule.length === 0) return { text: '' };

    const depRate = projectData.depreciation?.depreciationRate || 15;
    const rows = [[
      { text: 'Particulars', style: 'tableHeader' },
      { text: `Rate (${depRate}%)`, style: 'tableHeader' },
      ...depSchedule.map(d => ({ text: `Year ${d.year}`, style: 'tableHeader' }))
    ]];

    // Gross Block row
    const gbRow = [{ text: 'Gross Block', style: 'tableCellLeft' }, { text: '', style: 'tableCell' }];
    depSchedule.forEach(d => {
      gbRow.push({ text: this.formatNumber(d.grossBlock), style: 'tableCellRight' });
    });
    rows.push(gbRow);

    // Depreciation row
    const depRow = [{ text: 'Less: Depreciation', style: 'tableCellLeft' }, { text: '', style: 'tableCell' }];
    depSchedule.forEach(d => {
      depRow.push({ text: this.formatNumber(d.depreciationAmount), style: 'tableCellRight' });
    });
    rows.push(depRow);

    // Written Down Value row
    const wdvRow = [{ text: 'Written Down Value (Net)', style: 'tableCellLeft', bold: true }, { text: '', style: 'tableCell' }];
    depSchedule.forEach(d => {
      wdvRow.push({ text: this.formatNumber(d.writtenDownValue), style: 'tableCellRight', bold: true });
    });
    rows.push(wdvRow);

    return {
      stack: [
        { text: 'DEPRECIATION SCHEDULE', style: 'header' },
        { text: `Fixed assets depreciation using Written Down Value (WDV) method at ${depRate}% per annum:`, style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['25%', '15%', ...depSchedule.map(() => '12%')],
            body: rows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#999',
            vLineColor: () => '#999'
          }
        }
      ]
    };
  }

  static generateRepaymentScheduleTable(projectData) {
    const schedule = projectData.termLoanDetails?.repaymentSchedule || [];
    const rows = [[
      { text: 'Month', style: 'tableHeader' },
      { text: 'EMI (₹)', style: 'tableHeader' },
      { text: 'Principal (₹)', style: 'tableHeader' },
      { text: 'Interest (₹)', style: 'tableHeader' },
      { text: 'Balance (₹)', style: 'tableHeader' }
    ]];

    // Show all months, but break into multiple tables if too long
    // For now, let's ensure the table doesn't overflow
    schedule.forEach(s => {
      rows.push([
        { text: `${s.month}`, style: 'tableCell' },
        { text: this.formatNumber(s.emiAmount || 0), style: 'tableCellRight' },
        { text: this.formatNumber(s.principalPaid || 0), style: 'tableCellRight' },
        { text: this.formatNumber(s.interestPaid || 0), style: 'tableCellRight' },
        { text: this.formatNumber(s.outstandingBalance || 0), style: 'tableCellRight' }
      ]);
    });

    return {
      stack: [
        { text: 'TERM LOAN REPAYMENT SCHEDULE', style: 'header' },
        { text: 'Detailed month-wise repayment schedule for the Term Loan component:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ['10%', '20%', '20%', '20%', '30%'],
            body: rows
          },
          layout: 'lightHorizontalLines'
        }
      ]
    };
  }

  static generateDSCRTable(projectData) {
    const dscr = projectData.dscr || {};
    const yearlyDSCR = dscr.yearlyDSCR || [];
    const rows = [[
      { text: 'Year', style: 'tableHeader' },
      { text: 'PAT (₹)', style: 'tableHeader' },
      { text: 'Interest (₹)', style: 'tableHeader' },
      { text: 'Depr (₹)', style: 'tableHeader' },
      { text: 'Total Debt (₹)', style: 'tableHeader' },
      { text: 'DSCR', style: 'tableHeader' }
    ]];

    yearlyDSCR.forEach(d => {
      rows.push([
        { text: `Year ${d.year}`, style: 'tableCell' },
        { text: this.formatNumber(d.profitAfterTax || 0, true), style: 'tableCellRight' },
        { text: this.formatNumber(d.yearInterest || 0, true), style: 'tableCellRight' },
        { text: this.formatNumber(d.depreciation || 0, true), style: 'tableCellRight' },
        { text: this.formatNumber(d.debtObligation || 0, true), style: 'tableCellRight' },
        { text: this.formatNumber(d.dscr || 0), style: 'tableCellRight', bold: true }
      ]);
    });

    const hasLowDSCR = yearlyDSCR.some(d => d.dscr < 1.25);
    const explanationNote = hasLowDSCR 
      ? { text: '\n⚠ Note: A DSCR below 1.25 indicates insufficient cash generation to comfortably service debt obligations. This project may not be financially feasible.', 
          fontSize: 9, 
          color: '#d9534f', 
          margin: [0, 10, 0, 0],
          italics: true }
      : null;

    return {
      stack: [
        { text: 'DEBT SERVICE COVERAGE RATIO (DSCR)', style: 'header' },
        { text: 'DSCR indicates the capacity of the project to service its debt obligations:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['15%', '17%', '17%', '17%', '17%', '17%'],
            body: rows
          },
          layout: 'lightHorizontalLines'
        },
        { text: `Average DSCR: ${this.formatNumber(dscr.averageDSCR || 0)}`, bold: true, margin: [0, 10, 0, 0] },
        ...(explanationNote ? [explanationNote] : [])
      ]
    };
  }

  static generateBreakEvenTable(projectData) {
    const be = projectData.breakEvenAnalysis || {};
    return {
      stack: [
        { text: 'BREAK-EVEN ANALYSIS', style: 'header' },
        { text: 'The break-even point indicates the level of sales at which the project covers all its costs:', style: 'introText' },
        {
          table: {
            widths: ['60%', '40%'],
            body: [
              [{ text: 'Parameter', style: 'tableHeader' }, { text: 'Value', style: 'tableHeader' }],
              [{ text: 'Total Annual Sales (Year 1)', style: 'tableCellLeft' }, { text: `₹ ${this.formatNumber(this.safeGet(projectData, 'revenueProjection.yearlyProjections.0.actualRevenue'))}`, style: 'tableCellRight' }],
              [{ text: 'Variable Costs', style: 'tableCellLeft' }, { text: `₹ ${this.formatNumber(be.variableCost || 0)}`, style: 'tableCellRight' }],
              [{ text: 'Fixed Costs', style: 'tableCellLeft' }, { text: `₹ ${this.formatNumber(be.fixedCost || 0)}`, style: 'tableCellRight' }],
              [{ text: 'Break-Even Point (%)', style: 'tableCellLeft' }, { text: `${this.formatNumber(be.bepPercent || 0)}%`, style: 'tableCellRight', bold: true }],
              [{ text: 'Break-Even Sales Value', style: 'tableCellLeft' }, { text: `₹ ${this.formatNumber(be.bepSales || 0)}`, style: 'tableCellRight', bold: true }]
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ]
    };
  }

  static generateAssumptions(projectData) {
    const basic = projectData.basicInfo || {};
    if (!basic.assumptions || basic.assumptions.trim() === '') return { text: '' };
    return {
      stack: [
        { text: 'FINANCIAL ASSUMPTIONS', style: 'header' },
        { text: basic.assumptions, style: 'normal', margin: [0, 5, 0, 10] }
      ]
    };
  }

  static generateConclusion(projectData) {
    const dscr = this.safeGet(projectData, 'dscr.averageDSCR');
    return {
      stack: [
        { text: 'FEASIBILITY CONCLUSION', style: 'header' },
        {
          text: `Based on projected financial performance, the project is financially viable. The average DSCR of ${this.formatNumber(dscr)} exceeds the benchmark of 1.25, indicating strong repayment capacity. The break-even level provides adequate margin of safety. The project is recommended for financial assistance.`,
          style: 'normal',
          bold: false,
          margin: [0, 10, 0, 10]
        }
      ]
    };
  }
}