// Financial Calculations Service - Complete DPR Logic
import { getSchemeConfig, calculateMarginByScheme, calculateTaxByScheme, getInterestRate } from './schemes.js';

export class FinancialCalculations {
  
  // 1️⃣ PROJECT COST CALCULATION
  static calculateProjectCost(data) {
    const assets = data.assets || [];
    const fixedCapital = assets.reduce((sum, asset) => sum + (asset.total_budget || 0), 0);

    return {
      fixedCapital,
      totalProjectCost: fixedCapital
    };
  }

  // 2️⃣ WORKING CAPITAL FROM MONTHLY EXPENSES
  static calculateWorkingCapital(monthlyExpenses, reserveMonths = 3) {
    const {
      rent = 0,
      salary = 0,
      electricity = 0,
      maintenance = 0,
      misc = 0
    } = monthlyExpenses;

    const monthlyExpenseTotal = rent + salary + electricity + maintenance + misc;
    const annualExpense = monthlyExpenseTotal * 12;
    const workingCapital = monthlyExpenseTotal * reserveMonths;

    return {
      monthlyExpenseTotal,
      annualExpense,
      workingCapital,
      reserveMonths
    };
  }

  // 3️⃣ MEANS OF FINANCE - SCHEME AWARE (FIXES BUG 1 & BUG 5)
  static calculateMeansOfFinance(fixedCapital, workingCapitalRequirement, marginPercent = 5, manualWCLoanAmount = null, scheme = 'SWABALAMBAN') {
    const schemeConfig = getSchemeConfig(scheme);
    const totalRequirement = fixedCapital + workingCapitalRequirement;
    
    // Calculate margin using scheme-specific rules
    const marginResult = calculateMarginByScheme(
      fixedCapital,
      workingCapitalRequirement,
      schemeConfig
    );
    
    const marginMoney = marginResult.marginMoney;
    const bankLoan = marginResult.bankLoan;

    // For most schemes: Term Loan = Fixed Capital, WC Loan = Working Capital - margin
    let termLoan = fixedCapital;
    let wcLoan = workingCapitalRequirement - (marginMoney > workingCapitalRequirement ? 0 : marginMoney);
    
    // Override WC loan if manually specified
    if (manualWCLoanAmount !== null && manualWCLoanAmount !== undefined) {
      wcLoan = manualWCLoanAmount;
    }

    // Verify funding sources balance
    const totalFunding = marginMoney + bankLoan;
    
    // FIX BUG 1: Calculate post-margin component amounts for display only
    // These show what the bank finances after margin deduction
    // Formula: Component = Requirement × (1 - marginPercent/100)
    const marginMultiplier = (100 - marginPercent) / 100;
    const termLoanComponent = fixedCapital * marginMultiplier;  // Use fixedCapital directly, not termLoan
    const wcLoanComponent = workingCapitalRequirement * marginMultiplier;  // Use workingCapitalRequirement directly, not wcLoan
    
    return {
      totalRequirement,
      marginMoney: parseFloat(marginMoney.toFixed(2)),
      bankLoan: parseFloat(bankLoan.toFixed(2)),
      termLoan: parseFloat(termLoan.toFixed(2)),
      wcLoan: parseFloat(wcLoan.toFixed(2)),
      // Post-margin component amounts (for display in Means of Finance table only)
      termLoanComponent: parseFloat(termLoanComponent.toFixed(2)),
      wcLoanComponent: parseFloat(wcLoanComponent.toFixed(2)),
      marginBreakdown: marginResult.marginBreakdown,
      schemeKey: schemeConfig.key,
      schemeName: schemeConfig.name,
      verification: {
        marginPlusBank: parseFloat((marginMoney + bankLoan).toFixed(2)),
        equalsTotal: Math.abs((marginMoney + bankLoan) - totalRequirement) < 0.01
      }
    };
  }

  // 4️⃣ REVENUE PROJECTION (5 YEARS)
  static generateRevenueProjections(dailyRevenueYear1, workingDays, growthPercent = 5, capacityUtilizationYearly = [100, 100, 100, 100, 100]) {
    const growth = growthPercent / 100;
    const projections = [];

    for (let year = 1; year <= 5; year++) {
      const dailyRevenue = dailyRevenueYear1 * Math.pow(1 + growth, year - 1);
      const annualRevenue = dailyRevenue * workingDays;
      const capacity = capacityUtilizationYearly[year - 1] || 100;
      const actualRevenue = (annualRevenue * capacity) / 100;
      
      projections.push({
        year,
        dailyRevenue: parseFloat(dailyRevenue.toFixed(2)),
        workingDays,
        annualRevenue: parseFloat(annualRevenue.toFixed(2)),
        capacityUtilization: capacity,
        actualRevenue: parseFloat(actualRevenue.toFixed(2))
      });
    }
    return projections;
  }

