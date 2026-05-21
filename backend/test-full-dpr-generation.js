// Integration Test: Full DPR Generation with Margin Fix Validation
// Run with: node test-full-dpr-generation.js
// This test generates a complete DPR for Sharma General Store and validates all cascade values

import { FinancialCalculations } from './services/financialCalculations.js';

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('🧪 INTEGRATION TEST: Full DPR Generation with Margin Fix');
console.log('═══════════════════════════════════════════════════════════════════\n');

// ── SHARMA GENERAL STORE PROJECT DATA ──────────────────────────────────────────
const projectData = {
  businessName: 'Sharma General Store',
  fixedCapital: 60000,
  workingCapital: 300000,
  scheme: 'SWABALAMBAN',
  
  // Assets breakdown
  assets: [
    { name: 'Furniture & Shelving', total_budget: 25000 },
    { name: 'Electric Items (Fan, Light, Billing Machine)', total_budget: 35000 }
  ],
  
  // Monthly expenses
  monthlyExpenses: {
    rent: 0,
    salary: 4000,
    electricity: 500,
    maintenance: 0,
    misc: 700
  },
  
  // Revenue and capacity
  dailyRevenueYear1: 4500,
  workingDays: 360,
  capacityUtilizationYearly: [60, 70, 80, 90, 100],
  
  // Interest and tenure
  interestRateAnnual: 8,
  wcInterestRateAnnual: 9,
  tenureMonths: 60,
  moratoriumMonths: 6,
  
  // Scheme
  marginPercent: 5
};

console.log('📊 INPUT DATA:');
console.log(`  Project Name:       ${projectData.businessName}`);
console.log(`  Fixed Capital:      ₹${projectData.fixedCapital.toLocaleString()}`);
console.log(`  Working Capital:    ₹${projectData.workingCapital.toLocaleString()}`);
console.log(`  Total:              ₹${(projectData.fixedCapital + projectData.workingCapital).toLocaleString()}`);
console.log(`  Scheme:             ${projectData.scheme}\n`);

// ── STEP 1: CALCULATE PROJECT COST ─────────────────────────────────────────────
console.log('📋 Step 1: Calculate Project Cost');
const projectCost = FinancialCalculations.calculateProjectCost({ assets: projectData.assets });
console.log(`  Fixed Capital:      ₹${projectCost.fixedCapital.toLocaleString()}`);

// ── STEP 2: CALCULATE MEANS OF FINANCE ─────────────────────────────────────────
console.log('\n💰 Step 2: Calculate Means of Finance (Swabalamban - 5% margin on TOTAL cost)');
const meansOfFinance = FinancialCalculations.calculateMeansOfFinance(
  projectData.fixedCapital,
  projectData.workingCapital,
  projectData.marginPercent,
  null,
  projectData.scheme
);

console.log(`  Margin Money:       ₹${meansOfFinance.marginMoney.toLocaleString()} (Expected: ₹18,000)`);
console.log(`  Bank Loan:          ₹${meansOfFinance.bankLoan.toLocaleString()} (Expected: ₹3,42,000)`);
console.log(`  Term Loan:          ₹${meansOfFinance.termLoan.toLocaleString()} (Expected: ₹60,000)`);
console.log(`  WC Loan:            ₹${meansOfFinance.wcLoan.toLocaleString()} (Expected: ₹2,82,000)`);
console.log(`  Term Loan Component: ₹${meansOfFinance.termLoanComponent.toLocaleString()} (Expected: ₹57,000)`);
console.log(`  WC Loan Component:  ₹${meansOfFinance.wcLoanComponent.toLocaleString()} (Expected: ₹2,85,000)\n`);

