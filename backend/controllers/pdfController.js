import Project from '../models/Project.js';
import { PDFService } from '../services/pdfService.js';
import { FinancialCalculations } from '../services/financialCalculations.js';

export const generatePDF = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if new financial fields exist, if not, trigger a temporary calculation
    if (!project.cashFlow || project.cashFlow.length === 0 || !project.balanceSheet || project.balanceSheet.length === 0 || !project.profitability || project.profitability.length === 0) {
      console.log('Project missing financial statements, performing temporary calculation for PDF');
      
      // ✅ STEP 1-4: Basic Calculations
      const projectCostData = project.projectCost || {};
      const projectCost = FinancialCalculations.calculateProjectCost(projectCostData);
      const fixedCapital = projectCost.fixedCapital;
      const workingCapitalRequirement = projectCostData.workingCapitalRequirement || 0;
      
      const monthlyExpensesData = project.monthlyExpenses || {};
      const marginPercent = project.meansOfFinance?.marginPercent || 5;
      const schemeName = project.basicInfo?.schemeName || 'SWABALAMBAN';
      
      const meansOfFinance = FinancialCalculations.calculateMeansOfFinance(
        fixedCapital,
        workingCapitalRequirement,
        marginPercent,
        project.meansOfFinance?.manualWCLoanAmount,
        schemeName
      );

      const revenueData = project.revenueProjection || {};
      const capacityUtilizationYearly = revenueData.yearlyProjections?.map(p => p.capacityUtilization) || [100, 100, 100, 100, 100];
      const revenueProjections = FinancialCalculations.generateRevenueProjections(
        revenueData.dailyRevenueYear1 || 0,
        revenueData.workingDays || 250,
        revenueData.growthPercent || 5,
        capacityUtilizationYearly
      );

      const expenseProjections = FinancialCalculations.generateExpenseProjections(
        monthlyExpensesData,
        project.expenseProjection?.expenseGrowthPercent || 3
      );

      // ✅ STEP 5: Depreciation Schedule (NEW - replaces static depreciation)
      const depreciationSchedule = FinancialCalculations.generateDepreciationSchedule(
        fixedCapital,
        project.depreciation?.depreciationRate || 15
      );

      // ✅ STEP 8: Repayment Schedule
      const repaymentSchedule = FinancialCalculations.generateRepaymentSchedule(
        meansOfFinance.termLoan,
        project.meansOfFinance?.interestRateAnnual || 8,
        project.meansOfFinance?.tenureMonths || 60,
        project.meansOfFinance?.moratoriumMonths || 0
      );

      // ✅ STEP 10: Prepare Trading Details for Profitability (NEW)
      const tradingDetails = project.tradingDetails || {};
      tradingDetails.openingStock = parseFloat(tradingDetails.openingStock) || 0;
      tradingDetails.closingStocksList = (project.tradingDetails?.closingStocks || [])
        .sort((a, b) => a.year - b.year)
        .map(s => parseFloat(s.amount) || 0);
      tradingDetails.stockPurchasesList = (project.tradingDetails?.stockPurchases || [])
        .sort((a, b) => a.year - b.year)
        .map(s => parseFloat(s.amount) || 0);

      // ✅ STEP 11: Calculate Profitability with Stock (UPDATED - uses modern calculation)
      const wcInterestRate = project.meansOfFinance?.wcInterestRate || 9;
      const taxPercent = project.taxSettings?.taxPercent || 0;
      const profitability = FinancialCalculations.calculateProfitabilityWithStock(
        revenueProjections,
        expenseProjections,
        depreciationSchedule,
        repaymentSchedule,
        meansOfFinance.wcLoan,
        wcInterestRate,
        taxPercent,
        tradingDetails
      );
      project.profitability = profitability;

      // ✅ STEP 14: Generate Cash Flow Statement with Indirect Method (UPDATED - modern function)
      const tradeReceivables = project.tradeReceivables || [];
      const proprietorDrawings = project.proprietorDrawings || [];
      project.cashFlow = FinancialCalculations.generateCashFlowStatementIndirect(
        project,
        profitability,
        repaymentSchedule,
        meansOfFinance,
        tradingDetails,
        tradeReceivables,
        proprietorDrawings
      );

      // ✅ STEP 15: Generate Balance Sheet (using correct function with all 8 parameters)
      project.balanceSheet = FinancialCalculations.generateBalanceSheetProper(
        project,
        profitability,
        repaymentSchedule,
        meansOfFinance,
        project.cashFlow,
        depreciationSchedule,
        tradingDetails,
        tradeReceivables
      );

      // ✅ STEP 16: Store all calculated values back to project object for PDF generation
      // (These were calculated but not persisted, causing zeros in PDF output)
      project.projectCost = projectCost;
      project.meansOfFinance = meansOfFinance;
      
      // Store revenue and expense projections
      if (!project.revenueProjection) project.revenueProjection = {};
      if (!project.expenseProjection) project.expenseProjection = {};
      project.revenueProjection.yearlyProjections = revenueProjections;
      project.expenseProjection.yearlyProjections = expenseProjections;
      
      // Store depreciation schedule
      if (!project.depreciation) project.depreciation = {};
      project.depreciation.schedule = depreciationSchedule.schedule;
      project.depreciation.totalDepreciation = depreciationSchedule.totalDepreciation;
      
      // Store term loan details and repayment schedule
      if (!project.termLoanDetails) project.termLoanDetails = {};
      project.termLoanDetails.repaymentSchedule = repaymentSchedule.schedule;
      project.termLoanDetails.loanAmount = meansOfFinance.termLoan;
      
      // Store cash flow (already stored above, but ensuring it's persisted)
      project.cashFlow = project.cashFlow || {};
      
      // ✅ STEP 17: Calculate DSCR (Debt Service Coverage Ratio) - was missing entirely
      if (FinancialCalculations.calculateDSCR) {
        const dscr = FinancialCalculations.calculateDSCR(
          profitability,
          repaymentSchedule,
          depreciationSchedule
        );
        project.dscr = dscr;
      }

      // ✅ STEP 18: Calculate Break-Even Analysis with proper fixed costs
      if (FinancialCalculations.calculateBreakEven && depreciationSchedule && repaymentSchedule) {
        // Extract Year 1 data for BEP calculation
        const depreciationYear1 = depreciationSchedule.schedule?.[0]?.depreciation || 0;
        const interestTLYear1 = repaymentSchedule.schedule
          ?.filter(s => s.month <= 12)  // First 12 months
          .reduce((sum, s) => sum + (s.interest || 0), 0) || 0;
        
        // WC Interest = Annual WC Loan * Annual Rate / 100
        const wcInterestRate = project.meansOfFinance?.wcInterestRate || 9;
        const wcLoanAmount = meansOfFinance.wcLoan || 0;
        const interestWCYear1 = (wcLoanAmount * wcInterestRate) / 100;
        
        const breakEvenAnalysis = FinancialCalculations.calculateBreakEven(
          expenseProjections,
          revenueProjections,
          depreciationYear1,
          interestTLYear1,
          interestWCYear1
        );
        project.breakEvenAnalysis = breakEvenAnalysis;
      }
      
      // ✅ AUTO-SAVE: Persist calculated financial statements to database
      try {
        console.log('💾 Auto-saving calculated financial statements to database...');
        await project.save();
        console.log('✅ Financial statements saved successfully');
      } catch (saveError) {
        console.error('⚠️ Warning: Failed to auto-save financial statements:', saveError.message);
        // Don't throw error here - allow PDF generation to proceed even if save fails
        // The calculations are in memory and will be used for PDF generation
      }
    }

    // ✅ ENSURE meansOfFinance components are always calculated (even if using cached project)
    // This fixes the issue where existing projects have 0 values for components
    if (!project.meansOfFinance?.termLoanComponent || project.meansOfFinance.termLoanComponent === 0) {
      const projectCostData = project.projectCost || {};
      const fixedCapital = projectCostData.fixedCapital || FinancialCalculations.calculateProjectCost(projectCostData).fixedCapital;
      const workingCapitalRequirement = projectCostData.workingCapitalRequirement || 0;
      const marginPercent = project.meansOfFinance?.marginPercent || 5;
      const schemeName = project.basicInfo?.schemeName || 'SWABALAMBAN';
      
      // Recalculate meansOfFinance to get correct components
      const meansOfFinanceRecalc = FinancialCalculations.calculateMeansOfFinance(
        fixedCapital,
        workingCapitalRequirement,
        marginPercent,
        project.meansOfFinance?.manualWCLoanAmount,
        schemeName
      );
      
      // Merge with existing meansOfFinance but update components
      project.meansOfFinance = {
        ...project.meansOfFinance,
        ...meansOfFinanceRecalc
      };
    }

    console.log('Generating PDF for project:', project._id);
    const pdfDoc = await PDFService.generateDPR(project.toObject());
    console.log('PDF document created');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DPR_${project.basicInfo?.businessName || 'Report'}.pdf"`);
    
    // Generate PDF as base64 and convert to buffer
    pdfDoc.getBase64((base64) => {
      try {
        const buffer = Buffer.from(base64, 'base64');
        console.log('PDF buffer created, size:', buffer.length);
        res.send(buffer);
        console.log('PDF sent to client');
      } catch (error) {
        console.error('Error in getBase64 callback:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error sending PDF' });
        }
      }
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message, error: error.toString() });
    }
  }
};