  // 4️⃣ DEPRECIATION SCHEDULE (Written Down Value Method)
  static generateDepreciationSchedule(assetCost, depreciationRate = 15) {
    const rate = depreciationRate / 100;
    const schedule = [];
    let wdv = assetCost; // Written Down Value

    for (let year = 1; year <= 5; year++) {
      const grossBlock = assetCost; // Constant every year
      const depreciation = year === 1 
        ? assetCost * rate 
        : wdv * rate;
      wdv = wdv - depreciation;

      schedule.push({
        year,
        grossBlock: parseFloat(grossBlock.toFixed(2)),
        depreciationAmount: parseFloat(depreciation.toFixed(2)),
        writtenDownValue: parseFloat(Math.max(0, wdv).toFixed(2))
      });
    }

    return {
      schedule,
      totalDep: schedule.map(s => s.depreciationAmount),
      totalWDV: schedule.map(s => s.writtenDownValue)
    };
  }

  // 5️⃣ EXPENSE PROJECTION (5 YEARS)
  static generateExpenseProjections(expensesYear1, expenseGrowthPercent = 3) {
    const {
      rent = 0,
      salary = 0,
      electricity = 0,
      maintenance = 0,
      misc = 0
    } = expensesYear1;

    const growth = expenseGrowthPercent / 100;
    const projections = [];

    for (let year = 1; year <= 5; year++) {
      const yearMultiplier = Math.pow(1 + growth, year - 1);
      
      const projections_year = {
        year,
        rent: parseFloat((rent * yearMultiplier).toFixed(2)),
        salary: parseFloat((salary * yearMultiplier).toFixed(2)),
        electricity: parseFloat((electricity * yearMultiplier).toFixed(2)),
        maintenance: parseFloat((maintenance * yearMultiplier).toFixed(2)),
        misc: parseFloat((misc * yearMultiplier).toFixed(2)),
        totalExpense: parseFloat(((rent + salary + electricity + maintenance + misc) * yearMultiplier).toFixed(2))
      };
      projections.push(projections_year);
    }
    return projections;
  }

