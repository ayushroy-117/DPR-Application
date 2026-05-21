import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

// Initialize pdfMake with fonts
try {
  pdfMake.vfs = pdfFonts;
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

const width = 900;
const height = 420;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

// ─────────────────────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  navy:       '#0D2137',
  navyMid:    '#1A3A5C',
  accent:     '#2E6DA4',
  gold:       '#C8972A',
  goldLight:  '#F5E6C8',
  white:      '#FFFFFF',
  offWhite:   '#F4F6F9',
  tableAlt:   '#EEF3F8',
  lightBlue:  '#E8F0F7',
  midGrey:    '#8E9BAA',
  darkGrey:   '#3D4A57',
  borderGrey: '#CBD8E4',
  green:      '#1B7A4A',
  red:        '#C0392B',
};

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Standard table layout with navy header + gold rule + alternating rows */
const proLayout = {
  hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.4,
  vLineWidth: () => 0.4,
  hLineColor: (i) => (i === 1) ? C.gold : C.borderGrey,
  vLineColor: () => C.borderGrey,
  fillColor:  (row) => row === 0 ? C.navy : (row % 2 === 0 ? C.tableAlt : C.white),
  paddingLeft:   () => 8,
  paddingRight:  () => 8,
  paddingTop:    () => 6,
  paddingBottom: () => 6,
};

/** Lightweight layout for inner sub-tables (no coloured rows) */
const lightLayout = {
  hLineWidth: () => 0.4,
  vLineWidth: () => 0.4,
  hLineColor: () => C.borderGrey,
  vLineColor: () => C.borderGrey,
  paddingLeft:   () => 7,
  paddingRight:  () => 7,
  paddingTop:    () => 5,
  paddingBottom: () => 5,
};

/** Section header bar (navy pill with gold underline) */
const sectionHeader = (title) => ({
  stack: [
    {
      canvas: [
        { type: 'rect', x: 0, y: 0, w: 3, h: 18, r: 1, color: C.gold },
      ],
      relativePosition: { x: 0, y: 0 },
    },
    {
      text: title,
      fontSize: 12,
      bold: true,
      color: C.navy,
      margin: [10, 0, 0, 0],
    },
  ],
  margin: [0, 18, 0, 6],
  // pdfmake doesn't support canvas + text in a true "side-by-side stack" natively,
  // so we use a single-row table as the section banner instead (see below).
});

/** Better section banner – rendered as a table row for reliable colour fill */
const sectionBanner = (title) => ({
  table: {
    widths: [4, '*'],
    body: [[
      { text: '', fillColor: C.gold, border: [false, false, false, false] },
      {
        text: title,
        fontSize: 12,
        bold: true,
        color: C.navy,
        fillColor: C.lightBlue,
        border: [false, false, false, false],
        margin: [6, 4, 0, 4],
      },
    ]],
  },
  layout: {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft:   () => 0,
    paddingRight:  () => 0,
    paddingTop:    () => 0,
    paddingBottom: () => 0,
  },
  margin: [0, 16, 0, 6],
});

/** Gold divider line */
const goldRule = (marginTop = 2, marginBottom = 10) => ({
  canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: C.gold }],
  margin: [0, marginTop, 0, marginBottom],
});