// ── STEP 3: CALCULATE REVENUE PROJECTIONS ──────────────────────────────────────
console.log('📈 Step 3: Generate Revenue Projections (5 Years)');
const revenueProjections = FinancialCalculations.generateRevenueProjections(
  projectData.dailyRevenueYear1,
  projectData.workingDays,
  5,
  projectData.capacityUtilizationYearly
);
console.log(`  Year 1 Revenue:     ₹${revenueProjections[0].actualRevenue.toLocaleString()}`);
console.log(`  Year 5 Revenue:     ₹${revenueProjections[4].actualRevenue.toLocaleString()}`);

// ── STEP 4: CALCULATE DEPRECIATION ─────────────────────────────────────────────
console.log('\n📊 Step 4: Calculate Depreciation (5 Years @ 15% WDV)');
const depreciation = FinancialCalculations.calculateDepreciation(
  projectData.fixedCapital,
  15, // 15% per annum
  60  // 5 years
);
console.log(`  Year 1 Depreciation: ₹${depreciation.schedule[0].depreciationAmount.toLocaleString()}`);
console.log(`  Year 5 Depreciation: ₹${depreciation.schedule[4].depreciationAmount.toLocaleString()}`);

// ── STEP 5: CALCULATE REPAYMENT SCHEDULE ──────────────────────────────────────
console.log('\n🏦 Step 5: Generate Term Loan Repayment Schedule (5 Years)');
const repaymentSchedule = FinancialCalculations.generateRepaymentSchedule(
  meansOfFinance.termLoan,
  projectData.interestRateAnnual,
  projectData.tenureMonths,
  projectData.moratoriumMonths
);
console.log(`  Monthly EMI:        ₹${repaymentSchedule.emiAmount.toLocaleString()}`);
console.log(`  Total Schedule Months: ${repaymentSchedule.schedule.length}`);

// ── STEP 6: MOCK PROFITABILITY ─────────────────────────────────────────────────
console.log('\n💵 Step 6: Mock Profitability Calculation (Simplified)');
const expenseProjections = FinancialCalculations.generateExpenseProjections(
  projectData.monthlyExpenses,
  5
);
const profitability = FinancialCalculations.calculateProfitability(
  revenueProjections,
  expenseProjections,
  depreciation.schedule[0].depreciationAmount,
  0
);
console.log(`  Year 1 Profit:      ₹${profitability[0].profitAfterTax.toLocaleString()}`);

// ── STEP 7: GENERATE CASH FLOW (KEY TEST FOR MARGIN CASCADE) ────────────────────
console.log('\n💸 Step 7: Generate Cash Flow Statement (KEY - Tests Margin Cascade)');
const tradeReceivables = [
  { year: 1, amount: 4000 },
  { year: 2, amount: 4500 },
  { year: 3, amount: 5000 },
  { year: 4, amount: 6000 },
  { year: 5, amount: 7000 }
];
const proprietorDrawings = [
  { year: 1, amount: 8000 },
  { year: 2, amount: 10000 },
  { year: 3, amount: 14000 },
  { year: 4, amount: 18000 },
  { year: 5, amount: 22000 }
];
const tradingDetails = {
  openingStock: 50000,
  closingStocksList: [280000, 290000, 300000, 285000, 310000],
  stockPurchasesList: [850000, 890000, 920000, 960000, 990000],
  creditorDays: 30
};

const cashFlow = FinancialCalculations.generateCashFlowStatementIndirect(
  { projectCost: { fixedCapital: projectData.fixedCapital }, depreciation },
  profitability,
  repaymentSchedule,
  meansOfFinance,
  tradingDetails,
  tradeReceivables,
  proprietorDrawings
);

console.log(`  Year 1 Capital Inflow: ₹${cashFlow[0].inflow.capital.toLocaleString()} (Expected: ₹18,000)`);
console.log(`  Year 1 Total Inflow:   ₹${cashFlow[0].inflow.totalInflow.toLocaleString()}`);

