import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },

  // Basic Information
  basicInfo: {
    businessName: String,
    promoterName: String,
    address: String,
    phone: String,
    businessType: String,
    schemeName: String,
    employmentCount: Number,
    employmentType: String,
    district: String,
    state: String,
    guardianName: String,
    locality: String,
    city: String,
    pinCode: String,
    introduction: { type: String, default: '' },
    assumptions: { type: String, default: '' }
  },

  // Project Cost - Fixed Assets Breakdown
  projectCost: {
    assets: [{
      asset_name: String,
      total_budget: Number
    }],
    fixedCapital: { type: Number, default: 0 },
    workingCapitalRequirement: { type: Number, default: 0 }, // Field for CC Loan base
    totalFixedAssets: { type: Number, default: 0 }
  },

  // Working Capital - From Monthly Expenses
  monthlyExpenses: {
    rent: { type: Number, default: 0 },
    salary: { type: Number, default: 0 },
    electricity: { type: Number, default: 0 },
    maintenance: { type: Number, default: 0 },
    misc: { type: Number, default: 0 },
    monthlyExpenseTotal: { type: Number, default: 0 },
    annualExpense: { type: Number, default: 0 },
    reserveMonths: { type: Number, default: 3 },
    totalWorkingCapital: { type: Number, default: 0 }
  },

  // Total Project Requirement (Fixed + Working Capital)
  totalProjectRequirement: { type: Number, default: 0 },

  // Means of Finance
  meansOfFinance: {
    marginPercent: { type: Number, default: 5 },
    marginMoney: { type: Number, default: 0 },
    bankLoan: { type: Number, default: 0 },
    termLoanPercent: { type: Number, default: 70 },
    termLoan: { type: Number, default: 0 },
    wcLoanPercent: { type: Number, default: 30 },
    wcLoan: { type: Number, default: 0 },
    manualWCLoanAmount: { type: Number, default: null }
  },

  // Revenue Projection (5 Years)
  revenueProjection: {
    dailyRevenueYear1: { type: Number, required: true },
    workingDays: { type: Number, required: true },
    growthPercent: { type: Number, default: 5 },
    yearlyProjections: [{
      year: Number,
      dailyRevenue: Number,
      workingDays: Number,
      annualRevenue: Number,
      capacityUtilization: Number,
      actualRevenue: Number
    }]
  },

  // Expense Projection (5 Years)
  expenseProjection: {
    expenseGrowthPercent: { type: Number, default: 3 },
    yearlyProjections: [{
      year: Number,
      rent: Number,
      salary: Number,
      electricity: Number,
      maintenance: Number,
      misc: Number,
      totalExpense: Number
    }]
  },

  // Financial Projections - Complete Trading Model (18 fields)
  profitability: [{
    year: Number,
    // Revenue Section
    salesRevenue: Number,
    closingStock: Number,
    adjustedRevenue: Number,
    // Cost Section
    openingStock: Number,
    stockPurchase: Number,
    salary: Number,
    electricity: Number,
    totalDirectCost: Number,
    // Gross Profit Section
    grossProfit: Number,
    misc: Number,
    ebitda: Number,
    // Financing & Tax Section
    depreciation: Number,
    interestTL: Number,
    interestWC: Number,
    profitBeforeTax: Number,
    incomeTax: Number,
    profitAfterTax: Number,
    // Ratio
    netProfitRatio: Number
  }],

  // Cash Flow Statement (Indirect Method)
  cashFlow: [{
    year: Number,
    inflow: {
      capital: Number,
      pbtWithInterest: Number,
      wcLoanDrawn: Number,
      depreciation: Number,
      increaseInPayables: Number,
      totalInflow: Number
    },
    outflow: {
      fixedAssets: Number,
      increaseInCA: Number,
      interestTL: Number,
      interestWC: Number,
      taxPaid: Number,
      tlRepaid: Number,
      drawings: Number,
      totalOutflow: Number
    },
    openingBalance: Number,
    netCashFlow: Number,
    closingBalance: Number
  }],

  // Balance Sheet
  balanceSheet: [{
    year: Number,
    liabilities: {
      shareholderFunds: {
        capital: Number,
        reserveSurplus: Number
      },
      nonCurrentLiabilities: {
        termLoan: Number
      },
      currentLiabilities: {
        wcLoan: Number,
        accountsPayable: Number
      },
      totalLiabilities: Number
    },
    assets: {
      nonCurrentAssets: {
        fixedAssets: Number
      },
      currentAssets: {
        inventory: Number,
        tradeReceivables: Number,
        cash: Number
      },
      totalAssets: Number
    },
    isBalanced: Boolean,
    balanceDifference: Number
  }],

  // Loan Details - Term Loan EMI
  termLoanDetails: {
    loanAmount: { type: Number, default: 0 },
    interestRateAnnual: { type: Number, default: 8 },
    tenureMonths: { type: Number, default: 60 },
    moratoriumMonths: { type: Number, default: 0 },
    emiAmount: { type: Number, default: 0 },
    totalInterest: { type: Number, default: 0 },
    repaymentSchedule: [{
      month: Number,
      principalPaid: Number,
      interestPaid: Number,
      emiAmount: Number,
      outstandingBalance: Number,
      status: String
    }]
  },

  // Loan Details - Working Capital Loan
  wcLoanDetails: {
    loanAmount: { type: Number, default: 0 },
    interestRateAnnual: { type: Number, default: 9 },
    renewalFrequency: { type: String, default: 'annual' }
  },

  // Depreciation Settings & Schedule
  depreciation: {
    depreciationRate: { type: Number, default: 15 }, // Percentage (e.g., 15%)
    depreciationPerYear: { type: Number, default: 0 }, // Kept for backward compatibility
    schedule: [{
      year: Number,
      grossBlock: Number,
      depreciationAmount: Number,
      writtenDownValue: Number
    }]
  },

  // Trading Business Details - Stock & Inventory
  tradingDetails: {
    openingStock: { type: Number, default: 0 }, // Pre-operative
    closingStocks: [{
      year: Number,
      amount: Number
    }],
    stockPurchases: [{
      year: Number,
      amount: Number
    }]
  },

  // Trade Receivables (5 years)
  tradeReceivables: [{
    year: Number,
    amount: Number
  }],

  // Proprietor Drawings (5 years)
  proprietorDrawings: [{
    year: Number,
    amount: Number
  }],

  // Accounts Payable Settings
  workingCapitalSettings: {
    accountsPayableDays: { type: Number, default: 30 }
  },

  // DSCR Calculation
  dscr: {
    yearlyDSCR: [{
      year: Number,
      profitAfterTax: Number,
      depreciation: Number,
      yearInterest: Number,
      cashAccrual: Number,
      principalPaid: Number,
      debtObligation: Number,
      dscr: Number
    }],
    averageDSCR: { type: Number, default: 0 }
  },

  // Break-even Analysis
  breakEvenAnalysis: {
    variableCost: { type: Number, default: 0 },
    fixedCost: { type: Number, default: 0 },
    contribution: { type: Number, default: 0 },
    contributionRatio: { type: Number, default: 0 },
    bepPercent: { type: Number, default: 0 },
    bepSales: { type: Number, default: 0 },
    marginOfSafety: { type: Number, default: 0 },
    marginOfSafetyPercent: { type: Number, default: 0 }
  },

  // Validation Results
  validations: {
    loanBalance: Boolean,
    revenueGreaterThanExpense: Boolean,
    dscrGreaterThanOne: Boolean,
    bepLessThan100: Boolean,
    emiFeasible: Boolean,
    wcLoanBelowSalesLimit: Boolean // CC Loan <= 25% of annual sales
  },

  // Trading Audit (Helps identify BUG 4 issues)
  tradingAudit: {
    warnings: [String],
    info: [String]
  },

  // Tax Settings
  taxSettings: {
    taxPercent: { type: Number, default: 0 }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Project', projectSchema);
