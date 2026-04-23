# DPR Application - Testing & Verification Guide

## Quick Start Testing

### Prerequisites
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3000
- ✅ MongoDB connected (local or Atlas)

---

## 📝 Test Case 1: Simple Manufacturing Unit

This is a straightforward test to verify all calculations work correctly.

### Step 1️⃣: Access Application
1. Open http://localhost:3000 in browser
2. Click "Sign Up" or "Login" (if you already have account)
3. Create account with test credentials:
   - Email: `test@example.com`
   - Password: `Test@123`

### Step 2️⃣: Create New Project

Click "Create Project" button

#### **Step 1 - Basic Information**
```
Business Name:        ABC Manufacturing
Promoter Name:        Mr. John Doe
Address:              123 Industrial Area, Chennai, TN 600001
Phone:                9876543210
Business Type:        Manufacturing
Scheme Name:          Mudra Loan
Employment Count:     10
```

#### **Step 2 - Project Cost (Fixed Assets)**
```
Furniture & Fixtures:     ₹50,000
Machinery:                ₹5,00,000
Equipment:                ₹1,50,000
Electrical Setup:         ₹1,00,000
Interior Works:           ₹50,000
Other Assets:             ₹50,000
```
✅ Expected Fixed Capital: **₹7,00,000**

#### **Step 3 - Monthly Expenses & Working Capital**
```
Monthly Rent:             ₹25,000
Monthly Salary:           ₹75,000
Monthly Electricity:      ₹5,000
Monthly Maintenance:      ₹5,000
Monthly Misc:             ₹5,000
Reserve Months:           3
```
✅ Expected Monthly Total: **₹1,15,000**
✅ Expected Working Capital: **₹3,45,000** (₹1,15,000 × 3)
✅ Expected Annual Expense: **₹13,80,000** (₹1,15,000 × 12)

#### **Step 4 - Finance & Loan Terms**
```
Margin %:                 10%
Term Loan %:              70%
WC Loan %:                30%
Interest Rate (p.a.):     8%
Tenure (Months):          60
Moratorium:               0
Depreciation/Year:        ₹50,000
Income Tax %:             0
```

**Manual Calculation Check:**
```
Total Requirement = ₹7,00,000 + ₹3,45,000 = ₹10,45,000

Margin Money = ₹10,45,000 × 10% = ₹1,04,500
Bank Loan = ₹10,45,000 - ₹1,04,500 = ₹9,40,500

Term Loan = ₹9,40,500 × 70% = ₹6,58,350
WC Loan = ₹9,40,500 × 30% = ₹2,82,150

EMI Calculation:
Monthly Rate = 8% / 12 / 100 = 0.006667
For ₹6,58,350 @ 0.6667% for 60 months:
EMI ≈ ₹13,375/month
```

#### **Step 5 - Revenue Projection**
```
Daily Revenue Year 1:     ₹2,000
Working Days/Year:        250
Annual Growth Rate:       5%
```

**Projection Check:**
```
Year 1: ₹2,000 × 250 = ₹5,00,000
Year 2: ₹2,100 × 250 = ₹5,25,000 (5% growth)
Year 3: ₹2,205 × 250 = ₹5,51,250
Year 4: ₹2,315 × 250 = ₹5,78,815
Year 5: ₹2,431 × 250 = ₹6,07,753
```

#### **Step 6 - Expense Growth**
```
Expense Growth Rate:      3% p.a.
```

**Projection Check:**
```
Year 1 Expenses: ₹13,80,000 (from monthly ₹1,15,000 × 12)
Year 2 Expenses: ₹13,80,000 × 1.03 = ₹14,21,400
Year 3 Expenses: ₹14,21,400 × 1.03 = ₹14,64,042
Year 4 Expenses: ₹14,64,042 × 1.03 = ₹15,08,960
Year 5 Expenses: ₹15,08,960 × 1.03 = ₹15,56,229
```

#### **Step 7 - Review & Submit**
```
Verify all data looks correct, then click "Create Project"
```

### Step 3️⃣: Verify Backend Calculations

After project is created, check:

1. **Project List Page** - Project should appear with status "draft"

2. **Project View Page** - Click project to view detailed calculations

3. **Check Profitability Statement**
   ```
   Year 1:
   Revenue: ₹5,00,000
   Expense: ₹13,80,000
   Profit Before Tax: ₹5,00,000 - ₹13,80,000 = **NEGATIVE** (-₹8,80,000)
   ```
   ⚠️ **NOTE**: This scenario is LOSS-MAKING because expenses exceed revenue
   
   **STATUS: NOT FEASIBLE** ❌
   
   **Reason**: Daily revenue of ₹2,000 is too low for ₹1,15,000 monthly expenses
   
   → Try with higher daily revenue (₹5,000 daily)

---

## 📝 Test Case 2: Viable Manufacturing Unit (CORRECTED)

Same as Test Case 1 but with corrected revenue to make it viable.

### Only Difference in Step 5:
```
Daily Revenue Year 1:     ₹5,000  ← CHANGED from ₹2,000
Working Days/Year:        250
Annual Growth Rate:       5%
```