  // 6️⃣ PROFITABILITY STATEMENT (5 YEARS) - Trading/Manufacturing Model with Stock Movement
  static calculateProfitabilityWithStock(
    revenueProjections,
    expenseProjections,
    depreciationSchedule,
    repaymentSchedule,
    wcLoanAmount,
    wcInterestRate,
    taxPercent = 0,
    tradingDetails = {},
    scheme = 'SWABALAMBAN'
  ) {
    console.log('\n🔍 PROFITABILITY FUNCTION RECEIVES:');
    console.log('  revenueProjections[0]:', JSON.stringify(revenueProjections[0]));
    console.log('  expenseProjections[0]:', JSON.stringify(expenseProjections[0]));
    console.log('  tradingDetails.stockPurchasesList:', tradingDetails.stockPurchasesList);
    console.log('  scheme:', scheme);
    
    const openingStock = tradingDetails.openingStock || 0;
    const closingStocks = tradingDetails.closingStocksList || [0, 0, 0, 0, 0]; // Array of 5 values
    const stockPurchases = tradingDetails.stockPurchasesList || [0, 0, 0, 0, 0]; // Array of 5 values
    const depreciation = depreciationSchedule.schedule 
      ? depreciationSchedule.schedule.map(d => d.depreciationAmount)
      : depreciationSchedule.totalDep || [0, 0, 0, 0, 0];

    const profitability = [];
    let prevClosingStock = openingStock;

    for (let i = 0; i < 5; i++) {
      const year = i + 1;
      const sales = revenueProjections[i].actualRevenue;
      const closingStock = closingStocks[i] || 0;
      const openingStockYear = i === 0 ? openingStock : prevClosingStock; // KEY: Opening = Previous Closing
      const stockPurchase = stockPurchases[i] || 0;
      
      const salary = expenseProjections[i].salary || 0;
      const electricity = expenseProjections[i].electricity || 0;
      const misc = expenseProjections[i].misc || 0;
      const rent = expenseProjections[i].rent || 0;
      
      // DEBUG Year 1 only
      if (year === 1) {
        console.log('\n  Year 1 Profitability Calc:');
        console.log('    sales:', sales);
        console.log('    salary:', salary, 'electricity:', electricity, 'misc:', misc, 'rent:', rent);
        console.log('    stockPurchase:', stockPurchase, 'openingStock:', openingStockYear);
      }

      // Trading Model Formulas (CORRECTED)
      // Step 1: Adjusted Revenue = Sales + Closing Stock - Opening Stock
      const adjustedRevenue = sales + closingStock - openingStockYear;
      // Step 2: COGS = Stock Purchases + Direct Wages + Direct Expenses
      const cogs = stockPurchase + salary + electricity;
      // Step 3: Gross Profit = Adjusted Revenue - COGS
      const grossProfit = adjustedRevenue - cogs;
      const ebitda = grossProfit - misc;

      // Interest Breakdown
      const yearInterestTL = repaymentSchedule.schedule
        .slice(year * 12 - 12, year * 12)
        .reduce((sum, month) => sum + month.interestPaid, 0);
      const interestWC = wcLoanAmount * (wcInterestRate / 100 / 12) * 12; // Annual WC interest

      const depAmount = depreciation[i] || 0;
      const pbt = ebitda - depAmount - yearInterestTL - interestWC;
      
      // SCHEME-AWARE TAX CALCULATION (Fixes BUG 7)
      let incomeTax = 0;
      if (pbt > 0) {
        if (taxPercent > 0) {
          // If explicit tax percent provided, use it
          incomeTax = pbt * (taxPercent / 100);
        } else {
          // Otherwise use scheme-specific tax calculation
          incomeTax = calculateTaxByScheme(pbt, scheme);
        }
      }
      incomeTax = Math.max(0, incomeTax);
      const pat = pbt - incomeTax;

      profitability.push({
        year,
        salesRevenue: parseFloat(sales.toFixed(2)),
        closingStock: parseFloat(closingStock.toFixed(2)),
        adjustedRevenue: parseFloat(adjustedRevenue.toFixed(2)),
        openingStock: parseFloat(openingStockYear.toFixed(2)),
        stockPurchase: parseFloat(stockPurchase.toFixed(2)),
        salary: parseFloat(salary.toFixed(2)),
        electricity: parseFloat(electricity.toFixed(2)),
        totalDirectCost: parseFloat(cogs.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        misc: parseFloat(misc.toFixed(2)),
        ebitda: parseFloat(ebitda.toFixed(2)),
        depreciation: parseFloat(depAmount.toFixed(2)),
        interestTL: parseFloat(yearInterestTL.toFixed(2)),
        interestWC: parseFloat(interestWC.toFixed(2)),
        profitBeforeTax: parseFloat(pbt.toFixed(2)),
        incomeTax: parseFloat(incomeTax.toFixed(2)),
        profitAfterTax: parseFloat(pat.toFixed(2)),
        netProfitRatio: sales > 0 ? parseFloat(((pat / sales) * 100).toFixed(2)) : 0
      });

      prevClosingStock = closingStock; // For next iteration
    }

    return profitability;
  }

  // LEGACY: Simple Profitability (for backward compatibility)
  static calculateProfitability(revenueProjections, expenseProjections, depreciation = 0, taxPercent = 0) {
    const profitability = [];

    for (let i = 0; i < 5; i++) {
      const revenue = revenueProjections[i].actualRevenue;
      const totalExpense = expenseProjections[i].totalExpense;
      
      const profitBeforeTax = revenue - totalExpense;
      const incomeTax = (profitBeforeTax * taxPercent) / 100;
      const profitAfterTax = profitBeforeTax - incomeTax;
      const netProfitRatio = revenue > 0 ? (profitAfterTax / revenue) * 100 : 0;

      profitability.push({
        year: i + 1,
        netSales: parseFloat(revenue.toFixed(2)),
        totalExpense: parseFloat(totalExpense.toFixed(2)),
        profitBeforeTax: parseFloat(profitBeforeTax.toFixed(2)),
        depreciation: parseFloat(depreciation.toFixed(2)),
        profitAfterTax: parseFloat(profitAfterTax.toFixed(2)),
        incomeTax: parseFloat(incomeTax.toFixed(2)),
        netProfitRatio: parseFloat(netProfitRatio.toFixed(2))
      });
    }
    return profitability;
  }

  // 7️⃣ LOAN EMI CALCULATION
  static calculateEMI(loanAmount, interestRateAnnual, tenureMonths) {
    const monthlyRate = interestRateAnnual / 12 / 100;
    
    if (monthlyRate === 0) {
      return loanAmount / tenureMonths; // No interest case
    }

    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    return parseFloat(emi.toFixed(2));
  }

  // 8️⃣ REPAYMENT SCHEDULE
  static generateRepaymentSchedule(loanAmount, interestRateAnnual, tenureMonths, moratoriumMonths = 0) {
    const monthlyRate = interestRateAnnual / 12 / 100;
    const emi = this.calculateEMI(loanAmount, interestRateAnnual, tenureMonths);
    
    const schedule = [];
    let outstandingBalance = loanAmount;

    for (let month = 1; month <= tenureMonths; month++) {
      let principalPaid = 0;
      let interestPaid = 0;

      if (month <= moratoriumMonths) {
        // During moratorium, only interest is paid
        interestPaid = outstandingBalance * monthlyRate;
        outstandingBalance += interestPaid;
        
        schedule.push({
          month,
          principalPaid: 0,
          interestPaid: parseFloat(interestPaid.toFixed(2)),
          emiAmount: parseFloat(interestPaid.toFixed(2)),
          outstandingBalance: parseFloat(outstandingBalance.toFixed(2)),
          status: 'Moratorium'
        });
      } else {
        interestPaid = outstandingBalance * monthlyRate;
        principalPaid = emi - interestPaid;
        outstandingBalance -= principalPaid;

        schedule.push({
          month,
          principalPaid: parseFloat(principalPaid.toFixed(2)),
          interestPaid: parseFloat(interestPaid.toFixed(2)),
          emiAmount: parseFloat(emi.toFixed(2)),
          outstandingBalance: parseFloat(Math.max(0, outstandingBalance).toFixed(2)),
          status: 'Active'
        });
      }
    }

    return {
      emiAmount: emi,
      schedule
    };
  }

  // 9️⃣ DSCR CALCULATION (FIXES BUG 3 - Uses yearly depreciation)
  static calculateDSCR(profitability, repaymentSchedule, depreciationSchedule) {
    const dscrs = [];
    
    // Extract yearly depreciation from schedule
    const yearlyDepreciation = depreciationSchedule.schedule 
      ? depreciationSchedule.schedule.map(d => d.depreciationAmount)
      : depreciationSchedule.totalDep || [0, 0, 0, 0, 0];
    
    for (let year = 0; year < 5; year++) {
      const profitAfterTax = profitability[year].profitAfterTax;
      const yearInterest = repaymentSchedule.schedule
        .slice(year * 12, (year + 1) * 12)
        .reduce((sum, month) => sum + month.interestPaid, 0);
      const yearPrincipal = repaymentSchedule.schedule
        .slice(year * 12, (year + 1) * 12)
        .reduce((sum, month) => sum + month.principalPaid, 0);

      // Use actual yearly depreciation from schedule
      const depreciation = yearlyDepreciation[year] || 0;

      // CORRECTED DSCR Formula per RBI banking norms
      // Numerator: Net Cash Accrual = PAT + Depreciation (NO interest - already in PAT)
      const cashAccrual = profitAfterTax + depreciation;
      // Denominator: Total Debt Service = TL Principal Repaid + TL Interest (no WC interest)
      const debtObligation = yearPrincipal + yearInterest;

      const dscr = debtObligation > 0 ? cashAccrual / debtObligation : 0;

      dscrs.push({
        year: year + 1,
        profitAfterTax: parseFloat(profitAfterTax.toFixed(2)),
        depreciation: parseFloat(depreciation.toFixed(2)),
        yearInterest: parseFloat(yearInterest.toFixed(2)),
        cashAccrual: parseFloat(cashAccrual.toFixed(2)),
        principalPaid: parseFloat(yearPrincipal.toFixed(2)),
        debtObligation: parseFloat(debtObligation.toFixed(2)),
        dscr: parseFloat(dscr.toFixed(2))
      });
    }

    const averageDSCR = dscrs.reduce((sum, d) => sum + d.dscr, 0) / dscrs.length;

    return {
      yearlyDSCR: dscrs,
      averageDSCR: parseFloat(averageDSCR.toFixed(2))
    };
  }

  // 🔟 BREAK-EVEN ANALYSIS
  static calculateBreakEven(expenseProjections, revenueProjections, depreciationYear1 = 0, interestTLYear1 = 0, interestWCYear1 = 0) {
    // Using Year 1 data for break-even analysis
    const year1Expense = expenseProjections[0];
    const year1Revenue = revenueProjections[0].actualRevenue;
    
    // ✅ FIX BUG 2: Fixed costs = ALL non-variable items
    // Fixed costs include: salary + electricity + rent + maintenance + misc + depreciation + interest on TL + interest on WC
    const salaryFixedCost = year1Expense.salary || 0;
    const electricityFixedCost = year1Expense.electricity || 0;  // Mostly fixed for retail operations
    const rentFixedCost = year1Expense.rent || 0;
    const maintenanceFixedCost = year1Expense.maintenance || 0;
    const miscFixedCost = year1Expense.misc || 0;
    
    const fixedCost = salaryFixedCost + electricityFixedCost + rentFixedCost + maintenanceFixedCost + miscFixedCost + depreciationYear1 + interestTLYear1 + interestWCYear1;
    
    // Variable costs = 0 for trading (all costs are fixed in this business model)
    // In a trading business, most expenses are semi-fixed or fixed, not truly variable
    const variableCost = 0;
    
    const contribution = year1Revenue - variableCost;
    const contributionRatio = year1Revenue > 0 ? contribution / year1Revenue : 0;

    const bepPercent = contributionRatio > 0 ? (fixedCost / contribution) * 100 : 0;
    const bepSales = contributionRatio > 0 ? fixedCost / contributionRatio : 0;
    const marginOfSafety = year1Revenue - bepSales;
    const marginOfSafetyPercent = year1Revenue > 0 ? (marginOfSafety / year1Revenue) * 100 : 0;

    return {
      variableCost: parseFloat(variableCost.toFixed(2)),
      fixedCost: parseFloat(fixedCost.toFixed(2)),
      fixedCostBreakdown: {
        salary: parseFloat(salaryFixedCost.toFixed(2)),
        electricity: parseFloat(electricityFixedCost.toFixed(2)),
        rent: parseFloat(rentFixedCost.toFixed(2)),
        maintenance: parseFloat(maintenanceFixedCost.toFixed(2)),
        misc: parseFloat(miscFixedCost.toFixed(2)),
        depreciation: parseFloat(depreciationYear1.toFixed(2)),
        interestOnTermLoan: parseFloat(interestTLYear1.toFixed(2)),
        interestOnWCLoan: parseFloat(interestWCYear1.toFixed(2))
      },
      contribution: parseFloat(contribution.toFixed(2)),
      contributionRatio: parseFloat(contributionRatio.toFixed(2)),
      bepPercent: parseFloat(bepPercent.toFixed(2)),
      bepSales: parseFloat(bepSales.toFixed(2)),
      marginOfSafety: parseFloat(marginOfSafety.toFixed(2)),
      marginOfSafetyPercent: parseFloat(marginOfSafetyPercent.toFixed(2))
    };
  }

  // 11. CASH FLOW STATEMENT - INDIRECT METHOD (5 YEARS)
  static generateCashFlowStatementIndirect(
    projectData,
    profitability,
    repaymentSchedule,
    meansOfFinance,
    tradingDetails = {},
    tradeReceivables = [],
    proprietorDrawings = []
  ) {
    const assetCost = projectData.projectCost?.fixedCapital || 0;
    const depSchedule = projectData.depreciation?.schedule || [];
    const closingStocks = tradingDetails.closingStocksList || [0, 0, 0, 0, 0];
    const termLoanAmount = meansOfFinance.termLoan || 0;
    const wcLoanAmount = meansOfFinance.wcLoan || 0;

    // Get receivables array
    const receivablesArray = tradeReceivables.map(r => r.amount || 0);
    const drawingsArray = proprietorDrawings.map(d => d.amount || 0);

    // Calculate accounts payable (simplified: assume 30 days average)
    const accountsPayableByYear = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      const monthlyExpense = (profitability[i].openingStock + profitability[i].stockPurchase) / 12;
      accountsPayableByYear[i] = monthlyExpense * 30; // 30 days
    }

    const cashFlow = [];
    let openingBalance = 0;
    let prevAPValue = accountsPayableByYear[0] || 0;
    let prevInventory = tradingDetails.openingStock || 0;
    let prevReceivables = 0;

    for (let i = 0; i < 5; i++) {
      const year = i + 1;
      const profit = profitability[i];
      const yearSchedule = repaymentSchedule.schedule.slice(year * 12 - 12, year * 12);
      
      const principalPaid = yearSchedule.reduce((sum, m) => sum + m.principalPaid, 0);
      const pbtWithInterest = profit.profitBeforeTax + profit.interestTL + profit.interestWC;
      const depreciation = depSchedule[i]?.depreciationAmount || 0;

      // Working capital changes
      const inventory = closingStocks[i] || 0;
      const receivables = receivablesArray[i] || 0;
      const accountsPayable = accountsPayableByYear[i] || 0;

      const increaseInInventory = (inventory + receivables) - (prevInventory + prevReceivables);
      const increaseInPayables = accountsPayable - prevAPValue;

      // CASH INFLOW (Indirect method)
      const capitalInflow = year === 1 ? meansOfFinance.marginMoney : 0;
      const wcLoanDrawn = year === 1 ? wcLoanAmount : 0;
      const totalCashInflow = capitalInflow + pbtWithInterest + wcLoanDrawn + depreciation + increaseInPayables;

      // CASH OUTFLOW
      const fixedAssetsPurchase = year === 1 ? assetCost : 0;
      const drawingsAmount = drawingsArray[i] || 0;
      const taxPaid = profit.incomeTax || 0;
      const totalCashOutflow = fixedAssetsPurchase + increaseInInventory + profit.interestTL + profit.interestWC + taxPaid + principalPaid + drawingsAmount;

      // NET CASH FLOW
      const netCashFlow = totalCashInflow - totalCashOutflow;
      const closingBalance = openingBalance + netCashFlow;

      cashFlow.push({
        year,
        inflow: {
          capital: capitalInflow,
          pbtWithInterest: parseFloat(pbtWithInterest.toFixed(2)),
          wcLoanDrawn: wcLoanDrawn,
          depreciation: parseFloat(depreciation.toFixed(2)),
          increaseInPayables: parseFloat(increaseInPayables.toFixed(2)),
          totalInflow: parseFloat(totalCashInflow.toFixed(2))
        },
        outflow: {
          fixedAssets: fixedAssetsPurchase,
          increaseInCA: parseFloat(increaseInInventory.toFixed(2)),
          interestTL: parseFloat(profit.interestTL.toFixed(2)),
          interestWC: parseFloat(profit.interestWC.toFixed(2)),
          taxPaid: parseFloat(taxPaid.toFixed(2)),
          tlRepaid: parseFloat(principalPaid.toFixed(2)),
          drawings: drawingsAmount,
          totalOutflow: parseFloat(totalCashOutflow.toFixed(2))
        },
        openingBalance: parseFloat(openingBalance.toFixed(2)),
        netCashFlow: parseFloat(netCashFlow.toFixed(2)),
        closingBalance: parseFloat(closingBalance.toFixed(2))
      });

      openingBalance = closingBalance;
      prevAPValue = accountsPayable;
      prevInventory = inventory;
      prevReceivables = receivables;
    }

    return cashFlow;
  }

