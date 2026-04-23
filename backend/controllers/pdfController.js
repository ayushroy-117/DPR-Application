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
      
      const meansOfFinance = FinancialCalculations.calculateMeansOfFinance(
        fixedCapital,
        workingCapitalRequirement,
        marginPercent,
        project.meansOfFinance?.manualWCLoanAmount
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

      // ✅ STEP 15: Generate Balance Sheet
      project.balanceSheet = FinancialCalculations.generateBalanceSheet(
        project,
        profitability,
        repaymentSchedule,
        meansOfFinance,
        project.cashFlow
      );
      
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