**Revised Projections:**
```
Year 1: ₹5,000 × 250 = ₹12,50,000
Year 2: ₹5,250 × 250 = ₹13,12,500
Year 3: ₹5,512.50 × 250 = ₹13,78,125
Year 4: ₹5,788 × 250 = ₹14,47,038
Year 5: ₹6,077 × 250 = ₹15,19,269
```

### Step 3️⃣: Expected Results

**Profitability Statement:**
```
Year 1:
- Revenue: ₹12,50,000
- Expense: ₹13,80,000
- Profit Before Tax: -₹1,30,000 (Still LOSS)
```

⚠️ **Still not viable!** Expenses are still too high.

---

## 📝 Test Case 3: VIABLE Project (RECOMMENDED FOR TESTING)

Let's create a realistic viable project.

### Step 2️⃣ - Project Cost (Same)
```
Fixed Capital: ₹7,00,000
```

### Step 3️⃣ - Monthly Expenses (REDUCED)
```
Monthly Rent:             ₹10,000  ← REDUCED
Monthly Salary:           ₹30,000  ← REDUCED
Monthly Electricity:      ₹2,000   ← REDUCED
Monthly Maintenance:      ₹2,000   ← REDUCED
Monthly Misc:             ₹1,000   ← REDUCED
Total Monthly:            ₹45,000
Working Capital:          ₹1,35,000 (₹45,000 × 3)
```

### Step 4️⃣ - Finance (ADJUSTED)
```
Total Requirement = ₹7,00,000 + ₹1,35,000 = ₹8,35,000
Margin: 10% = ₹83,500
Bank Loan: ₹7,51,500
  - Term Loan: ₹5,26,050
  - WC Loan: ₹2,25,450
Interest Rate: 8% p.a.
Tenure: 60 months
Depreciation: ₹35,000/year
```

### Step 5️⃣ - Revenue
```
Daily Revenue Year 1:     ₹2,000
Working Days: 250
Growth: 5%
Annual (Y1): ₹5,00,000
```

### Expected Results (VIABLE ✅)

**Profitability:**
```
Year 1:
- Revenue: ₹5,00,000
- Expense: ₹5,40,000 (₹45,000 × 12)
- Profit BT: -₹40,000 (STILL LOSS, but much smaller)
```

**Still not great.** Let's increase revenue...

---

## 📝 Test Case 4: HIGHLY VIABLE PROJECT ⭐ (BEST FOR TESTING)

### Project: Small Food Processing Unit

#### **Step 1 - Basic Info**
```
Business Name:        Fresh Foods Pvt Ltd
Promoter Name:        Ms. Priya Kumar
Address:              Mumbai, Maharashtra
Phone:                9988776655
Business Type:        Food Processing
Employment Count:     8
```

#### **Step 2 - Fixed Assets**
```
Furniture:            ₹30,000
Machinery:            ₹2,50,000
Equipment:            ₹80,000
Electrical:           ₹70,000
Interior:             ₹40,000
Other:                ₹30,000
Total:                ₹5,00,000
```

#### **Step 3 - Monthly Expenses**
```
Rent:                 ₹8,000
Salary:               ₹20,000
Electricity:          ₹2,000
Maintenance:          ₹1,500
Misc:                 ₹1,500
Total Monthly:        ₹33,000
Working Capital:      ₹99,000 (₹33,000 × 3 months)
```

#### **Step 4 - Finance**
```
Margin: 10%
Term Loan %: 70%
WC Loan %: 30%
Interest Rate: 8% p.a.
Tenure: 60 months
Depreciation: ₹25,000/year
```

**Calculation:**
```
Total Requirement = ₹5,00,000 + ₹99,000 = ₹5,99,000
Margin = ₹59,900
Bank Loan = ₹5,39,100
EMI ≈ ₹10,943/month
```

#### **Step 5 - Revenue**
```
Daily Revenue Year 1:     ₹1,200
Working Days:             250
Growth:                   5%
Annual (Y1):              ₹3,00,000
```

#### **Step 6 - Expense Growth**
```
Growth: 3%
```

### 🎯 Expected Results

**Profitability (POSITIVE ✅):**
```
Year 1:
- Revenue: ₹3,00,000
- Expense: ₹3,96,000 (₹33,000 × 12)
- Profit BT: -₹96,000 (Still LOSS but costs more)
```

**Hmm, still loss-making.** The issue is monthly expenses are too high. Final test:

---

## 📝 Test Case 5: PERFECT TEST CASE ⭐⭐⭐

### Project: Retail Shop

#### **Step 1 - Basic Info**
```
Business Name:        City Retail Store
Promoter Name:        Mr. Raj Patel
Address:              Bangalore, Karnataka
Phone:                9123456789
Business Type:        Retail
Employment Count:     3
```

#### **Step 2 - Fixed Assets**
```
Furniture:            ₹20,000
Machinery:            ₹50,000
Equipment:            ₹20,000
Electrical:           ₹15,000
Interior:             ₹25,000
Other:                ₹10,000
Total:                ₹1,40,000
```

