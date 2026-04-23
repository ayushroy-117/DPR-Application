// Financial Calculations Service - Complete DPR Logic
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

  // 3️⃣ MEANS OF FINANCE
  static calculateMeansOfFinance(fixedCapital, workingCapitalRequirement, marginPercent, manualWCLoanAmount = null) {
    const totalRequirement = fixedCapital + workingCapitalRequirement;
    
    // Apply marginPercent to fixedCapital for term loan
    const termLoanMargin = (fixedCapital * marginPercent) / 100;
    const termLoan = fixedCapital - termLoanMargin;
    
    // Apply 5% margin money deduction specifically on working capital component as per requirement
    const wcMarginPercent = 5;
    const wcMarginMoney = (workingCapitalRequirement * wcMarginPercent) / 100;
    
    const wcLoan = manualWCLoanAmount !== null && manualWCLoanAmount !== undefined
      ? manualWCLoanAmount 
      : workingCapitalRequirement - wcMarginMoney;

    // Total margin money is the sum of fixed capital margin and working capital margin
    const marginMoney = termLoanMargin + wcMarginMoney;
    
    // Total bank loan is the sum of term loan and working capital loan
    const bankLoan = termLoan + wcLoan;

    return {
      totalRequirement,
      marginMoney,
      bankLoan,
      termLoan,
      wcLoan
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
    tradingDetails = {}
  ) {
    console.log('\n🔍 PROFITABILITY FUNCTION RECEIVES:');
    console.log('  revenueProjections[0]:', JSON.stringify(revenueProjections[0]));
    console.log('  expenseProjections[0]:', JSON.stringify(expenseProjections[0]));
    console.log('  tradingDetails.stockPurchasesList:', tradingDetails.stockPurchasesList);
    
    const openingStock = tradingDetails.openingStock || 0;
    const closingStocks = tradingDetails.closingStocksList || [0, 0, 0, 0, 0]; // Array of 5 values
    const stockPurchases = tradingDetails.stockPurchasesList || [0, 0, 0, 0, 0]; // Array of 5 values
    const depreciation = depreciationSchedule.totalDep || [0, 0, 0, 0, 0];

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
      const incomeTax = Math.max(0, pbt * (taxPercent / 100));
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

  // 9️⃣ DSCR CALCULATION
  static calculateDSCR(profitability, repaymentSchedule, depreciation = 0) {
    const dscrs = [];
    
    for (let year = 0; year < 5; year++) {
      const profitAfterTax = profitability[year].profitAfterTax;
      const yearInterest = repaymentSchedule.schedule
        .slice(year * 12, (year + 1) * 12)
        .reduce((sum, month) => sum + month.interestPaid, 0);
      const yearPrincipal = repaymentSchedule.schedule
        .slice(year * 12, (year + 1) * 12)
        .reduce((sum, month) => sum + month.principalPaid, 0);

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
  static calculateBreakEven(expenseProjections, revenueProjections) {
    // Using Year 1 data for break-even
    const variableCost = (expenseProjections[0].electricity + expenseProjections[0].misc) * 0.5; // 50% variable
    const fixedCost = expenseProjections[0].rent + expenseProjections[0].salary + expenseProjections[0].maintenance;
    const revenue = revenueProjections[0].actualRevenue;
    const contribution = revenue - variableCost;
    const contributionRatio = revenue > 0 ? contribution / revenue : 0;

    const bepPercent = contributionRatio > 0 ? (fixedCost / contribution) * 100 : 0;
    const bepSales = contributionRatio > 0 ? fixedCost / contributionRatio : 0;
    const marginOfSafety = revenue - bepSales;
    const marginOfSafetyPercent = revenue > 0 ? (marginOfSafety / revenue) * 100 : 0;

    return {
      variableCost: parseFloat(variableCost.toFixed(2)),
      fixedCost: parseFloat(fixedCost.toFixed(2)),
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

  // 12. BALANCE SHEET - PROPER METHOD (5 YEARS)
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

      // Get outstanding term loan from repayment schedule
      const termLoanOutstanding = repaymentSchedule.schedule[year * 12 - 1]?.outstandingBalance || 0;

      // Get fixed assets WDV from depreciation schedule
      const fixedAssetsWDV = depSchedule[i]?.writtenDownValue || 0;

      // Working capital items
      const inventory = closingStocks[i] || 0;
      const receivables = receivablesArray[i] || 0;
      const cash = cf.closingBalance;

      // Calculate accounts payable (CORRECTED per banking norms)
      // Formula: Accounts Payable = (Stock Purchases / 365) × Creditor Days
      // For retail: Creditor Days = 30-45 (standard is 30)
      const creditorDays = tradingDetails.creditorDays || 30;
      const accountsPayable = (profit.stockPurchase / 365) * creditorDays;

      // LIABILITIES
      const liabilities = {
        shareholderFunds: {
          capital: parseFloat(initialCapital.toFixed(2)),
          reserveSurplus: parseFloat(cumulativeReserves.toFixed(2))
        },
        nonCurrentLiabilities: {
          termLoan: parseFloat(termLoanOutstanding.toFixed(2))
        },
        currentLiabilities: {
          wcLoan: parseFloat(wcLoan.toFixed(2)),
          accountsPayable: parseFloat(accountsPayable.toFixed(2))
        },
        totalLiabilities: parseFloat((initialCapital + cumulativeReserves + termLoanOutstanding + wcLoan + accountsPayable).toFixed(2))
      };

      // ASSETS
      const assets = {
        nonCurrentAssets: {
          fixedAssets: parseFloat(fixedAssetsWDV.toFixed(2))
        },
        currentAssets: {
          inventory: parseFloat(inventory.toFixed(2)),
          tradeReceivables: parseFloat(receivables.toFixed(2)),
          cash: parseFloat(cash.toFixed(2))
        },
        totalAssets: parseFloat((fixedAssetsWDV + inventory + receivables + cash).toFixed(2))
      };

      // VALIDATION: Assets must equal Liabilities
      const isBalanced = Math.abs(assets.totalAssets - liabilities.totalLiabilities) < 1; // Allow ±1 for rounding

      balanceSheet.push({
        year,
        liabilities,
        assets,
        isBalanced,
        balanceDifference: parseFloat((assets.totalAssets - liabilities.totalLiabilities).toFixed(2))
      });
    }

    return balanceSheet;
  }

  // 12B. LEGACY BALANCE SHEET (5 YEARS)
  static generateBalanceSheet(projectData, profitability, repaymentSchedule, meansOfFinance, cashFlow) {
    const balanceSheet = [];
    let cumulativeRetainedEarnings = 0;
    let fixedAssetsNet = projectData.projectCost.fixedCapital;

    for (let i = 0; i < 5; i++) {
      const year = i + 1;
      const profit = profitability[i];
      const cf = cashFlow[i];
      
      cumulativeRetainedEarnings += profit.profitAfterTax;
      fixedAssetsNet -= profit.depreciation;

      const termLoanOutstanding = repaymentSchedule.schedule[(i + 1) * 12 - 1]?.outstandingBalance || 0;

      const liabilities = {
        promoterCapital: meansOfFinance.marginMoney,
        retainedEarnings: parseFloat(cumulativeRetainedEarnings.toFixed(2)),
        termLoanOutstanding: parseFloat(termLoanOutstanding.toFixed(2)),
        wcLoanOutstanding: parseFloat(meansOfFinance.wcLoan.toFixed(2)),
        totalLiabilities: parseFloat((meansOfFinance.marginMoney + cumulativeRetainedEarnings + termLoanOutstanding + meansOfFinance.wcLoan).toFixed(2))
      };

      const assets = {
        fixedAssetsNet: parseFloat(Math.max(0, fixedAssetsNet).toFixed(2)),
        currentAssets: parseFloat((cf.closingBalance * 0.5).toFixed(2)), // Hypothetical split
        cashBalance: parseFloat(cf.closingBalance.toFixed(2)),
        totalAssets: parseFloat((Math.max(0, fixedAssetsNet) + cf.closingBalance + (cf.closingBalance * 0.5)).toFixed(2))
      };

      // Balancing act for simple representation
      liabilities.totalLiabilities = liabilities.promoterCapital + liabilities.retainedEarnings + liabilities.termLoanOutstanding + liabilities.wcLoanOutstanding;
      assets.totalAssets = liabilities.totalLiabilities; // Force balance for DPR representation
      assets.currentAssets = assets.totalAssets - assets.fixedAssetsNet - assets.cashBalance;

      balanceSheet.push({
        year,
        liabilities,
        assets
      });
    }
    return balanceSheet;
  }

  // ✅ VALIDATION RULES
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
}
