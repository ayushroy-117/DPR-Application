import Project from '../models/Project.js';
import { FinancialCalculations } from '../services/financialCalculations.js';

// Create Project
export const createProject = async (req, res) => {
  try {
    const projectData = req.body;
    const project = new Project({
      userId: req.user.id,
      ...projectData
    });
    await project.save();
    res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Projects (User's projects)
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Project
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Project
export const updateProject = async (req, res) => {
  try {
    const projectData = req.body;
    projectData.updatedAt = new Date();

    // 🔧 FIX: Calculate derived fields if monthlyExpenses is being updated
    if (projectData.monthlyExpenses) {
      const monthlyExpensesData = projectData.monthlyExpenses;
      const reserveMonths = monthlyExpensesData.reserveMonths || 3;
      
      // Calculate monthlyExpenseTotal, annualExpense, and workingCapital
      const expensesCalculated = FinancialCalculations.calculateWorkingCapital(
        monthlyExpensesData,
        reserveMonths
      );
      
      // Merge calculated values back into monthlyExpenses
      projectData.monthlyExpenses = {
        ...monthlyExpensesData,
        ...expensesCalculated
      };
      
      console.log('✅ Calculated monthlyExpenseTotal:', expensesCalculated.monthlyExpenseTotal);
      console.log('✅ Calculated annualExpense:', expensesCalculated.annualExpense);
      console.log('✅ Calculated workingCapital:', expensesCalculated.workingCapital);
    }

    // 🔧 FIX: Calculate fixedCapital from assets if projectCost is being updated
    if (projectData.projectCost && projectData.projectCost.assets) {
      const projectCostData = projectData.projectCost;
      const fixedCapitalCalculated = FinancialCalculations.calculateProjectCost(projectCostData);
      
      // Merge calculated values back
      projectData.projectCost = {
        ...projectCostData,
        ...fixedCapitalCalculated,
        totalFixedAssets: fixedCapitalCalculated.fixedCapital
      };
      
      console.log('✅ Calculated fixedCapital:', fixedCapitalCalculated.fixedCapital);
    }

    const project = await Project.findByIdAndUpdate(req.params.id, projectData, { new: true });
    res.json({ message: 'Project updated', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Project
export const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate all financial data for a project
export const calculateFinancials = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('\n===== FINANCIAL CALCULATION START =====' );
    console.log('📦 PROJECT DATA FROM DB:');
    console.log('  Monthly Expenses:', JSON.stringify(project.monthlyExpenses));
    console.log('  Revenue Projection:', JSON.stringify(project.revenueProjection));
    console.log('  Trading Details:', JSON.stringify(project.tradingDetails));

    // ✅ STEP 1: Calculate Project Cost (Fixed Assets)
    const projectCostData = project.projectCost || {};
    const projectCost = FinancialCalculations.calculateProjectCost(projectCostData);
    project.projectCost = {
      ...projectCostData,
      ...projectCost,
      totalFixedAssets: projectCost.fixedCapital
    };

    // ✅ STEP 2: Monthly Expenses (Used for projections, not WC Loan anymore)
    const monthlyExpensesData = project.monthlyExpenses || {};
    const expensesCalculated = FinancialCalculations.calculateWorkingCapital(
      monthlyExpensesData,
      monthlyExpensesData.reserveMonths || 3
    );
    project.monthlyExpenses = {
      ...monthlyExpensesData,
      ...expensesCalculated
    };

    // ✅ STEP 3: Calculate Total Project Requirement (Fixed + WC Requirement)
    const fixedCapital = projectCost.fixedCapital;
    const workingCapitalRequirement = expensesCalculated.workingCapital || 0;
    const totalProjectRequirement = fixedCapital + workingCapitalRequirement;
    project.totalProjectRequirement = totalProjectRequirement;
    
    // Update projectCost with the calculated working capital requirement for persistence
    project.projectCost.workingCapitalRequirement = workingCapitalRequirement;

    // ✅ STEP 4: Calculate Means of Finance (Scheme-Aware - FIXES BUG 1)
    const meansOfFinanceData = project.meansOfFinance || {};
    const marginPercent = meansOfFinanceData.marginPercent || 5;
    const schemeName = project.basicInfo?.schemeName || 'SWABALAMBAN'; // Get scheme from project
    
    const meansOfFinance = FinancialCalculations.calculateMeansOfFinance(
      fixedCapital,
      workingCapitalRequirement,
      marginPercent,
      meansOfFinanceData.manualWCLoanAmount,
      schemeName // Pass scheme to calculate correctly
    );
    
    project.meansOfFinance = {
      ...meansOfFinanceData,
      ...meansOfFinance
    };

    // ✅ STEP 5: Generate Revenue Projections (5 Years)
    const revenueData = project.revenueProjection || {};
    let capacityUtilizationYearly = [100, 100, 100, 100, 100];
    if (revenueData.yearlyProjections && revenueData.yearlyProjections.length === 5) {
      const extracted = revenueData.yearlyProjections.map(p => p.capacityUtilization).filter(v => typeof v === 'number' && !isNaN(v));
      if (extracted.length === 5) {
        capacityUtilizationYearly = extracted;
      }
    }
    const dailyRevenueYear1 = parseFloat(revenueData.dailyRevenueYear1) || 0;
    const workingDays = parseInt(revenueData.workingDays) || 250;
    const growthPercent = parseFloat(revenueData.growthPercent) || 5;
    console.log('Revenue:', dailyRevenueYear1, 'Days:', workingDays, 'Growth:', growthPercent, 'Capacity:', capacityUtilizationYearly);
    const revenueProjections = FinancialCalculations.generateRevenueProjections(
      dailyRevenueYear1,
      workingDays,
      growthPercent,
      capacityUtilizationYearly
    );
    project.revenueProjection = {
      ...revenueData,
      dailyRevenueYear1,
      workingDays,
      growthPercent,
      yearlyProjections: revenueProjections
    };

    // ✅ STEP 6: Generate Expense Projections (5 Years)
    const expenseData = project.expenseProjection || {};
    const monthlyExpensesForProjection = {
      rent: parseFloat(project.monthlyExpenses?.rent) || 0,
      salary: parseFloat(project.monthlyExpenses?.salary) || 0,
      electricity: parseFloat(project.monthlyExpenses?.electricity) || 0,
      maintenance: parseFloat(project.monthlyExpenses?.maintenance) || 0,
      misc: parseFloat(project.monthlyExpenses?.misc) || 0
    };
    console.log('Expenses - Rent:', monthlyExpensesForProjection.rent, 'Salary:', monthlyExpensesForProjection.salary);
    const expenseProjections = FinancialCalculations.generateExpenseProjections(
      monthlyExpensesForProjection,
      expenseData.expenseGrowthPercent || 3
    );
    project.expenseProjection = {
      ...expenseData,
      yearlyProjections: expenseProjections
    };

    // ✅ STEP 7: Calculate Depreciation Schedule FIRST (Critical dependency)
    const depreciationData = project.depreciation || {};
    const depRate = depreciationData.depreciationRate || 15;
    const depreciationSchedule = FinancialCalculations.generateDepreciationSchedule(
      fixedCapital,
      depRate
    );
    project.depreciation = {
      ...depreciationData,
      depreciationRate: depRate,
      schedule: depreciationSchedule.schedule
    };

    // ✅ STEP 8: Calculate EMI for Term Loan (BEFORE profitability so we have interest data)
    const termLoanAmount = meansOfFinance.termLoan;
    const termLoanInterest = meansOfFinanceData.interestRateAnnual || 8;
    const tenure = meansOfFinanceData.tenureMonths || 60;
    const moratorium = meansOfFinanceData.moratoriumMonths || 0;

    const repaymentSchedule = FinancialCalculations.generateRepaymentSchedule(
      termLoanAmount,
      termLoanInterest,
      tenure,
      moratorium
    );

    project.termLoanDetails = {
      loanAmount: termLoanAmount,
      interestRateAnnual: termLoanInterest,
      tenureMonths: tenure,
      moratoriumMonths: moratorium,
      emiAmount: repaymentSchedule.emiAmount,
      repaymentSchedule: repaymentSchedule.schedule,
      totalInterest: repaymentSchedule.schedule.reduce((sum, month) => sum + month.interestPaid, 0)
    };

    // ✅ STEP 9: WC Loan Details (CC Loan)
    const wcInterestRate = meansOfFinanceData.wcInterestRate || 9;
    project.wcLoanDetails = {
      loanAmount: meansOfFinance.wcLoan,
      interestRateAnnual: wcInterestRate,
      limit: revenueProjections[0].actualRevenue * 0.25
    };

    // ✅ STEP 10: Prepare Trading Details for Profitability
    const tradingDetails = project.tradingDetails || {};
    tradingDetails.openingStock = parseFloat(tradingDetails.openingStock) || 0;
    tradingDetails.closingStocksList = (project.tradingDetails?.closingStocks || [])
      .sort((a, b) => a.year - b.year)
      .map(s => parseFloat(s.amount) || 0);
    tradingDetails.stockPurchasesList = (project.tradingDetails?.stockPurchases || [])
      .sort((a, b) => a.year - b.year)
      .map(s => parseFloat(s.amount) || 0);
    console.log('Trading - Opening Stock:', tradingDetails.openingStock, 'Closing:', tradingDetails.closingStocksList);

    // DEBUG: Log the projections before profitability calculation
    console.log('\n📊 PROJECTIONS BEFORE PROFITABILITY:');
    console.log('  Revenue Y1:', JSON.stringify(revenueProjections[0]));
    console.log('  Expense Y1:', JSON.stringify(expenseProjections[0]));
    console.log('  Depreciation totalDep:', depreciationSchedule.totalDep);

    // ✅ STEP 11: Calculate Profitability Statement (5 Years) - Uses depreciation & loan details
    const taxPercent = project.taxSettings?.taxPercent || 0;
    const profitability = FinancialCalculations.calculateProfitabilityWithStock(
      revenueProjections,
      expenseProjections,
      depreciationSchedule,
      repaymentSchedule,
      meansOfFinance.wcLoan,
      wcInterestRate,
      taxPercent,
      tradingDetails,
      schemeName // Pass scheme for tax calculation
    );
    project.profitability = profitability;

    // ✅ STEP 12: Calculate DSCR (FIXES BUG 3 - Uses yearly depreciation)
    const dscr = FinancialCalculations.calculateDSCR(
      profitability,
      repaymentSchedule,
      depreciationSchedule // Pass full depreciation schedule for yearly values
    );
    project.dscr = dscr;

    // ✅ STEP 13: Calculate Break-Even Analysis
    const breakEven = FinancialCalculations.calculateBreakEven(
      expenseProjections,
      revenueProjections
    );
    project.breakEvenAnalysis = breakEven;

    // ✅ STEP 14: Generate Cash Flow Statement (Indirect Method) - Uses profitability
    const tradeReceivables = project.tradeReceivables || [];
    const proprietorDrawings = project.proprietorDrawings || [];
    const cashFlow = FinancialCalculations.generateCashFlowStatementIndirect(
      project,
      profitability,
      repaymentSchedule,
      meansOfFinance,
      tradingDetails,
      tradeReceivables,
      proprietorDrawings
    );
    project.cashFlow = cashFlow;

    // ✅ STEP 15: Generate Balance Sheet (Proper) - Uses all above
    const balanceSheet = FinancialCalculations.generateBalanceSheetProper(
      project,
      profitability,
      repaymentSchedule,
      meansOfFinance,
      cashFlow,
      depreciationSchedule,
      tradingDetails,
      tradeReceivables
    );
    project.balanceSheet = balanceSheet;

    // ✅ STEP 16: Validation
    const validations = FinancialCalculations.validateFinancials(
      totalProjectRequirement,
      meansOfFinance.marginMoney,
      meansOfFinance.bankLoan,
      revenueProjections,
      expenseProjections,
      dscr,
      breakEven,
      meansOfFinance.wcLoan
    );
    
    // Trading Details Audit (Helps identify BUG 4 issues)
    const tradingAudit = FinancialCalculations.validateTradingDetails(
      revenueProjections,
      profitability,
      tradingDetails
    );
    
    project.validations = validations;
    project.tradingAudit = tradingAudit;

    // ✅ STEP 17: Verify Balance Sheet Balances
    const balanceSheetValidation = balanceSheet.map((bs, i) => ({
      year: i + 1,
      isBalanced: bs.isBalanced,
      difference: bs.balanceDifference
    }));

    await project.save();
    res.json({
      message: 'Financials calculated successfully',
      project,
      summary: {
        totalProjectCost: totalProjectRequirement,
        marginMoney: meansOfFinance.marginMoney,
        bankLoan: meansOfFinance.bankLoan,
        termLoan: meansOfFinance.termLoan,
        wcLoan: meansOfFinance.wcLoan,
        emiAmount: repaymentSchedule.emiAmount,
        averageDSCR: dscr.averageDSCR,
        bepPercent: breakEven.bepPercent,
        validations,
        balanceSheetValidation,
        tradingAudit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};
