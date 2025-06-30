# Clinical Trials Resource Hub - Development Context

**Project Type:** Patient-Centric ClinicalTrials.gov Wrapper  
**Architecture:** Real-time API Integration with Full Pagination Support  
**Current Status:** MVP Implementation with Complete Data Retrieval  
**Last Updated:** December 2024

## Project Overview

This is a clinical trials search platform that serves as a **patient-centric wrapper** around ClinicalTrials.gov. The core philosophy is to maintain 100% data parity with the authoritative source while adding patient-friendly enhancements including AI-powered summaries, comprehensive filtering, and accurate total count reporting.

### Key Strategic Principles

1. **Source Authority**: ClinicalTrials.gov remains the single source of truth
2. **Complete Data Parity**: All searches must match ClinicalTrials.gov results exactly
3. **Patient Enhancement**: Layer on accessibility features without modifying source data
4. **Complete Data Access**: Full pagination support to retrieve all available results
5. **Cost Control**: AI summaries only for small result sets (≤10 trials)

## Current Implementation Status

### ✅ Completed Features

**Backend Infrastructure:**
- Real-time ClinicalTrials.gov API v2 integration
- Comprehensive filter system with 12+ working parameters
- Intelligent caching with 5-minute TTL
- Full pagination system for complete data retrieval
- AI-powered plain language summaries for small result sets
- PostgreSQL integration for user data and caching

**Frontend Features:**
- React-based search interface with full filter support
- Prominent total count display below search filters
- Comprehensive filter options: condition, location, phase, status, age, sex, study type, funder type
- Responsive design with professional styling
- AI summary integration for detailed results

**API Integration:**
- Parameter mapping: Uses correct `query.cond` + `query.locn` instead of combined `query.term`
- Full pagination with nextPageToken handling for complete result sets
- Support for retrieving up to 10 pages (10,000 studies) with safety limits
- Comprehensive error handling and fallback logic

### 🎯 Current Architecture

**Search Strategy (Full Data Retrieval):**
```
All Searches:
├── Retrieve complete trial data using pagination
├── Fetch up to 10 pages (10,000 studies max) for safety
├── Display all fetched trials in UI
├── Show accurate total count prominently
├── Generate AI summaries only for small result sets (≤10 trials)
└── Maintain performance through intelligent caching

Pagination Process:
├── Start with pageSize=1000 and countTotal=true
├── Follow nextPageToken for additional pages
├── Safety limit: maximum 10 pages to prevent infinite loops
└── Cache complete results for 5-minute TTL
```

**API Parameter Mapping:**
```javascript
// Frontend Input → Backend Processing → ClinicalTrials.gov API
{
  condition: "lung cancer",        // → query.cond: "lung cancer"
  location: "los angeles, ca",     // → query.locn: "los angeles" (cleaned)
  phase: "phase:2",               // → aggFilters: "phase:2" 
  studyStatus: "RECRUITING"       // → query.status: "RECRUITING"
}
```

## Technical Implementation Details

### Core Files Structure

**Backend (Node.js/Express):**
- `src/index.js` - Main API server with search endpoints
- `src/clinicalTrialsApiWrapper.js` - ClinicalTrials.gov API integration
- `src/clinicalTrialsFiltersV2.js` - Comprehensive filter system
- `src/ava.js` - AI summary generation service

**Frontend (React):**
- `frontend/src/App.js` - Main UI with comprehensive search interface
- `frontend/src/App.css` - Styling including prominent total count display

### Search Endpoint Logic

**Primary Search Flow:**
1. User enters search criteria in comprehensive filter interface
2. Backend validates and maps parameters to ClinicalTrials.gov API format
3. Paginated API calls starting with `pageSize=1000` and `countTotal=true`
4. Follow nextPageToken to retrieve additional pages (up to 10 pages max)
5. Return complete trial data for all fetched results
6. Generate AI summaries only for small result sets (≤10 trials)
7. Frontend displays all trials with prominent total count

