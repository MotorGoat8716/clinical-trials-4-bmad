# Clinical Trials Search Accuracy Validation Guide

## 🚨 Critical Discrepancy Identified

**Issue**: Our app's 4 results for "obesity + orlando + phase 4" don't match ClinicalTrials.gov web results.

**Our Results**: NCT06571383, NCT01987427, NCT02638129, NCT04049786
**ClinicalTrials.gov Web**: 4 different trials (as reported by user)

## 🔍 Analysis Results

### Data Source Comparison
| Source | Count | Behavior |
|--------|-------|----------|
| Our App | 4 trials | Too restrictive on location |
| ClinicalTrials.gov API | 50 trials | Too broad on condition |
| ClinicalTrials.gov Web | 4 trials | Most precise (target behavior) |

### Root Cause
1. **Location Filtering**: Our search for "orlando" may be too strict
2. **Condition Matching**: May include/exclude trials differently than CT.gov
3. **Data Synchronization**: Our database may have different trials than CT.gov
4. **Search Algorithm**: Different ranking/filtering logic

## 🎯 Validation Process

### Step 1: Get Authoritative Trial List
**Action Required**: Manually extract the exact 4 NCT numbers from:
```
https://clinicaltrials.gov/search?locStr=Orlando,%20Florida&country=United%20States&state=Florida&cond=Obesity&city=Orlando&aggFilters=phase:4
```

### Step 2: Compare Against Our Database
Use this script to check if we have those trials:
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ /* db config */ });

async function checkTrials() {
  const ctGovTrials = ['NCT_ID_1', 'NCT_ID_2', 'NCT_ID_3', 'NCT_ID_4']; // Replace with actual IDs
  
  for (const trialId of ctGovTrials) {
    const result = await pool.query('SELECT * FROM \"ClinicalTrials\" WHERE \"TrialID\" = \$1', [trialId]);
    if (result.rows.length > 0) {
      console.log('✅', trialId, 'Found in our database');
    } else {
      console.log('❌', trialId, 'MISSING from our database');
    }
  }
  
  await pool.end();
}
checkTrials();
"
```

### Step 3: Fix Data Issues
Based on Step 2 results:

**If trials are missing from our DB:**
```bash
# Re-seed with more comprehensive data
node db/fetch-and-seed.js --condition obesity --location "orlando florida" --pageSize 1000
```

**If trials exist but search logic is wrong:**
- Update search algorithm in `src/index.js`
- Test with: `curl "localhost:3000/api/trials/search?condition=obesity&location=orlando&phase=4"`

### Step 4: Implement Precise Search Logic
```javascript
// Example improved search logic
if (locationTerm === 'orlando') {
  // Match ClinicalTrials.gov's city-specific filtering
  whereClauses.push(`(
    LOWER("Location") LIKE '%orlando, florida%'
    OR (LOWER("Location") LIKE '%orlando%' AND LOWER("Location") LIKE '%fl%')
    OR (LOWER("Location") LIKE '%orlando%' AND LOWER("Location") LIKE '%florida%')
  )`);
}
```

## 🔧 Testing Protocol

### Automated Validation
```bash
# Test our current implementation
node compare-results.js

# Test with specific parameters
curl "localhost:3000/api/trials/search?condition=obesity&location=orlando&phase=4"
```

### Manual Validation Steps
1. **Get CT.gov web results** → List exact NCT IDs
2. **Check our database** → Verify all trials exist
3. **Test search logic** → Ensure correct filtering
4. **Validate response** → Match count and IDs exactly

## 📋 Quick Diagnostic Commands

```bash
# Check Orlando trials in our database
node -e "/* Check Orlando obesity phase 4 trials */"

# Test location matching variations
curl "localhost:3000/api/trials/search?location=orlando"
curl "localhost:3000/api/trials/search?location=orlando%20florida"

# Compare with broader search
curl "localhost:3000/api/trials/search?condition=obesity&phase=4"
```

## 🎯 Success Criteria

✅ **Perfect Match**: Our 4 results = ClinicalTrials.gov web 4 results
✅ **Same Trial IDs**: Exact NCT number correspondence
✅ **Consistent Logic**: Works for other condition/location combinations
✅ **Performance**: <100ms response time

## ⚠️ Known Limitations

1. **Data Freshness**: Our DB may not have latest trials
2. **Geographic Parsing**: "Orlando" vs "Orlando, Florida" handling
3. **Condition Matching**: Primary vs secondary conditions
4. **Phase Classification**: Exact phase number matching

## 🚀 Next Steps

1. **Immediate**: Get exact CT.gov web results (manual)
2. **Short-term**: Fix search logic and data gaps
3. **Long-term**: Implement automated CT.gov synchronization
4. **Validation**: Create comprehensive test suite

This guide provides the framework to achieve 100% accuracy with ClinicalTrials.gov web interface results.