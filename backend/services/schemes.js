// Lending Schemes Configuration
// Defines scheme-specific rules for margin, interest rates, tenure, and tax treatment

export const SCHEMES = {
  SWABALAMBAN: {
    name: 'Swabalamban',
    description: 'Government scheme with 5% margin, 95% bank loan',
    marginPercent: 5,
    marginCalculationBase: 'WORKING_CAPITAL', // Applied only to WC
    termLoanMargin: 0, // No margin on fixed capital
    bankLoanPercent: 95, // 95% of project cost = bank loan
    promoterMarginPercent: 5, // 5% of project cost = promoter margin
    interestRateAnnual: 8, // Term loan interest
    wcInterestRateAnnual: 9, // Working capital interest
    tenureMonths: 60, // 5 years
    moratoriumMonths: 0,
    taxTreatment: 'INDIVIDUAL_SLABS', // Use individual income tax slabs
    guaranteeFee: 0,
    collateralRequired: true,
    notes: 'Standard government lending scheme for MSME'
  },

  MUDRA: {
    name: 'MUDRA - Micro Units Development and Refinance Agency',
    description: 'Scheme for micro enterprises with flexible margins',
    marginPercent: null, // Category dependent
    marginCategories: {
      SHISHU: { maxLoan: 50000, marginPercent: 0, bankLoanPercent: 100 },
      KISHOR: { maxLoan: 500000, marginPercent: 5, bankLoanPercent: 95 },
      TARUN: { maxLoan: 1000000, marginPercent: 10, bankLoanPercent: 90 }
    },
    interestRateAnnual: 7.5,
    wcInterestRateAnnual: 8.5,
    tenureMonths: 36,
    moratoriumMonths: 0,
    taxTreatment: 'INDIVIDUAL_SLABS',
    guaranteeFee: 0,
    collateralRequired: false,
    notes: 'Category-dependent scheme for micro enterprises'
  },

  CGTMSE: {
    name: 'Credit Guarantee Trust for Micro and Small Enterprises',
    description: 'Guarantee-based scheme with 10-15% margin',
    marginPercent: 15, // Can vary 10-15%
    marginCalculationBase: 'BOTH', // Applied to both fixed capital and WC
    bankLoanPercent: 85, // 85% of project cost
    promoterMarginPercent: 15,
    interestRateAnnual: 8,
    wcInterestRateAnnual: 9,
    tenureMonths: 84, // 7 years
    moratoriumMonths: 12, // 1 year moratorium on principal
    taxTreatment: 'INDIVIDUAL_SLABS',
    guaranteeFee: 1.5, // 1.5% guarantee fee as expense
    collateralRequired: false, // Guarantee replaces collateral
    notes: 'Guarantee-backed scheme, no collateral required'
  },

  SIDBI: {
    name: 'Small Industries Development Bank of India',
    description: 'SIDBI scheme with higher margin and extended tenure',
    marginPercent: 25, // 20-25%
    marginCalculationBase: 'BOTH',
    bankLoanPercent: 75, // 75% of project cost
    promoterMarginPercent: 25,
    interestRateAnnual: 7, // Typically lower
    wcInterestRateAnnual: 8,
    tenureMonths: 84, // 7 years
    moratoriumMonths: 12,
    taxTreatment: 'INDIVIDUAL_SLABS',
    guaranteeFee: 0,
    collateralRequired: true,
    notes: 'Direct lending with extended repayment period'
  },

  PMEGP: {
    name: 'Prime Minister Employment Generation Programme',
    description: 'Government employment generation scheme',
    marginPercent: 5,
    marginCalculationBase: 'WORKING_CAPITAL',
    termLoanMargin: 0,
    bankLoanPercent: 95,
    promoterMarginPercent: 5,
    interestRateAnnual: 8,
    wcInterestRateAnnual: 9,
    tenureMonths: 60,
    moratoriumMonths: 0,
    taxTreatment: 'INDIVIDUAL_SLABS',
    guaranteeFee: 0,
    collateralRequired: true,
    notes: 'PMEGP scheme for employment generation'
  }
};

/**
 * Get scheme configuration by name
 * @param {string} schemeName - Name of the scheme
 * @returns {object} Scheme configuration
 */
export function getSchemeConfig(schemeName) {
  const scheme = SCHEMES[schemeName?.toUpperCase()] || SCHEMES.SWABALAMBAN;
  return { ...scheme, key: schemeName?.toUpperCase() };
}

/**
 * Get list of all available schemes
 * @returns {array} Array of scheme names
 */
export function getAvailableSchemes() {
  return Object.keys(SCHEMES).map(key => ({
    key,
    name: SCHEMES[key].name,
    description: SCHEMES[key].description
  }));
}

/**
 * Get MUDRA category based on loan amount
 * @param {number} totalProjectCost - Total project cost
 * @returns {object} Category configuration
 */
export function getMUDRACategory(totalProjectCost) {
  const scheme = SCHEMES.MUDRA;
  
  if (totalProjectCost <= scheme.marginCategories.SHISHU.maxLoan) {
    return { category: 'SHISHU', ...scheme.marginCategories.SHISHU };
  } else if (totalProjectCost <= scheme.marginCategories.KISHOR.maxLoan) {
    return { category: 'KISHOR', ...scheme.marginCategories.KISHOR };
  } else {
    return { category: 'TARUN', ...scheme.marginCategories.TARUN };
  }
}

/**
 * Calculate margin money based on scheme rules
 * @param {number} fixedCapital - Fixed capital amount
 * @param {number} workingCapital - Working capital amount
 * @param {object} schemeConfig - Scheme configuration
 * @returns {object} Margin calculation breakdown
 */