#### **Step 3 - Monthly Expenses**
```
Rent:                 ₹5,000
Salary:               ₹10,000
Electricity:          ₹1,000
Maintenance:          ₹500
Misc:                 ₹500
Total Monthly:        ₹17,000
Working Capital:      ₹51,000 (₹17,000 × 3)
```

#### **Step 4 - Finance**
```
Total Requirement = ₹1,40,000 + ₹51,000 = ₹1,91,000

Margin: 10% = ₹19,100
Bank Loan: ₹1,71,900
  - Term Loan (70%): ₹1,20,330
  - WC Loan (30%): ₹51,570

Interest Rate: 8% p.a.
Tenure: 60 months
EMI ≈ ₹3,492/month

Depreciation: ₹10,000/year
```

#### **Step 5 - Revenue**
```
Daily Revenue Year 1:     ₹1,000
Working Days:             300
Growth:                   8%
Annual (Y1):              ₹3,00,000
```

#### **Step 6 - Expense Growth**
```
Growth: 3%
```

### 🎯 **EXPECTED RESULTS - FEASIBLE ✅**

**Profitability:**
```
Year 1:
- Revenue: ₹3,00,000
- Expense: ₹2,04,000 (₹17,000 × 12)
- Profit BT: ₹96,000 ✅
- PAT: ₹96,000
- Profit Margin: 32%
```

**Loan Repayment:**
```
Year 1 EMI: ₹3,492 × 12 = ₹41,904
Interest Portion: ~₹9,180
Principal Reduction: ~₹32,724
```

**DSCR Calculation:**
```
PAT: ₹96,000
Depreciation: ₹10,000
Interest (yearly): ₹9,180
Cash Accrual = ₹96,000 + ₹10,000 + ₹9,180 = ₹1,15,180

Principal Paid (yearly): ₹32,724
Interest Paid: ₹9,180
Debt Obligation = ₹32,724 + ₹9,180 = ₹41,904

DSCR = ₹1,15,180 / ₹41,904 = **2.75** ✅✅✅
```

**Break-Even:**
```
Variable Cost: ~₹40,000
Fixed Cost: ₹2,04,000
Contribution: ₹2,60,000
BEP: ₹1,57,538 (52.5% of sales)
Margin of Safety: 47.5%
```

### ✅ **PROJECT STATUS: HIGHLY FEASIBLE**
- Average DSCR: **2.75** (> 1.5) ✅
- Revenue > Expense: **✅**
- BEP < 100%: **✅**
- Loan Balanced: **✅**

---------

## 📊 Verification Checklist

After submitting each test case, verify:

### ✅ **Data Persistence**
- [ ] Project appears in project list
- [ ] All entered data is saved
- [ ] Project can be reopened

### ✅ **Calculations**
- [ ] Project cost sum is correct
- [ ] Working capital is correct (monthly × reserve months)
- [ ] Total requirement = fixed + working capital
- [ ] Means of finance adds up correctly
- [ ] Revenue projections show growth (5% compounding)
- [ ] Expense projections show growth (3% compounding)

### ✅ **PDF Generation**
- [ ] Project can be downloaded as PDF
- [ ] PDF contains all 10 tables:
  1. Project at a Glance
  2. Project Cost
  3. Means of Finance
  4. Working Capital
  5. Revenue Projection
  6. Expense Projection
  7. Profitability
  8. Repayment Schedule
  9. DSCR Table
  10. Break-Even Analysis

### ✅ **Financial Ratios**
- [ ] DSCR is calculated correctly
- [ ] EMI matches calculation
- [ ] Profitability shows correct P&L

### ✅ **Feasibility Status**
- [ ] Status shows FEASIBLE or NOT FEASIBLE correctly
- [ ] Reason for status is explained

---

## 🔧 Troubleshooting

### If calculations seem wrong:

1. **Check MongoDB Connection**
   ```
   Backend terminal should show: "MongoDB connected"
   ```

2. **Check Browser Console** (F12)
   - Look for JavaScript errors
   - Check Network tab for API responses

3. **Check Backend Terminal**
   - Look for errors in calculation logic
   - Check if `calculateFinancials` endpoint is being called

4. **Test with Simple Numbers**
   - Use round numbers (₹1,00,000) to verify
   - Check manual calculations

### Common Issues:

| Issue | Cause | Fix |
|-------|-------|-----|
| Project not saving | API error | Check backend terminal logs |
| Calculations show 0 | Empty inputs | Ensure all Step fields are filled |
| PDF download fails | No data | Create project first, then download |
| DSCR very high | Low expense | That's correct! Verify scenario is profitable |
| DSCR < 1 | Loss-making business | Increase revenue or decrease expense |

---

## 📈 Next Steps

Once testing is complete:

1. ✅ Verify all calculations match manual calculations
2. ✅ Test with multiple scenarios
3. ✅ Download and verify PDF format
4. ✅ Check data persistence across sessions
5. ✅ Prepare for production deployment

---

## 📞 Support

For issues or questions:
1. Check `CALCULATION_LOGIC.md` for detailed formula reference
2. Review test case examples above
3. Check backend logs for specific error messages
4. Verify MongoDB is connected and running