**Performance Optimizations:**
- Intelligent caching prevents redundant API calls
- Location cleaning: "los angeles, ca" → "los angeles" for better API compatibility
- Full pagination with safety limits (10 pages max) to prevent infinite loops
- Complete data retrieval while maintaining reasonable response times

### Filter System Coverage

**Working Filters (12+ parameters):**
- **Basic**: condition, location, intervention, otherTerms
- **Study Details**: phase, studyStatus, studyType, ageGroup, sex
- **Administrative**: sponsor, studyIds, funderType
- **Advanced**: Multiple aggregation filters and custom parameters

## Development Context & Recent Work

### Recent Major Achievements

1. **Accurate Total Count Implementation**: Successfully resolved the core issue where searches showed only 100 results instead of true totals (e.g., 806 for "lung cancer" + "los angeles")

2. **Parameter Mapping Fix**: Corrected API calls to use separate `query.cond` and `query.locn` parameters instead of combined `query.term`, matching ClinicalTrials.gov website behavior

3. **Full Data Access Implementation**: Replaced count-only approach with complete pagination system, allowing users to access all available trial data while maintaining performance through caching

4. **Comprehensive Filter System**: Added support for phase, study status, age groups, sex, study type, and funder type filters

### Current Known Issues & Solutions

**Issue**: Server restart required for code changes  
**Solution**: New wrapper logic is working when tested directly but requires Node.js server restart to take effect

**Verification**: Direct wrapper test confirms 806 studies found for "lung cancer" + "los angeles" (matches expected ~786 from ClinicalTrials.gov website)

## Development Guidelines

### When Making Changes

1. **Test Wrapper Directly**: Use `test-wrapper-directly.js` to verify wrapper logic before testing through server
2. **Server Restart**: Remember that Node.js server must be restarted after code changes
3. **Parameter Validation**: Always test with direct ClinicalTrials.gov API calls to verify parameter format
4. **Cache Management**: Clear cache when testing significant changes
5. **Total Count Priority**: Ensure accurate total counts are displayed prominently in UI

### Testing Strategy

**Verification Queries**:
- "lung cancer" + "los angeles, ca" → Should show ~806 results with all trials displayed
- "cancer" (broad search) → Should show 150,000+ total count with up to 10,000 trials fetched
- Specific NCT ID → Should show detailed trial with AI summary

**Test Files Available**:
- `test-wrapper-directly.js` - Direct wrapper testing (bypasses server)
- `test-parameter-mapping-fix.js` - Parameter format verification
- `test-final-806-fix.js` - End-to-end accuracy testing

### Code Quality Standards

- **No Comments**: Code should be self-documenting unless explicitly requested
- **Security**: Never expose API keys or sensitive data
- **Performance**: Maintain reasonable response times through pagination limits and caching
- **Data Integrity**: Never modify ClinicalTrials.gov source data
- **User Experience**: Maintain prominent total count display below search filters

## Future Development Priorities

1. **Server Restart Resolution**: Investigate why code changes require server restart
2. **Advanced Filters**: Add remaining ClinicalTrials.gov parameters
3. **Enhanced AI Features**: Expand summarization capabilities
4. **User Management**: Implement saved searches and trial tracking
5. **Mobile Optimization**: Enhance responsive design

## Project Success Metrics

- **Data Accuracy**: 100% parity with ClinicalTrials.gov search results
- **Performance**: Reasonable response times for paginated data retrieval
- **User Experience**: Prominent total counts displayed immediately after search
- **Cost Control**: AI summaries limited to ≤10 result searches
- **Scalability**: Handle 150,000+ result searches efficiently

## Important Notes for Claude

- This is a healthcare information platform - prioritize accuracy and user safety
- Always maintain data integrity with ClinicalTrials.gov as the authoritative source
- The full pagination approach ensures complete data access while maintaining safety limits
- Prominent total count display is a key user experience requirement
- Parameter mapping format directly impacts search accuracy - verify with direct API tests

This platform successfully bridges the gap between ClinicalTrials.gov's comprehensive data and patient accessibility needs while maintaining complete data integrity and optimal performance.