export function calculateMarginByScheme(fixedCapital, workingCapital, schemeConfig) {
  const totalRequirement = fixedCapital + workingCapital;
  let marginMoney = 0;
  let marginBreakdown = {};

  if (schemeConfig.key === 'MUDRA') {
    const mudraCategory = getMUDRACategory(totalRequirement);
    marginMoney = (totalRequirement * mudraCategory.marginPercent) / 100;
    marginBreakdown = {
      scheme: 'MUDRA',
      category: mudraCategory.category,
      marginPercent: mudraCategory.marginPercent,
      marginMoney,
      bankLoanPercent: mudraCategory.bankLoanPercent
    };
  } else if (schemeConfig.marginCalculationBase === 'WORKING_CAPITAL') {
    // Applied only to working capital (Swabalamban, PMEGP)
    marginMoney = (workingCapital * schemeConfig.marginPercent) / 100;
    marginBreakdown = {
      scheme: schemeConfig.key,
      marginOnWC: marginMoney,
      marginPercent: schemeConfig.marginPercent,
      totalMargin: marginMoney
    };
  } else if (schemeConfig.marginCalculationBase === 'BOTH') {
    // Applied to total project cost (CGTMSE, SIDBI)
    marginMoney = (totalRequirement * schemeConfig.marginPercent) / 100;
    marginBreakdown = {
      scheme: schemeConfig.key,
      marginPercent: schemeConfig.marginPercent,
      totalMargin: marginMoney
    };
  }

  return {
    marginMoney: parseFloat(marginMoney.toFixed(2)),
    marginBreakdown,
    bankLoan: parseFloat((totalRequirement - marginMoney).toFixed(2))
  };
}

/**
 * Get tax treatment configuration for a scheme
 * @param {string} schemeName - Scheme name
 * @returns {object} Tax configuration
 */
export function getTaxConfig(schemeName) {
  const schemeConfig = getSchemeConfig(schemeName);
  
  if (schemeConfig.taxTreatment === 'INDIVIDUAL_SLABS') {
    return {
      type: 'INDIVIDUAL_SLABS',
      slabs: [
        { min: 0, max: 250000, rate: 0 },           // No tax up to ₹2.5L
        { min: 250000, max: 500000, rate: 5 },      // 5% from ₹2.5L to ₹5L
        { min: 500000, max: 1000000, rate: 20 },    // 20% from ₹5L to ₹10L
        { min: 1000000, max: Infinity, rate: 30 }   // 30% above ₹10L
      ],
      description: 'Individual income tax slabs (2023-24)'
    };
  }
  
  return { type: 'DEFAULT', rate: 0, description: 'No tax applicable' };
}

/**
 * Calculate income tax based on scheme-specific tax treatment
 * @param {number} profitBeforeTax - Profit before tax amount
 * @param {string} schemeName - Scheme name
 * @returns {number} Income tax amount
 */
export function calculateTaxByScheme(profitBeforeTax, schemeName) {
  if (profitBeforeTax <= 0) return 0;
  
  const taxConfig = getTaxConfig(schemeName);
  
  if (taxConfig.type === 'INDIVIDUAL_SLABS') {
    let tax = 0;
    const slabs = taxConfig.slabs;
    
    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      if (profitBeforeTax > slab.min) {
        const taxableInThisSlab = Math.min(profitBeforeTax, slab.max) - slab.min;
        tax += (taxableInThisSlab * slab.rate) / 100;
      }
    }
    return parseFloat(tax.toFixed(2));
  }
  
  return 0;
}

/**
 * Get interest rate for loan component based on scheme
 * @param {string} loanType - 'TL' (Term Loan) or 'WC' (Working Capital)
 * @param {string} schemeName - Scheme name
 * @returns {number} Interest rate annual percentage
 */
export function getInterestRate(loanType, schemeName) {
  const schemeConfig = getSchemeConfig(schemeName);
  
  if (loanType === 'TL') {
    return schemeConfig.interestRateAnnual;
  } else if (loanType === 'WC') {
    return schemeConfig.wcInterestRateAnnual;
  }
  
  return schemeConfig.interestRateAnnual;
}

/**
 * Get tenure details for a scheme
 * @param {string} schemeName - Scheme name
 * @returns {object} Tenure configuration
 */
export function getTenureConfig(schemeName) {
  const schemeConfig = getSchemeConfig(schemeName);
  
  return {
    tenureMonths: schemeConfig.tenureMonths,
    moratoriumMonths: schemeConfig.moratoriumMonths,
    yearsOfRepayment: Math.ceil(schemeConfig.tenureMonths / 12),
    years: [1, 2, 3, 4, 5].filter(y => y <= Math.ceil(schemeConfig.tenureMonths / 12))
  };
}

/**
 * Validate project against scheme requirements
 * @param {object} projectData - Project data
 * @param {string} schemeName - Scheme name
 * @returns {object} Validation result
 */
export function validateProjectForScheme(projectData, schemeName) {
  const schemeConfig = getSchemeConfig(schemeName);
  const issues = [];
  const warnings = [];

  const totalProjectCost = (projectData.fixedCapital || 0) + (projectData.workingCapital || 0);

  // MUDRA specific validations
  if (schemeName === 'MUDRA' && totalProjectCost > 1000000) {
    issues.push('MUDRA maximum loan limit is ₹10L. This project exceeds the limit.');
  }

  // Collateral validation
  if (schemeConfig.collateralRequired && !projectData.hasCollateral) {
    warnings.push(`${schemeName} requires collateral. Ensure adequate collateral is available.`);
  }

  // CGTMSE and SIDBI - guarantee/insurance validation
  if ((schemeName === 'CGTMSE' || schemeName === 'SIDBI') && !projectData.hasCGTMSECoverage) {
    warnings.push(`Consider registering for ${schemeName} guarantee coverage.`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    schemeConfig
  };
}