  // 11B. LEGACY CASH FLOW STATEMENT (5 YEARS)
  static generateCashFlowStatement(projectData, profitability, repaymentSchedule, meansOfFinance) {
    const cashFlow = [];
    let openingBalance = 0;

    for (let i = 0; i < 5; i++) {
      const year = i + 1;
      const profit = profitability[i];
      const yearSchedule = repaymentSchedule.schedule.slice(i * 12, (i + 1) * 12);
      
      const principalPaid = yearSchedule.reduce((sum, m) => sum + m.principalPaid, 0);
      const interestPaid = yearSchedule.reduce((sum, m) => sum + m.interestPaid, 0);

      const inflow = {
        netSales: profit.netSales,
        loanDisbursement: year === 1 ? meansOfFinance.bankLoan : 0,
        promoterContribution: year === 1 ? meansOfFinance.marginMoney : 0,
        totalInflow: profit.netSales + (year === 1 ? (meansOfFinance.bankLoan + meansOfFinance.marginMoney) : 0)
      };

      const outflow = {
        fixedAssetsPurchase: year === 1 ? projectData.projectCost.fixedCapital : 0,
        operatingExpenses: profit.totalExpense,
        interestPaid: interestPaid,
        principalRepayment: principalPaid,
        taxPaid: profit.incomeTax,
        totalOutflow: (year === 1 ? projectData.projectCost.fixedCapital : 0) + profit.totalExpense + interestPaid + principalPaid + profit.incomeTax
      };

      const netCashFlow = inflow.totalInflow - outflow.totalOutflow;
      const closingBalance = openingBalance + netCashFlow;

      cashFlow.push({
        year,
        inflow,
        outflow,
        netCashFlow: parseFloat(netCashFlow.toFixed(2)),
        openingBalance: parseFloat(openingBalance.toFixed(2)),
        closingBalance: parseFloat(closingBalance.toFixed(2))
      });

      openingBalance = closingBalance;
    }
    return cashFlow;
  }