// ── STEP 8: GENERATE BALANCE SHEET (KEY TEST FOR MARGIN CASCADE) ────────────────
console.log('\n📋 Step 8: Generate Balance Sheet (KEY - Tests Margin Cascade)');
const balanceSheet = FinancialCalculations.generateBalanceSheetProper(
  { projectCost: { fixedCapital: projectData.fixedCapital }, depreciation },
  profitability,
  repaymentSchedule,
  meansOfFinance,
  cashFlow,
  depreciation,
  tradingDetails,
  tradeReceivables
);

console.log(`  Year 1 Capital:      ₹${balanceSheet[0].liabilities.shareholderFunds.capital.toLocaleString()} (Expected: ₹18,000)`);
console.log(`  Year 1 Total Assets: ₹${balanceSheet[0].assets.totalAssets.toLocaleString()}`);
console.log(`  Year 1 Balanced:     ${balanceSheet[0].isBalanced ? '✓' : '✗'}`);

// ── VALIDATION RESULTS ─────────────────────────────────────────────────────────
console.log('\n\n═══════════════════════════════════════════════════════════════════');
console.log('✅ VALIDATION RESULTS');
console.log('═══════════════════════════════════════════════════════════════════\n');

const checks = [
  {
    name: 'Margin Money = 5% of Total Cost',
    actual: meansOfFinance.marginMoney,
    expected: 18000,
    symbol: '₹'
  },
  {
    name: 'Bank Loan = 95% of Total Cost',
    actual: meansOfFinance.bankLoan,
    expected: 342000,
    symbol: '₹'
  },
  {
    name: 'Margin + Bank Loan = Total Cost',
    actual: meansOfFinance.marginMoney + meansOfFinance.bankLoan,
    expected: 360000,
    symbol: '₹'
  },
  {
    name: 'Term Loan Component = 95% of Fixed Capital',
    actual: meansOfFinance.termLoanComponent,
    expected: 57000,
    symbol: '₹'
  },
  {
    name: 'WC Loan Component = 95% of Working Capital',
    actual: meansOfFinance.wcLoanComponent,
    expected: 285000,
    symbol: '₹'
  },
  {
    name: 'Cash Flow Year 1 Capital Inflow',
    actual: cashFlow[0].inflow.capital,
    expected: 18000,
    symbol: '₹'
  },
  {
    name: 'Balance Sheet Year 1 Capital',
    actual: balanceSheet[0].liabilities.shareholderFunds.capital,
    expected: 18000,
    symbol: '₹'
  },
  {
    name: 'Balance Sheet Year 1 Balanced',
    actual: balanceSheet[0].isBalanced ? 1 : 0,
    expected: 1,
    symbol: ''
  }
];

let allPassed = true;
checks.forEach((check, idx) => {
  const passed = Math.abs(check.actual - check.expected) < 1;
  allPassed = allPassed && passed;
  const status = passed ? '✓' : '✗';
  const actualStr = check.symbol ? `${check.symbol}${check.actual.toLocaleString()}` : String(check.actual);
  const expectedStr = check.symbol ? `${check.symbol}${check.expected.toLocaleString()}` : String(check.expected);
  console.log(`${idx + 1}. ${check.name}`);
  console.log(`   ${status} Actual: ${actualStr}, Expected: ${expectedStr}`);
});

console.log('\n' + '═══════════════════════════════════════════════════════════════════');
if (allPassed) {
  console.log('🎉 ALL VALIDATION CHECKS PASSED! ✅');
  console.log('\nThe margin fix is working correctly throughout the entire DPR:');
  console.log('  • Scheme calculation: ✓ (5% of total cost)');
  console.log('  • Means of finance: ✓ (₹18,000 margin)');
  console.log('  • Cash flow cascade: ✓ (Capital inflow ₹18,000)');
  console.log('  • Balance sheet cascade: ✓ (Capital ₹18,000)');
  console.log('  • All statements balanced: ✓');
} else {
  console.log('❌ SOME VALIDATION CHECKS FAILED!');
  console.log('Please review the calculations above.');
}
console.log('═══════════════════════════════════════════════════════════════════\n');
