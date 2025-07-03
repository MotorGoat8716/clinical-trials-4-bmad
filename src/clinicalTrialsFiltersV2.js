/**
 * ClinicalTrials.gov API v2 Filter System - UPDATED WITH LOCATION FIX
 * Based on actual working parameters from the API
 */

class ClinicalTrialsFiltersV2 {
  
  /**
   * Get supported filter categories for ClinicalTrials.gov API v2
   */
  static getFilterCategories() {
    return {
      // Working API parameters
      condition: {
        label: 'Condition or Disease',
        apiParam: 'query.cond',
        type: 'text',
        placeholder: 'e.g., breast cancer, diabetes, heart disease',
        description: 'Search for studies of a specific condition or disease',
        working: true
      },
      
      location: {
        label: 'Location',
        apiParam: 'query.locn',
        type: 'text',
        placeholder: 'e.g., Boston MA, New York, California',
        description: 'Search for studies in specific locations',
        working: true
      },
      
      intervention: {
        label: 'Intervention/Treatment',
        apiParam: 'query.intr',
        type: 'text',
        placeholder: 'e.g., chemotherapy, surgery, behavioral therapy',
        description: 'Search for studies testing a specific intervention or treatment',
        working: true
      },
      
      otherTerms: {
        label: 'Other Terms',
        apiParam: 'query.term',
        type: 'text',
        placeholder: 'e.g., keywords, study title words',
        description: 'Search for other keywords in study titles, descriptions, etc.',
        working: true
      },
      
      sponsor: {
        label: 'Sponsor/Collaborator',
        apiParam: 'query.spons',
        type: 'text',
        placeholder: 'e.g., National Cancer Institute, Pfizer',
        description: 'Search for studies by sponsor or collaborator name',
        working: true
      },
      
      studyIds: {
        label: 'Study IDs',
        apiParam: 'query.id',
        type: 'text',
        placeholder: 'e.g., NCT00000000, NCT00000001',
        description: 'Search for specific study NCT numbers (comma-separated)',
        working: true
      },
      
      phase: {
       label: 'Phase',
       apiParam: 'aggFilters',
       type: 'select',
       options: [
         { value: 'phase:0', label: 'Phase 0' },
         { value: 'phase:1', label: 'Phase 1' },
         { value: 'phase:2', label: 'Phase 2' },
         { value: 'phase:3', label: 'Phase 3' },
         { value: 'phase:4', label: 'Phase 4' }
       ],
       description: 'Search for studies in a specific clinical trial phase',
       working: true
     },

     studyStatus: {
       label: 'Study Status',
       apiParam: 'filter.overallStatus',
       type: 'select',
       options: [
         { value: 'RECRUITING', label: 'Recruiting' },
         { value: 'NOT_YET_RECRUITING', label: 'Not Yet Recruiting' },
         { value: 'ACTIVE_NOT_RECRUITING', label: 'Active, Not Recruiting' },
         { value: 'COMPLETED', label: 'Completed' },
         { value: 'ENROLLING_BY_INVITATION', label: 'Enrolling by Invitation' },
         { value: 'TERMINATED', label: 'Terminated' },
         { value: 'WITHDRAWN', label: 'Withdrawn' },
       ],
       description: 'Filter by study recruitment status',
       working: true
     },
      ageGroup: {
        label: 'Age Group',
        apiParam: 'aggFilters',
        type: 'select',
        options: [
          { value: 'ages:child', label: 'Child (birth-17)' },
          { value: 'ages:adult', label: 'Adult (18-64)' },
          { value: 'ages:older', label: 'Older Adult (65+)' }
        ],
        description: 'Filter by participant age group',
        working: true
      },

     sex: {
       label: 'Sex/Gender',
       apiParam: 'aggFilters',
       type: 'select',
       options: [
         { value: 'sex:m', label: 'Male' },
         { value: 'sex:f', label: 'Female' }
       ],
       description: 'Filter by participant sex',
       working: true
     },
     studyType: {
       label: 'Study Type',
       apiParam: 'query.type',
       type: 'select',
       options: [
         { value: 'INTERVENTIONAL', label: 'Interventional' },
         { value: 'OBSERVATIONAL', label: 'Observational' },
         { value: 'EXPANDED_ACCESS', label: 'Expanded Access' }
       ],
       description: 'Filter by the type of study',
       working: true
     },
     funderType: {
       label: 'Funder Type',
       apiParam: 'query.funder',
       type: 'select',
       options: [
         { value: 'NIH', label: 'U.S. National Institutes of Health (NIH)' },
         { value: 'FED', label: 'Other U.S. Federal Agency' },
         { value: 'INDIV', label: 'Individual' },
         { value: 'INDUSTRY', label: 'Industry' },
         { value: 'NETWORK', label: 'Network' },
         { value: 'OTHER', label: 'Other' },
         { value: 'UNKNOWN', label: 'Unknown' }
       ],
       description: 'Filter by the type of funding source',
       working: true
     },
      // Page size and pagination
      pageSize: {
        label: 'Results per page',
        apiParam: 'pageSize',
        type: 'select',
        options: [
          { value: 10, label: '10 results' },
          { value: 25, label: '25 results' },
          { value: 50, label: '50 results' },
          { value: 100, label: '100 results' },
          { value: 200, label: '200 results' }
        ],
        description: 'Number of results to return per page',
        working: true,
        default: 100
      },
      
    };
  }
  