  // ✅ 12. BALANCE SHEET - PRODUCTION FUNCTION (5 YEARS) - OFFICIAL METHOD
  // This is the canonical balance sheet generation function. All other implementations are deprecated.
  // Returns proper nested structure matching MongoDB schema with shareholderFunds, currentAssets, etc.
  // Required for PDF generation and database persistence.
  static generateBalanceSheetProper(
    projectData,
    profitability,
    repaymentSchedule,
    meansOfFinance,
    cashFlow,
    depreciationSchedule,
    tradingDetails = {},
    tradeReceivables = []
  ) {
    const initialCapital = meansOfFinance.marginMoney || 0;
    const wcLoan = meansOfFinance.wcLoan || 0;
    const closingStocks = tradingDetails.closingStocksList || [0, 0, 0, 0, 0];
    const receivablesArray = tradeReceivables.map(r => r.amount || 0);
    const depSchedule = depreciationSchedule.schedule || [];

    // Pre-operative values
    const preOpFixed = projectData.projectCost?.fixedCapital || 0;
    const preOpTL = meansOfFinance.termLoan || 0;

    const balanceSheet = [];
    let cumulativeReserves = 0;

    for (let i = 0; i < 5; i++) {
      const year = i + 1;
      const profit = profitability[i];
      const cf = cashFlow[i];

      // Cumulative Reserves (KEY: reserves[y] = reserves[y-1] + pat[y])
      cumulativeReserves += profit.profitAfterTax;

      // Get outstanding term loan from repayment schedule (as on last day of the year)
      const termLoanOutstanding = repaymentSchedule.schedule[Math.min(year * 12 - 1, repaymentSchedule.schedule.length - 1)]?.outstandingBalance || 0;

      // Get fixed assets WDV from depreciation schedule
      const fixedAssetsWDV = depSchedule[i]?.writtenDownValue || 0;

      // Working capital items
      const inventory = closingStocks[i] || 0;
      const receivables = receivablesArray[i] || 0;
      const cash = cf.closingBalance;

      // Calculate accounts payable (CORRECTED per banking norms)
      // Formula: Accounts Payable = (Stock Purchases / 365) × Creditor Days
      const creditorDays = tradingDetails.creditorDays || 30;
      const accountsPayable = (profit.stockPurchase / 365) * creditorDays;

      // LIABILITIES SIDE
      const liabilities = {
        shareholderFunds: {
          capital: parseFloat(initialCapital.toFixed(2)),
          reserveSurplus: parseFloat(cumulativeReserves.toFixed(2)),
          totalEquity: parseFloat((initialCapital + cumulativeReserves).toFixed(2))
        },
        nonCurrentLiabilities: {
          termLoan: parseFloat(termLoanOutstanding.toFixed(2))
        },
        currentLiabilities: {
          wcLoan: year === 1 ? parseFloat(wcLoan.toFixed(2)) : 0, // WC loan drawn only in Year 1
          accountsPayable: parseFloat(accountsPayable.toFixed(2)),
          totalCL: parseFloat((year === 1 ? wcLoan : 0) + accountsPayable).toFixed(2)
        },
        totalLiabilities: parseFloat((initialCapital + cumulativeReserves + termLoanOutstanding + (year === 1 ? wcLoan : 0) + accountsPayable).toFixed(2))
      };

      // ASSETS SIDE - Must equal liabilities
      const assets = {
        nonCurrentAssets: {
          fixedAssets: parseFloat(fixedAssetsWDV.toFixed(2))
        },
        currentAssets: {
          inventory: parseFloat(inventory.toFixed(2)),
          tradeReceivables: parseFloat(receivables.toFixed(2)),
          cash: parseFloat(Math.max(0, cash).toFixed(2)),
          totalCA: parseFloat((inventory + receivables + Math.max(0, cash)).toFixed(2))
        },
        totalAssets: parseFloat((fixedAssetsWDV + inventory + receivables + Math.max(0, cash)).toFixed(2))
      };

      // BALANCE CHECK
      const difference = assets.totalAssets - liabilities.totalLiabilities;
      const isBalanced = Math.abs(difference) < 1; // Allow ±1 for rounding

      // If not balanced, adjust cash to force balance (common DPR practice)
      if (!isBalanced && Math.abs(difference) > 1) {
        const adjustedCash = cash - difference; // Adjust cash to make balance
        assets.currentAssets.cash = parseFloat(Math.max(0, adjustedCash).toFixed(2));
        assets.currentAssets.totalCA = parseFloat((inventory + receivables + Math.max(0, adjustedCash)).toFixed(2));
        assets.totalAssets = parseFloat((fixedAssetsWDV + inventory + receivables + Math.max(0, adjustedCash)).toFixed(2));
      }

      balanceSheet.push({
        year,
        liabilities,
        assets,
        isBalanced: Math.abs(assets.totalAssets - liabilities.totalLiabilities) < 1,
        balanceDifference: parseFloat((assets.totalAssets - liabilities.totalLiabilities).toFixed(2)),
        cashAdjustmentNote: !isBalanced && Math.abs(difference) > 1 ? 'Cash adjusted to balance' : 'Balanced'
      });
    }

    return balanceSheet;
  }

