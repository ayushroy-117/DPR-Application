import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectService } from '../services/api'
import { Download, Edit2, ArrowLeft } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ProjectView() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('summary')
  const [recalculatingFinancials, setRecalculatingFinancials] = React.useState(false)
  const [calcError, setCalcError] = React.useState(null)

  React.useEffect(() => {
    loadProject()
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response = await projectService.getById(id)
      setProject(response.data)
    } catch (error) {
      console.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculateFinancials = async () => {
    setRecalculatingFinancials(true)
    setCalcError(null)
    try {
      console.log('🔵 Recalculating financials for project:', id)
      await projectService.calculateFinancials(id)
      console.log('✅ Financials recalculated successfully')
      // Reload the project to get updated financial data
      await loadProject()
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to calculate financials'
      console.error('❌ Recalculation failed:', errorMsg)
      setCalcError(errorMsg)
    } finally {
      setRecalculatingFinancials(false)
    }
  }

  const handleDownloadPDF = async () => {
    console.log('🔴 handleDownloadPDF called');
    try {
      console.log('Starting PDF download for project:', id);
      
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await fetch(`${API_BASE_URL}/pdf/generate/${id}`, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      console.log('Fetch response received:', response.status, response.statusText);
      console.log('Response type:', typeof response, response.constructor.name);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK. Body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      console.log('Attempting to read blob...');
      const blob = await response.blob();
      console.log('✅ Blob obtained:', blob, 'size:', blob?.size, 'type:', blob?.type);
      
      if (!blob || blob.size === 0) {
        console.error('❌ Blob is invalid:', blob);
        // Try to read as text to see what we got
        const text = await response.clone().text();
        console.error('Response as text:', text);
        throw new Error('Received empty or invalid response');
      }
      
      console.log('Creating object URL...');
      const url = URL.createObjectURL(blob);
      console.log('✅ Object URL created:', url);
      
      console.log('Creating and triggering download link...');
      const filename = `DPR_${project.basicInfo?.businessName || 'Report'}.pdf`;
      console.log('Download filename:', filename);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      console.log('✅ Link created and appended');
      
      link.click();
      console.log('✅✅✅ Download clicked successfully! ✅✅✅');
      
      setTimeout(() => {
        try {
          link.remove();
          URL.revokeObjectURL(url);
          console.log('✅ Cleanup completed');
        } catch (e) {
          console.warn('Cleanup warning:', e);
        }
      }, 100);
      
    } catch (error) {
      console.error('❌❌❌ ERROR in handleDownloadPDF ❌❌❌');
      console.error('Error object:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      alert(`PDF download failed: ${error?.message || 'Unknown error'}`);
    }
  }

  if (loading) {
    return (
      <div className="container py-12">
        <p className="text-center text-gray-600">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container py-12">
        <p className="text-center text-gray-600">Project not found</p>
      </div>
    )
  }

  const basic = project.basicInfo || {}
  const pCost = project.projectCost || {}
  const mof = project.meansOfFinance || {}
  const dscr = project.dscr || {}
  const profitability = project.profitability || []
  const revenue = project.revenueProjection?.yearlyProjections || []
  const expense = project.expenseProjection?.yearlyProjections || []
  const repaymentSchedule = project.termLoanDetails?.repaymentSchedule || []
  const cashFlow = project.cashFlow || []
  const balanceSheet = project.balanceSheet || []

  const chartData = revenue.map((r, i) => ({
    year: `Y${r.year}`,
    revenue: r.actualRevenue || 0,
    expense: expense[i]?.totalExpense || 0,
    profit: profitability[i]?.profitAfterTax || 0
  }))

  // Calculate total project cost from fixed assets
  const totalFixedAssets = pCost.fixedCapital || 
    (pCost.assets || []).reduce((sum, asset) => sum + (asset.total_budget || 0), 0)

  const assets = pCost.assets || []

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-200 rounded">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{basic.businessName || 'Unnamed Project'}</h1>
            <p className="text-gray-600">Promoter: {basic.promoterName || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadPDF}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download size={20} /> Download PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-300">
        {['summary', 'financials', 'charts', 'emi'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold border-b-2 ${
              activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-8">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Project Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Business Type</p>
                <p className="font-semibold">{basic.businessType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Scheme</p>
                <p className="font-semibold">{basic.schemeName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Phone</p>
                <p className="font-semibold">{basic.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Employees</p>
                <p className="font-semibold">{basic.employmentCount || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Project Cost & Finance Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Fixed Assets Breakdown</h3>
              <div className="max-h-64 overflow-y-auto pr-2">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="text-left pb-2">Asset Name</th>
                      <th className="text-right pb-2">Budget (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assets.length > 0 ? assets.map((asset, i) => (
                      <tr key={i}>
                        <td className="py-2">{asset.asset_name}</td>
                        <td className="py-2 text-right">₹{(asset.total_budget || 0).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="2" className="py-4 text-center text-gray-400">No assets listed</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t font-bold">
                    <tr>
                      <td className="pt-2">Total Fixed Capital</td>
                      <td className="pt-2 text-right text-green-600">₹{totalFixedAssets?.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">WC Requirement</span>
                  <span className="font-semibold">₹{project.projectCost?.workingCapitalRequirement?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg text-green-700">
                  <span>Total Project Req.</span>
                  <span>₹{project.totalProjectRequirement?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold mb-4">Means of Finance</h3>
              <ul className="space-y-4">
                <li className="flex justify-between p-3 bg-blue-50 rounded">
                  <div className="flex flex-col">
                    <span className="font-semibold">Term Loan</span>
                    <span className="text-xs text-blue-600">On Fixed Assets</span>
                  </div>
                  <span className="font-bold text-lg">₹{mof.termLoan?.toLocaleString() || 0}</span>
                </li>
                <li className="flex justify-between p-3 bg-indigo-50 rounded">
                  <div className="flex flex-col">
                    <span className="font-semibold">CC Loan</span>
                    <span className="text-xs text-indigo-600">On Working Capital</span>
                  </div>
                  <span className="font-bold text-lg">₹{mof.wcLoan?.toLocaleString() || 0}</span>
                </li>
                <li className="flex justify-between p-3 bg-purple-50 rounded">
                  <div className="flex flex-col">
                    <span className="font-semibold">Promoter Margin</span>
                    <span className="text-xs text-purple-600">{mof.marginPercent || 0}% of Total</span>
                  </div>
                  <span className="font-bold text-lg">₹{mof.marginMoney?.toLocaleString() || 0}</span>
                </li>
                <li className="flex justify-between font-bold text-green-600 border-t pt-4 px-3">
                  <span className="text-xl">Total Funding</span>
                  <span className="text-xl">₹{project.totalProjectRequirement?.toLocaleString() || 0}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Ratios */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Financial Ratios</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-gray-600 text-sm mb-1">DSCR</p>
                <p className="text-3xl font-bold text-green-600">{dscr.averageDSCR?.toFixed(2) || 'N/A'}</p>
                <p className="text-xs text-gray-600 mt-2">Debt Service Coverage</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded">
                <p className="text-gray-600 text-sm mb-1">Total Requirement</p>
                <p className="text-3xl font-bold text-blue-600">₹{(project.totalProjectRequirement?.toFixed(0) / 100000).toFixed(1)}L</p>
                <p className="text-xs text-gray-600 mt-2">Project Cost</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <p className="text-gray-600 text-sm mb-1">Promoter Margin %</p>
                <p className="text-3xl font-bold text-purple-600">{mof.marginPercent?.toFixed(1) || 'N/A'}%</p>
                <p className="text-xs text-gray-600 mt-2">of Total Project Cost</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financials Tab */}
      {activeTab === 'financials' && (
        <div className="space-y-12">
          {/* Recalculate Button & Error Display */}
          <div className="card bg-blue-50 border-l-4 border-blue-600">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-blue-900 mb-2">Financial Calculations</h2>
                <p className="text-sm text-blue-700">Click "Recalculate" to regenerate financial statements if data is missing or outdated.</p>
                {calcError && (
                  <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-600 rounded">
                    <p className="text-red-800 font-semibold">⚠️ Calculation Error:</p>
                    <p className="text-red-700 text-sm">{calcError}</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleRecalculateFinancials}
                disabled={recalculatingFinancials}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {recalculatingFinancials ? (
                  <>
                    <span className="inline-block animate-spin">⟳</span>
                    Calculating...
                  </>
                ) : (
                  <>
                    🔄 Recalculate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profitability */}
          <div className="card overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4">Profitability Statement (5 Years)</h2>
            <table className="w-full text-sm">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-right">Expenses</th>
                  <th className="px-4 py-2 text-right">Net Profit</th>
                  <th className="px-4 py-2 text-right">Profit Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {profitability.length > 0 ? profitability.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">Year {p.year}</td>
                    <td className="px-4 py-3 text-right">₹{(p.salesRevenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">₹{(p.totalDirectCost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">₹{(p.profitAfterTax || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{(p.netProfitRatio || 0).toFixed(2)}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center text-gray-500">No profitability data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cash Flow */}
          <div className="card overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4">Cash Flow Statement</h2>
            <table className="w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-right">Total Inflow</th>
                  <th className="px-4 py-2 text-right">Total Outflow</th>
                  <th className="px-4 py-2 text-right">Net Cash Flow</th>
                  <th className="px-4 py-2 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cashFlow.length > 0 ? cashFlow.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">Year {c.year}</td>
                    <td className="px-4 py-3 text-right">₹{(c.inflow?.totalInflow || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">₹{(c.outflow?.totalOutflow || 0).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-bold ${c.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(c.netCashFlow || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">₹{(c.closingBalance || 0).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center text-gray-500">No cash flow data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Balance Sheet */}
          <div className="card overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4">Balance Sheet Projection</h2>
            <table className="w-full text-sm">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-right">Net Fixed Assets</th>
                  <th className="px-4 py-2 text-right">Cash & Bank</th>
                  <th className="px-4 py-2 text-right">Total Assets</th>
                  <th className="px-4 py-2 text-right">Retained Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {balanceSheet.length > 0 ? balanceSheet.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">Year {b.year}</td>
                    <td className="px-4 py-3 text-right">₹{(b.assets?.nonCurrentAssets?.fixedAssets || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">₹{(b.assets?.currentAssets?.cash || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold">₹{(b.assets?.totalAssets || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-indigo-600">₹{(b.liabilities?.shareholderFunds?.reserveSurplus || 0).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center text-gray-500">No balance sheet data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Revenue vs Expenses</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" />
                <Bar dataKey="expense" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Profit Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* EMI Tab */}
      {activeTab === 'emi' && (
        <div className="card overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">EMI Schedule (First 12 Months)</h2>
          <table className="w-full text-sm">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-4 py-2 text-center">Month</th>
                <th className="px-4 py-2 text-right">Principal</th>
                <th className="px-4 py-2 text-right">Interest</th>
                <th className="px-4 py-2 text-right">EMI</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {repaymentSchedule.length > 0 ? repaymentSchedule.slice(0, 12).map((emi, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">{emi.month}</td>
                  <td className="px-4 py-3 text-right">₹{(emi.principalPaid || 0).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">₹{(emi.interestPaid || 0).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right font-semibold">₹{(emi.emiAmount || 0).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">₹{(emi.outstandingBalance || 0).toFixed(0)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-center text-gray-500">No EMI data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