  /**
   * Build API parameters from filter object - FIXED FOR API COMPATIBILITY
   */
  static buildApiParams(filters) {
    const params = {
      format: 'json',
      viewType: 'Card',
      limit: 100
    };
    
    const aggFilters = [];
  
    // Handle basic parameters
    if (filters.condition) {
      params.cond = filters.condition;  // Changed from 'query.cond'
    }
    
    if (filters.location) {
      params.locStr = filters.location;  // Changed from 'query.locn'
    }
    
    // Handle aggFilters
    if (filters.sex) {
      aggFilters.push(filters.sex);
    }
    
    if (filters.phase) {
      aggFilters.push(filters.phase);
    }
    
    if (filters.studyStatus) {
      aggFilters.push(filters.studyStatus);
    }
    
    if (filters.ageGroup) {
      aggFilters.push(filters.ageGroup);
    }
    
    // Combine all aggFilters
    if (aggFilters.length > 0) {
      params.aggFilters = aggFilters.join(',');
    }
    
    return params;
  }

  /**
   * Helper function to get full state name from abbreviation
   */
  static getFullStateName(abbr) {
    const stateMap = {
      'MA': 'Massachusetts',
      'NY': 'New York',
      'CA': 'California',
      'TX': 'Texas',
      'FL': 'Florida',
      'IL': 'Illinois',
      'PA': 'Pennsylvania',
      'OH': 'Ohio',
      'GA': 'Georgia',
      'NC': 'North Carolina',
      'MI': 'Michigan',
      'NJ': 'New Jersey',
      'VA': 'Virginia',
      'WA': 'Washington',
      'AZ': 'Arizona',
      'TN': 'Tennessee',
      'IN': 'Indiana',
      'MO': 'Missouri',
      'MD': 'Maryland',
      'WI': 'Wisconsin',
      'CO': 'Colorado',
      'MN': 'Minnesota',
      'SC': 'South Carolina',
      'AL': 'Alabama',
      'LA': 'Louisiana',
      'KY': 'Kentucky',
      'OR': 'Oregon',
      'OK': 'Oklahoma',
      'CT': 'Connecticut',
      'UT': 'Utah',
      'IA': 'Iowa',
      'NV': 'Nevada',
      'AR': 'Arkansas',
      'MS': 'Mississippi',
      'KS': 'Kansas',
      'NM': 'New Mexico',
      'NE': 'Nebraska',
      'ID': 'Idaho',
      'WV': 'West Virginia',
      'HI': 'Hawaii',
      'NH': 'New Hampshire',
      'ME': 'Maine',
      'MT': 'Montana',
      'RI': 'Rhode Island',
      'DE': 'Delaware',
      'SD': 'South Dakota',
      'ND': 'North Dakota',
      'AK': 'Alaska',
      'VT': 'Vermont',
      'WY': 'Wyoming'
    };
    
    return stateMap[abbr.toUpperCase()] || abbr;
  }
  
  /**
   * Get working filters only
   */
  static getWorkingFilters() {
    const all = this.getFilterCategories();
    const working = {};
    
    Object.keys(all).forEach(key => {
      if (all[key].working) {
        working[key] = all[key];
      }
    });
    
    return working;
  }
  
  /**
   * Validate filter values against known working filters
   */
  static validateFilters(filters) {
    const errors = [];
    const warnings = [];
    const categories = this.getFilterCategories();
    
    Object.keys(filters).forEach(filterKey => {
      const filterValue = filters[filterKey];
      const filterConfig = categories[filterKey];
      
      if (!filterConfig) {
        warnings.push(`Unknown filter: ${filterKey} (will attempt direct mapping)`);
        return;
      }
      
      // Basic type validation
      if (filterConfig.type === 'text' && typeof filterValue !== 'string') {
        errors.push(`Filter ${filterKey} expects text value, got ${typeof filterValue}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
  
  /**
   * Get user-friendly filter descriptions
   */
  static getFilterDescriptions() {
    const categories = this.getFilterCategories();
    const descriptions = {};
    
    Object.keys(categories).forEach(key => {
      descriptions[key] = {
        label: categories[key].label,
        description: categories[key].description,
        type: categories[key].type,
        working: categories[key].working || false
      };
    });
    
    return descriptions;
  }
  
  /**
   * Get basic filters for simple UI
   */
  static getBasicFilters() {
    return {
      condition: this.getFilterCategories().condition,
      location: this.getFilterCategories().location,
      intervention: this.getFilterCategories().intervention,
      otherTerms: this.getFilterCategories().otherTerms
    };
  }
  
  /**
   * Get advanced filters
   */
  static getAdvancedFilters() {
    return {
      sponsor: this.getFilterCategories().sponsor,
      studyIds: this.getFilterCategories().studyIds,
      pageSize: this.getFilterCategories().pageSize
    };
  }
  
  /**
   * Legacy parameter mapping for backward compatibility
   */
  static mapLegacyParams(params) {
    // This function is now deprecated as all params should be using the new system.
    // Returning a copy of params to avoid side effects.
    return { ...params };
  }
}

module.exports = ClinicalTrialsFiltersV2;