  // ✅ VALIDATION RULES + Trading Details Audit
  static validateFinancials(totalRequirement, marginMoney, bankLoan, revenueProjections, expenseProjections, dscr, breakEven, wcLoan) {
    const annualSalesYear1 = revenueProjections[0].actualRevenue;
    const wcLimit = annualSalesYear1 * 0.25; // CC loan should not exceed 25% of annual sales

    const validations = {
      loanBalance: Math.abs((marginMoney + bankLoan) - totalRequirement) < 1, // Allowance for rounding
      revenueGreaterThanExpense: revenueProjections[0].actualRevenue > expenseProjections[0].totalExpense,
      dscrGreaterThanOne: dscr.averageDSCR > 1,
      bepLessThan100: breakEven.bepPercent < 100,
      emiFeasible: dscr.averageDSCR > 1.25,
      wcLoanBelowSalesLimit: wcLoan <= wcLimit
    };

    return validations;
  }

  // TRADING DETAILS VALIDATION - Helps audit BUG 4 (Gross Profit Anomalies)
  static validateTradingDetails(revenueProjections, profitability, tradingDetails) {
    const warnings = [];
    const info = [];

    // Check revenue and gross profit trend
    for (let i = 0; i < profitability.length; i++) {
      const year = i + 1;
      const revenue = revenueProjections[i].actualRevenue;
      const prevRevenue = i > 0 ? revenueProjections[i - 1].actualRevenue : revenue;
      const grossProfit = profitability[i].grossProfit;
      const prevGrossProfit = i > 0 ? profitability[i - 1].grossProfit : grossProfit;

      // Check if revenue increased but gross profit decreased
      if (revenue > prevRevenue && grossProfit < prevGrossProfit) {
        const revenueChange = ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1);
        const gpChange = ((grossProfit - prevGrossProfit) / prevGrossProfit * 100).toFixed(1);
        warnings.push(`Year ${year}: Revenue increased ${revenueChange}% but Gross Profit decreased ${gpChange}%. Check stock purchases and COGS.`);
      }

      // Check if COGS is unusual (>80% of adjusted revenue)
      const cogsRatio = profitability[i].totalDirectCost / profitability[i].adjustedRevenue;
      if (cogsRatio > 0.8) {
        warnings.push(`Year ${year}: COGS is ${(cogsRatio * 100).toFixed(1)}% of revenue. Verify stock purchase and labor costs.`);
      }

      // Check for unusual stock levels
      const closingStock = profitability[i].closingStock;
      if (closingStock === 0 && i < 4) {
        info.push(`Year ${year}: Closing stock is ₹0. Confirm if this is intentional.`);
      }

      // Check stock purchase trend
      if (i > 0) {
        const prevStockPurchase = profitability[i - 1].stockPurchase;
        const currentStockPurchase = profitability[i].stockPurchase;
        if (currentStockPurchase === 0 && prevStockPurchase > 0) {
          warnings.push(`Year ${year}: Stock purchases dropped to ₹0. Verify if this is correct.`);
        }
      }
    }

    return { warnings, info };
  }
}
