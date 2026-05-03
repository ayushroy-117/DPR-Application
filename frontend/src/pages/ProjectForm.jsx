import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { projectService } from '../services/api'

export default function ProjectForm() {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      assets: [{ asset_name: '', total_budget: '' }],
      marginPercent: 5,
      interestRateAnnual: 8,
      tenureMonths: 60,
      moratoriumMonths: 0,
      workingDays: 250,
      revenueGrowthPercent: 5,
      expenseGrowthPercent: 3,
      taxPercent: 0,
      capacityYear1: 100,
      capacityYear2: 100,
      capacityYear3: 100,
      capacityYear4: 100,
      capacityYear5: 100,
      depreciationRate: 15,
      openingStock: 0,
      closingStockYear1: 0,
      closingStockYear2: 0,
      closingStockYear3: 0,
      closingStockYear4: 0,
      closingStockYear5: 0,
      stockPurchaseYear1: 0,
      stockPurchaseYear2: 0,
      stockPurchaseYear3: 0,
      stockPurchaseYear4: 0,
      stockPurchaseYear5: 0,
      tradeReceivablesYear1: 0,
      tradeReceivablesYear2: 0,
      tradeReceivablesYear3: 0,
      tradeReceivablesYear4: 0,
      tradeReceivablesYear5: 0,
      drawingsYear1: 0,
      drawingsYear2: 0,
      drawingsYear3: 0,
      drawingsYear4: 0,
      drawingsYear5: 0,
      accountsPayableDays: 30
    }
  })
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets"
  })

  const navigate = useNavigate()
  const [step, setStep] = React.useState(1)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const formData = watch()
  
  // Calculate total assets for step 7 and other logic
  const totalAssets = (formData.assets || []).reduce((sum, item) => sum + (parseFloat(item.total_budget) || 0), 0)

  const onSubmit = async (data) => {
    try {
      setError('')
      setLoading(true)

      const projectData = {
        basicInfo: {
          businessName: data.businessName,
          promoterName: data.promoterName,
          address: data.address,
          phone: data.phone,
          businessType: data.businessType,
          schemeName: data.schemeName,
          employmentCount: parseInt(data.employmentCount) || 0,
          district: data.district,
          state: data.state,
          guardianName: data.guardianName,
          locality: data.locality,
          city: data.city,
          pinCode: data.pinCode,
          introduction: data.introduction,
          assumptions: data.assumptions
        },
        projectCost: {
          assets: data.assets.map(item => ({
            asset_name: item.asset_name,
            total_budget: parseFloat(item.total_budget || 0)
          })),
          workingCapitalRequirement: parseFloat(data.workingCapitalRequirement || 0)
        },
        monthlyExpenses: {
          rent: parseFloat(data.monthlyRent || 0),
          salary: parseFloat(data.monthlySalary || 0),
          electricity: parseFloat(data.monthlyElectricity || 0),
          maintenance: parseFloat(data.monthlyMaintenance || 0),
          misc: parseFloat(data.monthlyMisc || 0),
          reserveMonths: parseInt(data.reserveMonths || 3)
        },
        meansOfFinance: {
          marginPercent: parseFloat(data.marginPercent || 5),
          interestRateAnnual: parseFloat(data.interestRateAnnual || 8),
          wcInterestRate: parseFloat(data.wcInterestRate || 9),
          tenureMonths: parseInt(data.tenureMonths || 60),
          moratoriumMonths: parseInt(data.moratoriumMonths || 0),
          manualWCLoanAmount: data.manualWCLoanAmount ? parseFloat(data.manualWCLoanAmount) : null
        },
        revenueProjection: {
          dailyRevenueYear1: parseFloat(data.dailyRevenueYear1 || 0),
          workingDays: parseInt(data.workingDays || 250),
          growthPercent: parseFloat(data.revenueGrowthPercent || 5),
          yearlyProjections: [
            { year: 1, capacityUtilization: parseFloat(data.capacityYear1 || 100) },
            { year: 2, capacityUtilization: parseFloat(data.capacityYear2 || 100) },
            { year: 3, capacityUtilization: parseFloat(data.capacityYear3 || 100) },
            { year: 4, capacityUtilization: parseFloat(data.capacityYear4 || 100) },
            { year: 5, capacityUtilization: parseFloat(data.capacityYear5 || 100) }
          ]
        },
        expenseProjection: {
          expenseGrowthPercent: parseFloat(data.expenseGrowthPercent || 3)
        },
        depreciation: {
          depreciationRate: parseFloat(data.depreciationRate || 15),
          depreciationPerYear: 0 // Will be calculated in backend
        },
        tradingDetails: {
          openingStock: parseFloat(data.openingStock || 0),
          closingStocks: [1, 2, 3, 4, 5].map(y => ({
            year: y,
            amount: parseFloat(data[`closingStockYear${y}`] || 0)
          })),
          stockPurchases: [1, 2, 3, 4, 5].map(y => ({
            year: y,
            amount: parseFloat(data[`stockPurchaseYear${y}`] || 0)
          }))
        },
        tradeReceivables: [1, 2, 3, 4, 5].map(y => ({
          year: y,
          amount: parseFloat(data[`tradeReceivablesYear${y}`] || 0)
        })),
        proprietorDrawings: [1, 2, 3, 4, 5].map(y => ({
          year: y,
          amount: parseFloat(data[`drawingsYear${y}`] || 0)
        })),
        workingCapitalSettings: {
          accountsPayableDays: parseInt(data.accountsPayableDays || 30)
        },
        taxSettings: {
          taxPercent: parseFloat(data.taxPercent || 0)
        }
      }

      const response = await projectService.create(projectData)
      
      // Calculate financials
      try {
        console.log('🔵 Calculating financials for project:', response.data.project._id)
        await projectService.calculateFinancials(response.data.project._id)
        console.log('✅ Financials calculated successfully')
      } catch (calcError) {
        console.error('❌ Failed to calculate financials:', calcError)
        console.error('Error details:', calcError.response?.data?.message || calcError.message)
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/projects')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-700 mb-6">Step 1: Basic Information</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Business Name *</label>
                <input {...register('businessName', { required: true })} className="form-input" placeholder="Enter business name" />
                {errors.businessName && <span className="text-red-500 text-sm">Required</span>}
              </div>
              <div>
                <label className="form-label">Promoter Name *</label>
                <input {...register('promoterName', { required: true })} className="form-input" placeholder="Enter promoter name" />
                {errors.promoterName && <span className="text-red-500 text-sm">Required</span>}
              </div>
            </div>

            <div>
              <label className="form-label">Address</label>
              <textarea {...register('address')} className="form-input" placeholder="Enter business address" rows="3"></textarea>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Phone Number</label>
                <input {...register('phone')} className="form-input" placeholder="Enter contact number" />
              </div>
              <div>
                <label className="form-label">Business Type</label>
                <select {...register('businessType')} className="form-input">
                  <option>Select type</option>
                  <option>Manufacturing</option>
                  <option>Trading</option>
                  <option>Service</option>
                  <option>Retail</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Scheme Name *</label>
                <select {...register('schemeName', { required: true })} className="form-input">
                  <option value="">Select a scheme</option>
                  <option value="PM SVANIDHI">PM SVANIDHI</option>
                  <option value="Pradhan Mantri Mudra Yojana">Pradhan Mantri Mudra Yojana</option>
                  <option value="Stand-Up India">Stand-Up India</option>
                  <option value="Swabalamban">Swabalamban</option>
                  <option value="PMEGP">PMEGP (Pradhan Mantri Employment Generation Programme)</option>
                  <option value="CGTMSE">CGTMSE (Credit Guarantee Scheme)</option>
                  <option value="SIDBI">SIDBI Scheme</option>
                  <option value="Other">Other</option>
                </select>
                {errors.schemeName && <span className="text-red-500 text-sm">Required</span>}
              </div>
              <div>
                <label className="form-label">Employment Count</label>
                <input {...register('employmentCount', { pattern: /^\d+$/ })} type="number" className="form-input" placeholder="Number of employees" />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded mb-6 border border-blue-200">
              <p className="text-sm text-blue-900 font-semibold mb-2">Address & Location Details (for Cover Page):</p>
              <p className="text-sm text-blue-900">These details will appear on the DPR cover page</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">District *</label>
                <input {...register('district', { required: true })} className="form-input" placeholder="e.g., Dharmanagar" />
                {errors.district && <span className="text-red-500 text-sm">Required</span>}
              </div>
              <div>
                <label className="form-label">State *</label>
                <input {...register('state', { required: true })} className="form-input" placeholder="e.g., North Tripura" />
                {errors.state && <span className="text-red-500 text-sm">Required</span>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Locality</label>
                <input {...register('locality')} className="form-input" placeholder="e.g., Narendra Nagar" />
              </div>
              <div>
                <label className="form-label">City</label>
                <input {...register('city')} className="form-input" placeholder="e.g., Damcherra" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Pin Code</label>
                <input {...register('pinCode')} className="form-input" placeholder="e.g., 799256" />
              </div>
              <div>
                <label className="form-label">Guardian Name (if applicable)</label>
                <input {...register('guardianName')} className="form-input" placeholder="Leave empty if not applicable" />
              </div>
            </div>

            <div>
              <label className="form-label">Introduction (Optional - will be shown in PDF)</label>
              <textarea {...register('introduction')} className="form-input" placeholder="Brief introduction about the project..." rows="4"></textarea>
            </div>

            <div>
              <label className="form-label">Financial Assumptions (Optional)</label>
              <textarea {...register('assumptions')} className="form-input" placeholder="Enter any specific assumptions for calculations..." rows="4"></textarea>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-700 mb-6">Step 2: Project Cost Breakdown</h3>

            <div className="bg-blue-50 p-4 rounded mb-6">
              <p className="text-sm text-blue-900 font-semibold mb-1">Fixed Assets / Budget:</p>
              <p className="text-sm text-blue-900">Add all your fixed asset investments (Machinery, Furniture, Interior, etc.)</p>
            </div>

            <div className="space-y-4 mb-6">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                  <div className="flex-1">
                    <label className="form-label">Asset Name *</label>
                    <input
                      {...register(`assets.${index}.asset_name`, { required: true })}
                      className="form-input bg-white"
                      placeholder="e.g., Furniture, Machinery"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="form-label">Budget (₹) *</label>
                    <input
                      {...register(`assets.${index}.total_budget`, { required: true })}
                      type="number"
                      className="form-input bg-white"
                      placeholder="0"
                    />
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors mb-1"
                      title="Remove Item"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ asset_name: '', total_budget: '' })}
                className="w-full py-3 border-2 border-dashed border-green-300 rounded-lg text-green-600 font-semibold hover:bg-green-50 flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={20} /> Add Another Asset
              </button>

              <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg">
                <span className="font-bold text-green-800">Total Fixed Capital:</span>
                <span className="text-xl font-bold text-green-800">₹ {totalAssets.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded mt-6 border border-yellow-200">
              <p className="text-sm text-yellow-900 font-semibold mb-2">Working Capital Requirement (CC Loan Base):</p>
              <p className="text-sm text-yellow-900 mb-4">Enter the capital required for starting operations (Initial Stock, Raw Materials, etc.). This will form the base for your CC Loan.</p>
              <div>
                <label className="form-label font-bold">Initial Working Capital Requirement (₹) *</label>
                <input {...register('workingCapitalRequirement', { required: true })} type="number" className="form-input border-yellow-400" placeholder="e.g., 80000" />
                {errors.workingCapitalRequirement && <span className="text-red-500 text-sm">Required for CC Loan calculation</span>}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-700 mb-6">Step 3: Trading Business Details</h3>

            <div className="bg-blue-50 p-4 rounded mb-6">
              <p className="text-sm text-blue-900 font-semibold mb-1">Trading/Manufacturing Model:</p>
              <p className="text-sm text-blue-900">Enter depreciation rate, stocks, receivables, and drawings for accurate profitability calculation.</p>
            </div>

            <div className="border-b pb-6 mb-6">
              <h4 className="font-semibold text-gray-700 mb-4">Depreciation & Assets</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Depreciation Rate (%) *</label>
                  <input {...register('depreciationRate', { required: true })} type="number" className="form-input" placeholder="15" defaultValue="15" step="0.01" />
                  <span className="text-xs text-gray-500">e.g., 15% for WDV method</span>
                </div>
              </div>
            </div>

            <div className="border-b pb-6 mb-6">
              <h4 className="font-semibold text-gray-700 mb-4">Stock & Inventory</h4>
              <div className="bg-yellow-50 p-3 rounded mb-4">
                <p className="text-xs text-yellow-900">Opening stock is the pre-operative initial inventory. Closing stock for Year 1 onwards drives indirect profitability calculation.</p>
              </div>
              <div>
                <label className="form-label">Opening Stock (Pre-operative Initial) (₹)</label>
                <input {...register('openingStock')} type="number" className="form-input" placeholder="0" defaultValue="0" />
              </div>
              
              <div className="mt-4">
                <label className="form-label font-semibold mb-3 block">Closing Stock by Year (₹)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(y => (
                    <div key={y}>
                      <label className="text-xs text-gray-600">Year {y}</label>
                      <input {...register(`closingStockYear${y}`)} type="number" className="form-input text-sm" placeholder="0" defaultValue="0" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="form-label font-semibold mb-3 block">Stock Purchases by Year (₹)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(y => (
                    <div key={y}>
                      <label className="text-xs text-gray-600">Year {y}</label>
                      <input {...register(`stockPurchaseYear${y}`)} type="number" className="form-input text-sm" placeholder="0" defaultValue="0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-b pb-6 mb-6">
              <h4 className="font-semibold text-gray-700 mb-4">Trade Receivables by Year (₹)</h4>
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-xs text-gray-700">Outstanding goods sold on credit (for cash flow working capital analysis).</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(y => (
                  <div key={y}>
                    <label className="text-xs text-gray-600">Year {y}</label>
                    <input {...register(`tradeReceivablesYear${y}`)} type="number" className="form-input text-sm" placeholder="0" defaultValue="0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b pb-6 mb-6">
              <h4 className="font-semibold text-gray-700 mb-4">Proprietor Drawings by Year (₹)</h4>
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-xs text-gray-700">Personal withdrawals from business (affects cash flow).</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(y => (
                  <div key={y}>
                    <label className="text-xs text-gray-600">Year {y}</label>
                    <input {...register(`drawingsYear${y}`)} type="number" className="form-input text-sm" placeholder="0" defaultValue="0" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-4">Working Capital Settings</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Accounts Payable Days</label>
                  <input {...register('accountsPayableDays')} type="number" className="form-input" placeholder="30" defaultValue="30" />
                  <span className="text-xs text-gray-500">Average creditor payment period</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-700 mb-6">Step 4: Operational Monthly Expenses</h3>

            <div className="bg-blue-50 p-4 rounded mb-4">
              <p className="text-sm text-blue-900 font-semibold mb-1">Projection Expenses:</p>
              <p className="text-sm text-blue-900">Enter monthly operating costs. These will be used for 5-year profitability and DSCR projections, <span className="font-bold">not for the loan amount calculation.</span></p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Monthly Rent (₹)</label>
                <input {...register('monthlyRent')} type="number" className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">Monthly Salary (₹)</label>
                <input {...register('monthlySalary')} type="number" className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">Monthly Electricity (₹)</label>
                <input {...register('monthlyElectricity')} type="number" className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">Monthly Maintenance (₹)</label>
                <input {...register('monthlyMaintenance')} type="number" className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="form-label">Monthly Misc (₹)</label>
                <input {...register('monthlyMisc')} type="number" className="form-input" placeholder="0" />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-700 mb-6">Step 5: Financing & Loan Terms</h3>

            <div className="bg-blue-50 p-4 rounded mb-6">
              <p className="text-sm text-blue-900 font-semibold mb-2">Finance Info:</p>
              <p className="text-sm text-blue-900">The bank will provide the loan after deducting your Margin %. Term Loan and CC Loan will be calculated automatically.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Promoter Margin (%) *</label>
                <input {...register('marginPercent', { required: true })} type="number" className="form-input" placeholder="10" defaultValue="10" />
                <span className="text-xs text-gray-500">Your contribution to the project</span>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="font-semibold text-gray-700 mb-4">Term Loan Details (For Fixed Assets)</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Interest Rate (% p.a.) *</label>
                  <input {...register('interestRateAnnual', { required: true })} type="number" className="form-input" placeholder="8" defaultValue="8" />
                </div>
                <div>
                  <label className="form-label">Tenure (Months) *</label>
                  <input {...register('tenureMonths', { required: true })} type="number" className="form-input" placeholder="60" defaultValue="60" />
                </div>
                <div>
                  <label className="form-label">Moratorium (Months)</label>
                  <input {...register('moratoriumMonths')} type="number" className="form-input" placeholder="0" defaultValue="0" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <p className="font-semibold text-gray-700 mb-4">Working Capital (CC Loan) Details</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">CC Loan Interest Rate (% p.a.)</label>
                  <input {...register('wcInterestRate')} type="number" className="form-input" placeholder="9" defaultValue="9" />
                </div>
                <div>
                  <label className="form-label">Manual CC Loan Amount (Optional)</label>
                  <input {...register('manualWCLoanAmount')} type="number" className="form-input" placeholder="Leave empty for auto-calc" />
                  <span className="text-xs text-gray-500">Overrides margin-based calculation if provided</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <p className="font-semibold text-gray-700 mb-4">Other Settings</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Income Tax %</label>
                  <input {...register('taxPercent')} type="number" className="form-input" placeholder="0" defaultValue="0" />
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-700 mb-6">Step 6: Revenue Projection (Daily Revenue Model)</h3>

            <div className="bg-blue-50 p-4 rounded mb-4">
              <p className="text-sm text-blue-900">Enter daily revenue for Year 1. Adjust capacity utilization to scale profit up or down for each year.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Daily Revenue Year 1 (₹) *</label>
                <input {...register('dailyRevenueYear1', { required: true })} type="number" className="form-input" placeholder="Enter daily revenue" />
              </div>
              <div>
                <label className="form-label">Working Days Per Year *</label>
                <input {...register('workingDays', { required: true })} type="number" className="form-input" placeholder="250" defaultValue="250" />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 mt-4">
              {[1, 2, 3, 4, 5].map(y => (
                <div key={y}>
                  <label className="form-label text-xs">Year {y} Capacity %</label>
                  <input {...register(`capacityYear${y}`)} type="number" className="form-input text-sm" placeholder="100" />
                </div>
              ))}
            </div>

            <div>
              <label className="form-label">Annual Growth Rate (%) (Default: 5%)</label>
              <input {...register('revenueGrowthPercent')} type="number" className="form-input" placeholder="5" defaultValue="5" />
            </div>

            <div className="bg-green-50 p-4 rounded mt-4">
              <p className="text-sm text-green-800 font-semibold">Year 1 Projection:</p>
              <p className="text-sm text-green-700">
                Daily: {formData.dailyRevenueYear1 || 0} ₹ × {formData.workingDays || 250} days = 
                {formData.dailyRevenueYear1 && formData.workingDays 
                  ? ` ₹ ${(parseFloat(formData.dailyRevenueYear1) * parseFloat(formData.workingDays || 250)).toLocaleString()}` 
                  : ' (calculating...)'}
              </p>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-700 mb-6">Step 7: Expense Growth Rate</h3>

            <div className="bg-blue-50 p-4 rounded mb-4">
              <p className="text-sm text-blue-900">Expenses entered in Step 4 (Monthly Expenses) will be projected for 5 years with this growth rate.</p>
            </div>

            <div>
              <label className="form-label">Annual Expense Growth Rate (%) (Default: 3%)</label>
              <input {...register('expenseGrowthPercent')} type="number" className="form-input" placeholder="3" defaultValue="3" />
            </div>

            <div className="bg-gray-50 p-4 rounded mt-6 border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-3">Note:</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Monthly expenses from Step 4 will be used for projections</li>
                <li>✓ Each year's expenses = Year 1 expense × (1 + growth%)^(year-1)</li>
                <li>✓ Profitability will be calculated from Revenue - Expenses</li>
              </ul>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-700 mb-6">Step 8: Review & Submit</h3>

            <div className="bg-green-50 p-6 rounded border border-green-200">
              <h4 className="font-bold text-green-800 mb-4">Project Summary</h4>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Business Name</p>
                  <p className="font-semibold">{formData.businessName || 'Not entered'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Promoter Name</p>
                  <p className="font-semibold">{formData.promoterName || 'Not entered'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Fixed Capital</p>
                  <p className="font-semibold">
                    ₹ {totalAssets.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">WC Requirement (Initial Stock)</p>
                  <p className="font-semibold">
                    ₹ {parseFloat(formData.workingCapitalRequirement || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Daily Revenue (Year 1)</p>
                  <p className="font-semibold">₹ {parseFloat(formData.dailyRevenueYear1 || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Loan Tenure</p>
                  <p className="font-semibold">{formData.tenureMonths || 60} Months</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">ℹ️ Note:</span> After submission, the system will automatically calculate all financial parameters including revenue projections, profitability, DSCR, EMI schedule, and break-even analysis.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold mb-8">Create New Project</h1>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">Project created successfully!</div>}

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <div
                  key={s}
                  onClick={() => setStep(s)}
                  className={`flex-1 h-2 mx-1 rounded cursor-pointer ${s <= step ? 'bg-green-600' : 'bg-gray-300'}`}
                ></div>
              ))}
            </div>
            <p className="text-center text-gray-600">Step {step} of 8</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            <div className="flex justify-between mt-8 gap-4">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="btn btn-secondary flex-1 disabled:opacity-50"
              >
                Previous
              </button>

              {step < 8 ? (
                <button
                  type="button"
                  onClick={() => setStep(Math.min(8, step + 1))}
                  className="btn btn-primary flex-1"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
