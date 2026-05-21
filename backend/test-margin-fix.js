// Test file for Margin Money calculation fix
// Run with: node test-margin-fix.js
// Tests that Swabalamban margin is 5% of TOTAL project cost, not just working capital

import { FinancialCalculations } from './services/financialCalculations.js';

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('🧪 TEST: Swabalamban Margin Fix (5% of Total Project Cost)');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Sharma General Store project data
const fixedCapital = 60000;              // ₹60,000
const workingCapital = 300000;           // ₹3,00,000
const totalProjectCost = fixedCapital + workingCapital;  // ₹3,60,000

console.log('📊 Project Data (Sharma General Store):');
console.log(`  Fixed Capital:        ₹${fixedCapital.toLocaleString()}`);
console.log(`  Working Capital:      ₹${workingCapital.toLocaleString()}`);
console.log(`  Total Project Cost:   ₹${totalProjectCost.toLocaleString()}\n`);

// Calculate means of finance using Swabalamban scheme
const meansOfFinance = FinancialCalculations.calculateMeansOfFinance(
  fixedCapital,
  workingCapital,
  5,
  null,
  'SWABALAMBAN'
);

console.log('💰 Calculated Means of Finance:');
console.log(`  Margin Money:         ₹${meansOfFinance.marginMoney.toLocaleString()}`);
console.log(`  Bank Loan:            ₹${meansOfFinance.bankLoan.toLocaleString()}`);
console.log(`  Term Loan (Actual):   ₹${meansOfFinance.termLoan.toLocaleString()}`);
console.log(`  WC Loan (Actual):     ₹${meansOfFinance.wcLoan.toLocaleString()}`);
console.log(`  Term Loan Component:  ₹${meansOfFinance.termLoanComponent.toLocaleString()}`);
console.log(`  WC Loan Component:    ₹${meansOfFinance.wcLoanComponent.toLocaleString()}\n`);

console.log('🎯 Expected Values:');
console.log(`  Margin Money:         ₹18,000 (5% of ₹${totalProjectCost.toLocaleString()})`);
console.log(`  Bank Loan:            ₹3,42,000 (95% of ₹${totalProjectCost.toLocaleString()})`);
console.log(`  Term Loan Component:  ₹57,000 (95% of ₹${fixedCapital.toLocaleString()})`);
console.log(`  WC Loan Component:    ₹2,85,000 (95% of ₹${workingCapital.toLocaleString()})\n`);

console.log('✅ VERIFICATION:');

const expectedMargin = 18000;
const expectedBankLoan = 342000;
const expectedTermComponent = 57000;
const expectedWCComponent = 285000;

const marginMatch = meansOfFinance.marginMoney === expectedMargin;
const bankLoanMatch = meansOfFinance.bankLoan === expectedBankLoan;
const termComponentMatch = meansOfFinance.termLoanComponent === expectedTermComponent;
const wcComponentMatch = meansOfFinance.wcLoanComponent === expectedWCComponent;
const totalMatch = (meansOfFinance.marginMoney + meansOfFinance.bankLoan) === totalProjectCost;

console.log(`  Margin Money = ₹18,000?              ${marginMatch ? '✓' : '✗'} ${marginMatch ? `(Got ₹${meansOfFinance.marginMoney.toLocaleString()})` : `(Got ₹${meansOfFinance.marginMoney.toLocaleString()}, expected ₹18,000)`}`);
console.log(`  Bank Loan = ₹3,42,000?               ${bankLoanMatch ? '✓' : '✗'} ${bankLoanMatch ? `(Got ₹${meansOfFinance.bankLoan.toLocaleString()})` : `(Got ₹${meansOfFinance.bankLoan.toLocaleString()}, expected ₹3,42,000)`}`);
console.log(`  Term Loan Component = ₹57,000?      ${termComponentMatch ? '✓' : '✗'} ${termComponentMatch ? `(Got ₹${meansOfFinance.termLoanComponent.toLocaleString()})` : `(Got ₹${meansOfFinance.termLoanComponent.toLocaleString()}, expected ₹57,000)`}`);
console.log(`  WC Loan Component = ₹2,85,000?      ${wcComponentMatch ? '✓' : '✗'} ${wcComponentMatch ? `(Got ₹${meansOfFinance.wcLoanComponent.toLocaleString()})` : `(Got ₹${meansOfFinance.wcLoanComponent.toLocaleString()}, expected ₹2,85,000)`}`);
console.log(`  Margin + Bank = Total Cost?         ${totalMatch ? '✓' : '✗'} (₹${meansOfFinance.marginMoney.toLocaleString()} + ₹${meansOfFinance.bankLoan.toLocaleString()} = ₹${(meansOfFinance.marginMoney + meansOfFinance.bankLoan).toLocaleString()})`);

console.log('\n' + '═══════════════════════════════════════════════════════════════════');
if (marginMatch && bankLoanMatch && termComponentMatch && wcComponentMatch && totalMatch) {
  console.log('🎉 ALL TESTS PASSED! ✅ Margin fix is working correctly.');
} else {
  console.log('❌ TESTS FAILED! Some values do not match.');
}
console.log('═══════════════════════════════════════════════════════════════════\n');