/** KPI card row – accepts array of { label, value } objects */
const kpiRow = (items) => {
  // Fixed equal widths — '*' lets pdfmake distribute evenly without overflow
  return {
    table: {
      widths: items.map(() => '*'),
      body: [
        items.map(item => ({
          stack: [
            {
              // Value: scale font down so even "₹ 3,60,000.00" fits on one line
              text: item.value,
              fontSize: 9,
              bold: true,
              color: C.navy,
              alignment: 'center',
              // Allow wrapping only as last resort — tight padding handles the rest
            },
            {
              text: item.label,
              fontSize: 6.5,
              color: C.midGrey,
              alignment: 'center',
              margin: [0, 2, 0, 0],
            },
          ],
          fillColor: C.lightBlue,
          // No per-cell margin — padding from layout is enough
          border: [true, true, true, true],
        })),
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => C.borderGrey,
      vLineColor: () => C.borderGrey,
      // Tight horizontal padding so numbers don't get squeezed
      paddingLeft:   () => 3,
      paddingRight:  () => 3,
      paddingTop:    () => 8,
      paddingBottom: () => 8,
    },
    margin: [0, 0, 0, 8],
  };
};

/** Standard table header cell */
const th = (text, align = 'center') => ({
  text,
  bold: true,
  fontSize: 9,
  color: C.white,
  alignment: align,
  margin: [0, 2, 0, 2],
});

/** Standard table body cell */
const td = (text, align = 'center', opts = {}) => ({
  text: String(text ?? ''),
  fontSize: 9,
  color: C.darkGrey,
  alignment: align,
  bold: opts.bold || false,
  ...opts,
});

/** Highlight cell (totals / summary rows) */
const tdHL = (text, align = 'right', navy = false) => ({
  text: String(text ?? ''),
  fontSize: 9,
  bold: true,
  color: navy ? C.white : C.navy,
  alignment: align,
  fillColor: navy ? C.navy : C.lightBlue,
});

// ─────────────────────────────────────────────────────────────────────────────
export class PDFService {
  // ── unchanged helpers ──────────────────────────────────────────────────────
  static formatNumber(value, useAbsoluteValue = false) {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    const absNum = useAbsoluteValue ? Math.abs(num) : num;
    return absNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  static safeGet(obj, path, defaultValue = 0) {
    const value = path.split('.').reduce((current, prop) => current?.[prop], obj);
    return typeof value === 'number' ? value : defaultValue;
  }

  // ── chart generator (professional styled) ─────────────────────────────────
  static async generateGrayscaleChart(labels, data, title, color = '#2E6DA4') {
    const configuration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: color + 'CC',
          borderColor: color,
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      },
      options: {
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: title,
            color: C.navy,
            font: { size: 14, weight: '600' },
            padding: { bottom: 16 },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#555', font: { size: 10 } },
            grid: { color: '#e8e8e8' },
            border: { display: false },
          },
          x: {
            ticks: { color: '#555', font: { size: 10 } },
            grid: { display: false },
            border: { display: false },
          },
        },
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
      },
    };
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  // ── main entry point ───────────────────────────────────────────────────────
  static async generateDPR(projectData) {
    try {
      const basic = projectData.basicInfo || {};
      const years = [1, 2, 3, 4, 5].map(y => `Year ${y}`);

      // ── all data bindings identical to original ──
      const revenueData = projectData.revenueProjection?.yearlyProjections?.map(p => p.actualRevenue || 0) || [0,0,0,0,0];
      const profitData  = projectData.profitability?.map(p => p.profitAfterTax) || [0,0,0,0,0];
      const cashData    = projectData.cashFlow?.map(c => c.closingBalance)      || [0,0,0,0,0];

      const [revenueChart, profitChart, cashChart] = await Promise.all([
        this.generateGrayscaleChart(years, revenueData, 'Annual Revenue Projection (₹)',  '#2E6DA4'),
        this.generateGrayscaleChart(years, profitData,  'Net Profit After Tax (₹)',        '#1B7A4A'),
        this.generateGrayscaleChart(years, cashData,    'Cash Balance Growth (₹)',         '#C8972A'),
      ]);

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [50, 75, 50, 55],
        defaultStyle: { font: 'Roboto', fontSize: 9, color: C.darkGrey },

        // ── header ──────────────────────────────────────────────────────────
        header: (currentPage) => {
          if (currentPage === 1) return null;
          return {
            stack: [
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [[
                    {
                      text: `DETAILED PROJECT REPORT  •  ${(basic.businessName || 'PROJECT').toUpperCase()}`,
                      fontSize: 8,
                      bold: true,
                      color: C.white,
                      margin: [50, 10, 0, 10],
                    },
                    {
                      text: 'Swabalamban Scheme',
                      fontSize: 7.5,
                      color: C.gold,
                      alignment: 'right',
                      margin: [0, 10, 50, 10],
                    },
                  ]],
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                  fillColor:  () => C.navy,
                  paddingLeft:   () => 0,
                  paddingRight:  () => 0,
                  paddingTop:    () => 0,
                  paddingBottom: () => 0,
                },
              },
              {
                canvas: [{
                  type: 'line', x1: 0, y1: 0, x2: 595, y2: 0,
                  lineWidth: 1.5, lineColor: C.gold,
                }],
                margin: [0, 0, 0, 0],
              },
            ],
          };
        },

        // ── footer ──────────────────────────────────────────────────────────
        footer: (currentPage, pageCount) => {
          if (currentPage === 1) return null;
          return {
            stack: [
              {
                canvas: [{
                  type: 'line', x1: 0, y1: 0, x2: 595, y2: 0,
                  lineWidth: 1, lineColor: C.gold,
                }],
                margin: [0, 0, 0, 0],
              },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [[
                    {
                      text: 'CONFIDENTIAL  |  Submitted under Swabalamban Scheme',
                      fontSize: 7.5,
                      color: C.white,
                      margin: [50, 6, 0, 6],
                    },
                    {
                      text: `Page ${currentPage} of ${pageCount}`,
                      fontSize: 7.5,
                      bold: true,
                      color: C.white,
                      alignment: 'right',
                      margin: [0, 6, 50, 6],
                    },
                  ]],
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                  fillColor:  () => C.navy,
                  paddingLeft:   () => 0,
                  paddingRight:  () => 0,
                  paddingTop:    () => 0,
                  paddingBottom: () => 0,
                },
              },
            ],
          };
        },

        // ── content ─────────────────────────────────────────────────────────
        content: [
          this.generateCoverPage(projectData),
          { text: '', pageBreak: 'after' },

          this.generateProjectAtAGlance(projectData),
          { text: '', pageBreak: 'after' },

          sectionBanner('FINANCIAL PERFORMANCE VISUALIZATION'),
          { text: 'Graphical representation of key financial indicators over the 5-year projection period:', fontSize: 9, color: C.midGrey, margin: [0, 0, 0, 12] },
          { image: revenueChart, width: 465, alignment: 'center', margin: [0, 0, 0, 16] },
          { image: profitChart,  width: 465, alignment: 'center', margin: [0, 0, 0, 16] },
          { image: cashChart,    width: 465, alignment: 'center' },
          { text: '', pageBreak: 'after' },

          this.generateIntroductionPage(projectData),
          this.generateProjectCostTable(projectData),
          this.generateMeansOfFinanceTable(projectData),
          { text: '', pageBreak: 'after' },

          this.generateDepreciationScheduleTable(projectData),

          this.generateRevenueProjectionTable(projectData),
          this.generateExpenseProjectionTable(projectData),
          { text: '', pageBreak: 'after' },

          this.generateProfitabilityStatementTable(projectData),
          { text: '', pageBreak: 'after' },

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

          this.generateConclusion(projectData),
        ],

        // ── styles ───────────────────────────────────────────────────────────
        styles: {
          title:          { fontSize: 20, bold: true, alignment: 'center', color: C.navy },
          header:         { fontSize: 12, bold: true, color: C.navy, margin: [0, 0, 0, 0] },
          tableHeader:    { bold: true, fontSize: 9, color: C.white, alignment: 'center', margin: [0, 2, 0, 2] },
          tableCell:      { fontSize: 9, margin: [0, 2, 0, 2], alignment: 'center',  color: C.darkGrey },
          tableCellLeft:  { fontSize: 9, margin: [0, 2, 0, 2], alignment: 'left',   color: C.darkGrey },
          tableCellRight: { fontSize: 9, margin: [0, 2, 0, 2], alignment: 'right',  color: C.darkGrey },
          normal:         { fontSize: 9, lineHeight: 1.5, alignment: 'justify', color: C.darkGrey },
          introText:      { fontSize: 9, lineHeight: 1.5, alignment: 'justify', color: C.midGrey, margin: [0, 0, 0, 8] },
        },
      };

      return pdfMake.createPdf(docDefinition);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new Error(`PDF Generation Failed: ${error.message}`);
    }
  }

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  static generateCoverPage(projectData) {
    const basic = projectData.basicInfo || {};

    const titleLine =
      `Submission of Project Proposal on\n` +
      `${basic.businessName || 'Proposed Business'} for Financial\n` +
      `Assistance under ${basic.schemeName || 'Swabalamban'}\n` +
      `Scheme`;

    const submittedToLines = [
      'The General Manager,',
      `District Industries Center ${basic.district || ''}${basic.district && basic.state ? ', ' : ''}${basic.state || ''}`,
    ].filter(Boolean);

    const submittedByLines = [
      basic.promoterName,
      basic.guardianName ? `C/O; ${basic.guardianName}` : null,
      basic.locality,
      basic.address,
      [basic.city, basic.state].filter(Boolean).join(', '),
      basic.pinCode ? `${basic.state || ''} - ${basic.pinCode}` : null,
    ].filter(Boolean);

    return {
      table: {
        widths: ['*'],
        heights: [672],
        body: [[{
          fillColor: C.navy,
          border: [true, true, true, true],
          borderColor: [C.gold, C.gold, C.gold, C.gold],
          stack: [
            // Gold accent bar at top
            {
              canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 5, color: C.gold }],
              margin: [0, 0, 0, 0],
            },

            // Title
            {
              text: titleLine,
              fontSize: 22,
              bold: true,
              color: C.gold,
              alignment: 'center',
              lineHeight: 1.5,
              margin: [20, 40, 20, 0],
            },

            // Thin gold rule under title
            {
              canvas: [{
                type: 'line', x1: 100, y1: 0, x2: 415, y2: 0,
                lineWidth: 1, lineColor: C.gold + '88',
              }],
              margin: [0, 20, 0, 0],
            },

            // Spacer
            { text: '', margin: [0, 80, 0, 0] },

            // Submitted To block
            {
              stack: [
                {
                  text: 'Submitted To :',
                  bold: true,
                  fontSize: 11,
                  color: C.gold,
                  margin: [36, 0, 0, 5],
                },
                ...submittedToLines.map(line => ({
                  text: line,
                  fontSize: 10,
                  color: '#C8D8E8',
                  margin: [36, 0, 0, 3],
                })),
              ],
              margin: [0, 0, 0, 28],
            },

            // Submitted By block
            {
              stack: [
                {
                  text: 'Submitted By :',
                  bold: true,
                  fontSize: 11,
                  color: C.gold,
                  margin: [36, 0, 0, 5],
                },
                ...submittedByLines.map(line => ({
                  text: line,
                  fontSize: 10,
                  color: '#C8D8E8',
                  margin: [36, 0, 0, 3],
                })),
              ],
            },

            // Gold accent bar at bottom
            {
              canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 5, color: C.gold }],
              margin: [0, 30, 0, 0],
              relativePosition: { x: 0, y: 20 },
            },
          ],
        }]],
      },
      layout: {
        hLineWidth: () => 2,
        vLineWidth: () => 2,
        hLineColor: () => C.gold,
        vLineColor: () => C.gold,
        paddingLeft:   () => 0,
        paddingRight:  () => 0,
        paddingTop:    () => 0,
        paddingBottom: () => 0,
      },
    };
  }

  // ── PROJECT AT A GLANCE ────────────────────────────────────────────────────
  static generateProjectAtAGlance(projectData) {
    const basic = projectData.basicInfo    || {};
    const pc    = projectData.projectCost  || {};
    const mof   = projectData.meansOfFinance || {};
    const be    = projectData.breakEvenAnalysis || {};
    const dscr  = projectData.dscr         || {};
    const tl    = projectData.termLoanDetails || {};

    // ── all data reads identical to original ──
    const totalCost   = this.safeGet(projectData, 'totalProjectRequirement');
    const fixedCap    = pc.fixedCapital              || 0;
    const workingCap  = pc.workingCapitalRequirement || 0;
    const marginMoney = mof.marginMoney              || (totalCost * 0.05);
    const bankLoan    = mof.bankLoan                 || (totalCost * 0.95);
    const marginPct   = mof.marginPercent            || 5;
    const bankPct     = 100 - marginPct;
    const tenure      = Math.ceil((tl.tenureMonths   || basic.loanTenure * 12 || 60) / 12);
    const moratorium  = tl.moratoriumMonths          || basic.moratorium   || 6;
    const avgDSCR     = dscr.averageDSCR             || 0;
    const bepPct      = be.bepPercent                || 0;
    const employment  = basic.employmentType         || basic.employmentCount || 'N/A';

    // KPI strip
    const kpis = [
      { label: 'Total Project Cost',    value: `₹ ${this.formatNumber(totalCost)}` },
      { label: `Bank Loan (${bankPct}%)`, value: `₹ ${this.formatNumber(bankLoan)}` },
      { label: `Margin Money (${marginPct}%)`, value: `₹ ${this.formatNumber(marginMoney)}` },
      { label: 'Avg. DSCR',             value: this.formatNumber(avgDSCR) },
      { label: 'Break-Even',            value: `${this.formatNumber(bepPct)}%` },
      { label: 'Employment',            value: String(employment) },
    ];

    // Detail rows helper
    const row = (num, label, value, sub = false) => [
      td(num,   'left',  { bold: !sub, color: sub ? C.darkGrey : C.accent, fontSize: sub ? 8.5 : 9 }),
      td(label, 'left',  { bold: !sub, color: sub ? C.darkGrey : C.accent, fontSize: sub ? 8.5 : 9 }),
      td(':',   'center',{ fontSize: 9 }),
      td(value, 'left',  { fontSize: sub ? 8.5 : 9 }),
    ];

    const tableBody = [
      // header
      [{
        text: 'PROJECT AT A GLANCE',
        colSpan: 4, alignment: 'center', bold: true, fontSize: 12,
        color: C.white, fillColor: C.navy,
        border: [false, false, false, false],
        margin: [0, 5, 0, 5],
      }, {}, {}, {}],

      row('1.',  'Name of the Unit',              basic.businessName   || 'N/A'),
      row('2.',  'Name of the promoter',          basic.promoterName   || 'N/A'),
      row('3.',  'Category of the project',       basic.businessType   || basic.businessName || 'N/A'),
      row('4.',  'Total Project Cost',            `₹ ${this.formatNumber(totalCost)}`),
      row('A)',  'Fixed Capital',                 `₹ ${this.formatNumber(fixedCap)}`,  true),
      row('B)',  'Working Capital',               `₹ ${this.formatNumber(workingCap)}`, true),
      row('5.',  'Source of Fund',                ''),
      row('A)',  `Margin Money @${marginPct}%`,   `₹ ${this.formatNumber(marginMoney)}`, true),
      row('B)',  `Loan Under Financial Institute @${bankPct}%`, `₹ ${this.formatNumber(bankLoan)}`, true),
      row('6.',  'Loan Tenure',                   `${tenure} Year`),
      row('7.',  'Moratorium',                    `: ${moratorium} Month`),
      row('8.',  'BEP',                           `: ${this.formatNumber(bepPct)}%`),
      row('9.',  'Average DSCR',                  `: ${this.formatNumber(avgDSCR)}`),
      row('10.', 'Employment Provision',          String(employment)),
    ];

    return {
      stack: [
        sectionBanner('PROJECT AT A GLANCE'),
        goldRule(),
        kpiRow(kpis),
        {
          table: {
            widths: ['9%', '42%', '4%', '45%'],
            body: tableBody,
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.3,
            vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 1 : 0,
            hLineColor: (i) => i === 1 ? C.gold : C.borderGrey,
            vLineColor: () => C.borderGrey,
            fillColor:  (row) => row === 0 ? C.navy : (row % 2 === 0 ? C.tableAlt : C.white),
            paddingLeft:   () => 8,
            paddingRight:  () => 8,
            paddingTop:    () => 5,
            paddingBottom: () => 5,
          },
        },
      ],
    };
  }

  // ── EXECUTIVE SUMMARY (unchanged logic, new styling) ──────────────────────
  static generateExecutiveSummary(projectData) {
    const cost  = this.safeGet(projectData, 'totalProjectRequirement');
    const basic = projectData.basicInfo || {};
    const mof   = projectData.meansOfFinance || {};
    const bankLoan    = mof.bankLoan || (cost * 0.95);
    const marginMoney = mof.marginMoney || (cost * 0.05);

    return {
      stack: [
        sectionBanner('EXECUTIVE SUMMARY'),
        { text: 'This Detailed Project Report (DPR) outlines the technical and financial feasibility of the proposed venture. Key parameters are summarised below:', style: 'introText' },
        {
          table: {
            widths: ['55%', '45%'],
            body: [
              [th('Project Parameter', 'left'), th('Value', 'right')],
              [td('Total Project Cost',      'left'),  tdHL(`₹ ${this.formatNumber(cost)}`,          'right')],
              [td('Bank Loan Amount',        'left'),  td(  `₹ ${this.formatNumber(bankLoan)}`,      'right')],
              [td('Promoter Margin',         'left'),  td(  `₹ ${this.formatNumber(marginMoney)}`,   'right')],
              [td('Employment Generation',   'left'),  td(  `${basic.employmentCount || 0} Persons`, 'right')],
              [td('Average DSCR',            'left'),  tdHL(this.formatNumber(this.safeGet(projectData, 'dscr.averageDSCR')), 'right')],
              [td('Break-Even Point (%)',    'left'),  td(  `${this.formatNumber(this.safeGet(projectData, 'breakEvenAnalysis.bepPercent'))}%`, 'right')],
            ],
          },
          layout: proLayout,
        },
      ],
    };
  }

  // ── INTRODUCTION ──────────────────────────────────────────────────────────
  static generateIntroductionPage(projectData) {
    const basic = projectData.basicInfo || {};

    const content = basic.introduction && basic.introduction.trim() !== ''
      ? [{ text: basic.introduction, style: 'introText' }]
      : [
          { text: `The proposed unit is engaged in ${basic.businessType || 'business activities'}. This project report provides a comprehensive analysis of the viability and financial feasibility of the proposed business venture under ${basic.schemeName || 'the promotional scheme'}.`, style: 'introText' },
          { text: `Business Type: ${basic.businessType || 'Not Specified'}`, style: 'introText', bold: true, margin: [0, 6, 0, 6] },
          { text: `The proposed business will serve a significant market demand in the local area. With proper implementation and management, the venture is expected to generate substantial employment and contribute to the local economy.`, style: 'introText' },
          { text: `Employment Generation: This project is expected to generate employment for approximately ${basic.employmentCount || '0'} persons, contributing to skill development and livelihood creation in the region.`, style: 'introText', bold: true },
        ];

    return {
      stack: [
        sectionBanner('PROJECT OVERVIEW & INTRODUCTION'),
        goldRule(),
        ...content,
      ],
    };
  }

  // ── PROJECT COST ──────────────────────────────────────────────────────────
  static generateProjectCostTable(projectData) {
    const pc     = projectData.projectCost || {};
    const assets = pc.assets || [];

    const assetRows = assets.map(asset => [
      td(asset.asset_name || 'Asset', 'left'),
      td(this.formatNumber(asset.total_budget || 0), 'right'),
    ]);

    return {
      stack: [
        sectionBanner('PROJECT COST STATEMENT'),
        { text: 'The estimated project cost includes investment in fixed assets and initial working capital requirements as detailed below:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['70%', '30%'],
            body: [
              [th('Particulars of Investment', 'left'), th('Amount (₹)', 'right')],
              ...assetRows,
              [tdHL('Total Fixed Capital (A)',        'left'), tdHL(this.formatNumber(pc.fixedCapital || 0), 'right')],
              [td(  'Working Capital Requirement (B)', 'left'), td(  this.formatNumber(pc.workingCapitalRequirement || 0), 'right')],
              [tdHL('Total Project Cost (A + B)',      'left', true), tdHL(this.formatNumber(this.safeGet(projectData, 'totalProjectRequirement')), 'right', true)],
            ],
          },
          layout: proLayout,
        },
      ],
    };
  }

  // ── MEANS OF FINANCE ──────────────────────────────────────────────────────
  static generateMeansOfFinanceTable(projectData) {
    const mof      = projectData.meansOfFinance || {};
    const required = this.safeGet(projectData, 'totalProjectRequirement');

    return {
      stack: [
        sectionBanner('MEANS OF FINANCE'),
        { text: "The project is proposed to be financed through a combination of promoter's margin and bank assistance:", style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['70%', '30%'],
            body: [
              [th('Particulars', 'left'), th('Amount (₹)', 'right')],
              [tdHL('Total Project Requirement',                                     'left'),  tdHL(this.formatNumber(required),                'right')],
              [td(  `Promoter Margin (${mof.marginPercent || 0}%)`,                 'left'),  td(  this.formatNumber(mof.marginMoney || 0),     'right')],
              [tdHL('Bank Loan Assistance',                                          'left'),  tdHL(this.formatNumber(mof.bankLoan || 0),        'right')],
              [td(  '  — Term Loan Component',                                      'left'),  td(  this.formatNumber(mof.termLoanComponent||0), 'right')],
              [td(  '  — Working Capital (CC) Component',                           'left'),  td(  this.formatNumber(mof.wcLoanComponent || 0), 'right')],
              [tdHL('Total Funding Sources', 'left', true), tdHL(this.formatNumber(required), 'right', true)],
            ],
          },
          layout: proLayout,
        },
      ],
    };
  }

  // ── WORKING CAPITAL (unchanged logic) ─────────────────────────────────────
  static generateWorkingCapitalTable(projectData) {
    const wcLoan     = this.safeGet(projectData, 'meansOfFinance.wcLoan');
    const annualSales= this.safeGet(projectData, 'revenueProjection.yearlyProjections.0.actualRevenue');
    const wcLimit    = annualSales * 0.25;

    return {
      stack: [
        sectionBanner('WORKING CAPITAL (CC LOAN) ANALYSIS'),
        { text: 'The working capital requirement is assessed based on the projected sales turnover. As per banking norms, the CC limit is typically restricted to 25% of annual sales.', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['70%', '30%'],
            body: [
              [th('Particulars', 'left'), th('Value (₹)', 'right')],
              [td('Projected Annual Sales (Year 1)',     'left'), td( this.formatNumber(annualSales), 'right')],
              [td('Maximum Permissible Finance (25%)',   'left'), tdHL(this.formatNumber(wcLimit),    'right')],
              [td('Proposed Working Capital Loan',       'left'), tdHL(this.formatNumber(wcLoan),     'right')],
              [td('Status',                              'left'), {
                text: wcLoan <= wcLimit ? 'WITHIN LIMIT ✓' : 'EXCEEDS LIMIT ✗',
                fontSize: 9, bold: true, alignment: 'right',
                color: wcLoan <= wcLimit ? C.green : C.red,
              }],
            ],
          },
          layout: proLayout,
        },
      ],
    };
  }

  // ── REVENUE PROJECTIONS ───────────────────────────────────────────────────
  static generateRevenueProjectionTable(projectData) {
    const rev         = projectData.revenueProjection || {};
    const projections = rev.yearlyProjections || [];

    const rows = [[
      th('Year'), th('Daily Revenue (₹)', 'right'), th('Working Days'),
      th('Capacity %'), th('Annual Sales (₹)', 'right'),
    ]];

    projections.forEach(p => {
      rows.push([
        td(`Year ${p.year}`, 'center'),
        td(this.formatNumber(p.dailyRevenue   || 0), 'right'),
        td(String(p.workingDays              || 0), 'center'),
        td(`${p.capacityUtilization          || 100}%`, 'center'),
        tdHL(this.formatNumber(p.actualRevenue || 0), 'right'),
      ]);
    });

    return {
      stack: [
        sectionBanner('REVENUE PROJECTIONS (5 YEARS)'),
        { text: 'Projected sales revenue based on daily operational estimates and conservative capacity utilization:', style: 'introText' },
        {
          table: { headerRows: 1, widths: ['14%','24%','18%','16%','28%'], body: rows },
          layout: proLayout,
        },
      ],
    };
  }

  // ── EXPENSE PROJECTIONS ───────────────────────────────────────────────────
  static generateExpenseProjectionTable(projectData) {
    const exp         = projectData.expenseProjection || {};
    const projections = exp.yearlyProjections || [];

    const rows = [[
      th('Year'), th('Operating Cost (₹)', 'left'), th('Total Annual Exp (₹)', 'right'),
    ]];

    projections.forEach(p => {
      rows.push([
        td(`Year ${p.year}`, 'center'),
        td('As per operational data', 'left'),
        tdHL(this.formatNumber(p.totalExpense || 0), 'right'),
      ]);
    });

    return {
      stack: [
        sectionBanner('EXPENSE PROJECTIONS (5 YEARS)'),
        { text: 'Annual operating expenses including rent, utilities, salaries, and maintenance:', style: 'introText' },
        {
          table: { headerRows: 1, widths: ['18%','46%','36%'], body: rows },
          layout: proLayout,
        },
      ],
    };
  }

  // ── PROFITABILITY ─────────────────────────────────────────────────────────
  static generateProfitabilityStatementTable(projectData) {
    const profit = projectData.profitability || [];
    if (profit.length === 0) return { text: '' };

    const rows = [[
      th('Particulars', 'left'),
      ...profit.map(p => th(`Year ${p.year}`)),
    ]];

    // ── items list identical to original ──
    const items = [
      { label: 'Revenue from operation',  isSection: true },
      { label: 'Sale items',              key: 'salesRevenue' },
      { label: 'Add: Closing stock',      key: 'closingStock' },
      { label: 'Total',                   key: 'adjustedRevenue',  isTotal: true },
      { label: 'Less:',                   isSection: true },
      { label: 'Opening stock',           key: 'openingStock' },
      { label: 'Stock purchase',          key: 'stockPurchase' },
      { label: 'Salary',                  key: 'salary' },
      { label: 'Electricity/Gas',         key: 'electricity' },
      { label: 'Total',                   key: 'totalDirectCost',  isTotal: true },
      { label: 'Gross Profit',            key: 'grossProfit',      isHighlight: true },
      { label: 'Less:',                   isSection: true },
      { label: 'Miscellaneous',           key: 'misc' },
      { label: 'Total',                   key: 'misc',             isTotal: true },
      { label: 'EBITDA',                  key: 'ebitda',           isHighlight: true },
      { label: 'Depreciation',            key: 'depreciation' },
      { label: 'Interest on TL',          key: 'interestTL' },
      { label: 'Interest on WC',          key: 'interestWC' },
      { label: 'Profit Before Tax',       key: 'profitBeforeTax',  isHighlight: true },
      { label: 'Income Tax',              key: 'incomeTax' },
      { label: 'Profit After Tax',        key: 'profitAfterTax',   isFinal: true },
    ];

    items.forEach(item => {
      if (item.isSection) {
        rows.push([{
          text: item.label, bold: true, fontSize: 9, color: C.navyMid,
          fillColor: C.lightBlue, colSpan: profit.length + 1,
          margin: [0, 2, 0, 2], border: [false, false, false, false],
        }, ...Array(profit.length).fill('')]);
      } else if (item.isFinal) {
        const r = [tdHL(item.label, 'left', true)];
        profit.forEach(p => r.push(tdHL(this.formatNumber(p[item.key] || 0, true), 'right', true)));
        rows.push(r);
      } else if (item.isHighlight) {
        const r = [tdHL(item.label, 'left')];
        profit.forEach(p => r.push(tdHL(this.formatNumber(p[item.key] || 0, true), 'right')));
        rows.push(r);
      } else if (item.isTotal) {
        const r = [td(item.label, 'left', { bold: true, color: C.navy })];
        profit.forEach(p => r.push(td(this.formatNumber(p[item.key] || 0, true), 'right', { bold: true })));
        rows.push(r);
      } else {
        const r = [td(item.label, 'left')];
        profit.forEach(p => r.push(td(this.formatNumber(p[item.key] || 0, true), 'right')));
        rows.push(r);
      }
    });

    return {
      stack: [
        sectionBanner('PROFITABILITY STATEMENT (5 Years)'),
        { text: 'Trading model profitability analysis showing revenue adjustments for inventory movement and comprehensive profit calculation:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['30%', ...profit.map(() => `${70 / profit.length}%`)],
            body: rows,
          },
          layout: proLayout,
        },
      ],
    };
  }

  // ── CASH FLOW ─────────────────────────────────────────────────────────────
  static generateCashFlowTable(projectData) {
    const cf = projectData.cashFlow || [];
    if (cf.length === 0) return { text: '' };

    const rows = [[
      th('Particulars', 'left'),
      ...cf.map(c => th(`Year ${c.year}`)),
    ]];

    // ── sections identical to original ──
    const sections = [
      {
        title: 'CASH INFLOW',
        items: [
          { label: 'Capital',              path: 'inflow.capital' },
          { label: 'PBT + Interest',       path: 'inflow.pbtWithInterest' },
          { label: 'WC Loan Drawn',        path: 'inflow.wcLoanDrawn' },
          { label: 'Depreciation',         path: 'inflow.depreciation' },
          { label: 'Increase in Payables', path: 'inflow.increaseInPayables' },
          { label: 'Total Inflow',         path: 'inflow.totalInflow', bold: true },
        ],
      },
      {
        title: 'CASH OUTFLOW',
        items: [
          { label: 'Fixed Assets',       path: 'outflow.fixedAssets' },
          { label: 'Increase in CA',     path: 'outflow.increaseInCA' },
          { label: 'Interest on TL',     path: 'outflow.interestTL' },
          { label: 'Interest on WC',     path: 'outflow.interestWC' },
          { label: 'Income Tax',         path: 'outflow.taxPaid' },
          { label: 'TL Repaid',          path: 'outflow.tlRepaid' },
          { label: 'Drawings',           path: 'outflow.drawings' },
          { label: 'Total Outflow',      path: 'outflow.totalOutflow', bold: true },
        ],
      },
      {
        title: 'CASH POSITION',
        items: [
          { label: 'Opening Balance',    path: 'openingBalance' },
          { label: 'Net Cash Flow',      path: 'netCashFlow',    bold: true },
          { label: 'Closing Balance',    path: 'closingBalance', bold: true },
        ],
      },
    ];

    sections.forEach(section => {
      rows.push([{
        text: section.title, bold: true, fontSize: 9, color: C.white,
        fillColor: C.navyMid, colSpan: cf.length + 1,
        margin: [0, 2, 0, 2], border: [false, false, false, false],
      }, ...Array(cf.length).fill('')]);

      section.items.forEach(item => {
        const row = [item.bold
          ? tdHL(item.label, 'left')
          : td(item.label, 'left'),
        ];
        cf.forEach(c => {
          const parts = item.path.split('.');
          let val = c;
          parts.forEach(p => { val = val?.[p]; });
          row.push(item.bold
            ? tdHL(this.formatNumber(val || 0, true), 'right')
            : td(this.formatNumber(val || 0, true), 'right'));
        });
        rows.push(row);
      });
    });

    return {
      stack: [
        sectionBanner('CASH FLOW STATEMENT — INDIRECT METHOD (5 Years)'),
        { text: 'Cash flow analysis using indirect method showing capital inflows, operating cash, and financing activities:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['30%', ...cf.map(() => `${70 / cf.length}%`)],
            body: rows,
          },
          layout: proLayout,
        },
      ],
    };
  }

  // ── BALANCE SHEET ─────────────────────────────────────────────────────────
  static generateBalanceSheetTable(projectData) {
    const bs = projectData.balanceSheet || [];
    if (bs.length === 0) return { text: '' };

    const rows = [[
      th('Particulars', 'left'),
      ...bs.map(b => th(`Year ${b.year}`)),
    ]];

    // ── sections identical to original ──
    const sections = [
      {
        title: 'LIABILITIES',
        items: [
          { label: 'A. Shareholder Funds',  isSubheader: true },
          { label: 'Capital',               path: 'liabilities.shareholderFunds.capital',       indent: '   ' },
          { label: 'Reserve & Surplus',     path: 'liabilities.shareholderFunds.reserveSurplus', indent: '   ' },
          { label: 'B. Non-Current Liabilities', isSubheader: true },
          { label: 'Term Loan',             path: 'liabilities.nonCurrentLiabilities.termLoan',  indent: '   ' },
          { label: 'C. Current Liabilities', isSubheader: true },
          { label: 'Working Capital Loan',  path: 'liabilities.currentLiabilities.wcLoan',       indent: '   ' },
          { label: 'Accounts Payable',      path: 'liabilities.currentLiabilities.accountsPayable', indent: '   ' },
          { label: 'Total Liabilities',     path: 'liabilities.totalLiabilities', isTotal: true },
        ],
      },
      {
        title: 'ASSETS',
        items: [
          { label: 'A. Non-Current Assets', isSubheader: true },
          { label: 'Fixed Assets (Net)',    path: 'assets.nonCurrentAssets.fixedAssets',       indent: '   ' },
          { label: 'B. Current Assets',    isSubheader: true },
          { label: 'Inventory',            path: 'assets.currentAssets.inventory',             indent: '   ' },
          { label: 'Trade Receivables',    path: 'assets.currentAssets.tradeReceivables',      indent: '   ' },
          { label: 'Cash',                 path: 'assets.currentAssets.cash',                  indent: '   ' },
          { label: 'Total Assets',         path: 'assets.totalAssets', isTotal: true },
        ],
      },
    ];

    sections.forEach(section => {
      rows.push([{
        text: section.title, bold: true, fontSize: 9, color: C.white,
        fillColor: C.navyMid, colSpan: bs.length + 1,
        margin: [0, 2, 0, 2], border: [false, false, false, false],
      }, ...Array(bs.length).fill('')]);

      section.items.forEach(item => {
        if (item.isSubheader) {
          const r = [td((item.indent || '') + item.label, 'left', { bold: true, color: C.accent })];
          bs.forEach(() => r.push(td('', 'right')));
          rows.push(r);
        } else if (item.isTotal) {
          const r = [tdHL(item.label, 'left', true)];
          bs.forEach(b => {
            const parts = item.path.split('.');
            let obj = b;
            for (const p of parts) { if (obj && typeof obj === 'object') { obj = obj[p]; } else { obj = undefined; break; } }
            const val = obj !== undefined && obj !== null ? obj : 0;
            r.push(tdHL(this.formatNumber(val, true), 'right', true));
          });
          rows.push(r);
        } else {
          const r = [td((item.indent || '') + item.label, 'left')];
          bs.forEach(b => {
            const parts = item.path.split('.');
            let obj = b;
            for (const p of parts) { if (obj && typeof obj === 'object') { obj = obj[p]; } else { obj = undefined; break; } }
            const val = obj !== undefined && obj !== null ? obj : 0;
            r.push(td(this.formatNumber(val, true), 'right'));
          });
          rows.push(r);
        }
      });
    });

    const validationRows = [];
    bs.forEach(b => {
      const isBalanced  = b.isBalanced  !== undefined ? b.isBalanced  : true;
      const difference  = b.balanceDifference !== undefined ? b.balanceDifference : 0;
      validationRows.push(`Year ${b.year}: ${isBalanced ? '✓ Balanced' : '✗ Diff: ' + this.formatNumber(difference)}`);
    });

    return {
      stack: [
        sectionBanner('BALANCE SHEET (5 Years)'),
        { text: 'Statement of financial position showing assets, liabilities, and equity. Balance sheet must balance (Assets = Liabilities + Equity):', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['30%', ...bs.map(() => `${70 / bs.length}%`)],
            body: rows,
          },
          layout: proLayout,
        },
        { text: `\nValidation: ${validationRows.join('  |  ')}`, fontSize: 8, color: C.green, margin: [0, 6, 0, 0] },
      ],
    };
  }

  // ── DEPRECIATION ──────────────────────────────────────────────────────────
  static generateDepreciationScheduleTable(projectData) {
    const depSchedule = projectData.depreciation?.schedule || [];
    if (depSchedule.length === 0) return { text: '' };
    const depRate = projectData.depreciation?.depreciationRate || 15;

    const rows = [[
      th('Particulars', 'left'),
      th(`Rate (${depRate}%)`, 'center'),
      ...depSchedule.map(d => th(`Year ${d.year}`)),
    ]];

    // Gross Block
    const gbRow = [td('Gross Block', 'left'), td('', 'center')];
    depSchedule.forEach(d => gbRow.push(td(this.formatNumber(d.grossBlock), 'right')));
    rows.push(gbRow);

    // Depreciation
    const depRow = [td('Less: Depreciation', 'left'), td('', 'center')];
    depSchedule.forEach(d => depRow.push(td(this.formatNumber(d.depreciationAmount), 'right')));
    rows.push(depRow);

    // Written Down Value
    const wdvRow = [tdHL('Written Down Value (Net)', 'left'), td('', 'center')];
    depSchedule.forEach(d => wdvRow.push(tdHL(this.formatNumber(d.writtenDownValue), 'right')));
    rows.push(wdvRow);

    return {
      stack: [
        sectionBanner('DEPRECIATION SCHEDULE'),
        { text: `Fixed assets depreciation using Written Down Value (WDV) method at ${depRate}% per annum:`, style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['28%', '14%', ...depSchedule.map(() => `${58 / depSchedule.length}%`)],
            body: rows,
          },
          layout: proLayout,
        },
      ],
    };
  }

  // ── REPAYMENT SCHEDULE ────────────────────────────────────────────────────
  static generateRepaymentScheduleTable(projectData) {
    const schedule = projectData.termLoanDetails?.repaymentSchedule || [];

    const rows = [[
      th('Month'), th('EMI (₹)', 'right'), th('Principal (₹)', 'right'),
      th('Interest (₹)', 'right'), th('Balance (₹)', 'right'),
    ]];

    schedule.forEach(s => {
      const isYearEnd = s.month % 12 === 0;
      const cell = (text, align = 'right') => ({
        text: String(text ?? ''),
        fontSize: 8.5,
        alignment: align,
        color: isYearEnd ? C.navy : C.darkGrey,
        bold: isYearEnd,
        fillColor: isYearEnd ? C.goldLight : undefined,
      });
      rows.push([
        cell(String(s.month),                                'center'),
        cell(this.formatNumber(s.emiAmount           || 0)),
        cell(this.formatNumber(s.principalPaid        || 0)),
        cell(this.formatNumber(s.interestPaid         || 0)),
        cell(this.formatNumber(s.outstandingBalance   || 0)),
      ]);
    });

    return {
      stack: [
        sectionBanner('TERM LOAN REPAYMENT SCHEDULE'),
        { text: 'Detailed month-wise repayment schedule for the Term Loan component. Year-end rows are highlighted.', style: 'introText' },
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ['10%', '20%', '22%', '20%', '28%'],
            body: rows,
          },
          layout: {
            hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.3,
            vLineWidth: () => 0.4,
            hLineColor: (i) => i === 1 ? C.gold : C.borderGrey,
            vLineColor: () => C.borderGrey,
            fillColor: (row) => row === 0 ? C.navy : undefined,
            paddingLeft:   () => 6,
            paddingRight:  () => 6,
            paddingTop:    () => 4,
            paddingBottom: () => 4,
          },
        },
      ],
    };
  }

  // ── DSCR ──────────────────────────────────────────────────────────────────
  static generateDSCRTable(projectData) {
    const dscr      = projectData.dscr || {};
    const yearlyDSCR= dscr.yearlyDSCR || [];

    const rows = [[
      th('Year'), th('PAT (₹)', 'right'), th('Interest (₹)', 'right'),
      th('Depr (₹)', 'right'), th('Total Debt (₹)', 'right'), th('DSCR', 'right'),
    ]];

    yearlyDSCR.forEach(d => {
      const dscrVal = d.dscr || 0;
      rows.push([
        td(`Year ${d.year}`, 'center'),
        td(this.formatNumber(d.profitAfterTax  || 0, true), 'right'),
        td(this.formatNumber(d.yearInterest    || 0, true), 'right'),
        td(this.formatNumber(d.depreciation    || 0, true), 'right'),
        td(this.formatNumber(d.debtObligation  || 0, true), 'right'),
        {
          text: this.formatNumber(dscrVal),
          fontSize: 9, bold: true, alignment: 'right',
          color: dscrVal >= 1.25 ? C.green : C.red,
        },
      ]);
    });

    const hasLowDSCR   = yearlyDSCR.some(d => d.dscr < 1.25);
    const explanationNote = hasLowDSCR ? {
      text: '⚠  Note: A DSCR below 1.25 indicates insufficient cash generation to comfortably service debt obligations. This project may not be financially feasible.',
      fontSize: 8, color: C.red, margin: [0, 8, 0, 0], italics: true,
    } : null;

    return {
      stack: [
        sectionBanner('DEBT SERVICE COVERAGE RATIO (DSCR)'),
        { text: 'DSCR indicates the capacity of the project to service its debt obligations:', style: 'introText' },
        {
          table: {
            headerRows: 1,
            widths: ['14%','18%','17%','17%','17%','17%'],
            body: rows,
          },
          layout: proLayout,
        },
        {
          table: {
            widths: ['*', 'auto'],
            body: [[
              { text: 'Average DSCR', fontSize: 10, bold: true, color: C.navy, border: [false,false,false,false] },
              {
                text: this.formatNumber(dscr.averageDSCR || 0),
                fontSize: 14, bold: true, color: C.green, alignment: 'right',
                border: [false,false,false,false],
              },
            ]],
          },
          layout: lightLayout,
          margin: [0, 8, 0, 0],
          fillColor: C.lightBlue,
        },
        ...(explanationNote ? [explanationNote] : []),
      ],
    };
  }

  // ── BREAK-EVEN ────────────────────────────────────────────────────────────
  static generateBreakEvenTable(projectData) {
    const be = projectData.breakEvenAnalysis || {};

    return {
      stack: [
        sectionBanner('BREAK-EVEN ANALYSIS'),
        { text: 'The break-even point indicates the level of sales at which the project covers all its costs:', style: 'introText' },
        {
          table: {
            widths: ['65%', '35%'],
            body: [
              [th('Parameter', 'left'), th('Value', 'right')],
              [td('Total Annual Sales (Year 1)',     'left'), td(`₹ ${this.formatNumber(this.safeGet(projectData, 'revenueProjection.yearlyProjections.0.actualRevenue'))}`, 'right')],
              [td('Variable Costs',                  'left'), td(`₹ ${this.formatNumber(be.variableCost || 0)}`, 'right')],
              [td('Fixed Costs',                     'left'), td(`₹ ${this.formatNumber(be.fixedCost    || 0)}`, 'right')],
              [tdHL('Break-Even Point (%)',           'left'), tdHL(`${this.formatNumber(be.bepPercent  || 0)}%`, 'right')],
              [tdHL('Break-Even Sales Value', 'left', true), tdHL(`₹ ${this.formatNumber(be.bepSales   || 0)}`, 'right', true)],
            ],
          },
          layout: proLayout,
        },
      ],
    };
  }

  // ── ASSUMPTIONS ───────────────────────────────────────────────────────────
  static generateAssumptions(projectData) {
    const basic = projectData.basicInfo || {};
    if (!basic.assumptions || basic.assumptions.trim() === '') return { text: '' };
    return {
      stack: [
        sectionBanner('FINANCIAL ASSUMPTIONS'),
        { text: basic.assumptions, style: 'normal', margin: [0, 4, 0, 8] },
      ],
    };
  }

  // ── CONCLUSION ────────────────────────────────────────────────────────────
  static generateConclusion(projectData) {
    const dscr = this.safeGet(projectData, 'dscr.averageDSCR');

    return {
      stack: [
        sectionBanner('FEASIBILITY CONCLUSION'),
        goldRule(),
        {
          table: {
            widths: ['*'],
            body: [[{
              stack: [
                {
                  text: 'RECOMMENDATION',
                  fontSize: 11, bold: true, color: C.navy, margin: [0, 0, 0, 6],
                },
                {
                  text: `Based on projected financial performance, the project is financially viable. The average DSCR of ${this.formatNumber(dscr)} exceeds the benchmark of 1.25, indicating strong repayment capacity. The break-even level provides an adequate margin of safety. The project is recommended for financial assistance.`,
                  fontSize: 9, lineHeight: 1.6, color: C.darkGrey,
                },
              ],
              fillColor: C.lightBlue,
              border: [true, true, true, true],
              borderColor: [C.gold, C.gold, C.gold, C.gold],
              margin: [10, 10, 10, 10],
            }]],
          },
          layout: {
            hLineWidth: () => 1.5,
            vLineWidth: () => 1.5,
            hLineColor: () => C.gold,
            vLineColor: () => C.gold,
            paddingLeft:   () => 14,
            paddingRight:  () => 14,
            paddingTop:    () => 12,
            paddingBottom: () => 12,
          },
        },
      ],
    };
  }
}