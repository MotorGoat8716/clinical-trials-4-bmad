/**
 * Comprehensive ClinicalTrials.gov API Filter System
 * Maps user-friendly filter options to official API parameters
 */

class ClinicalTrialsFilters {
  
  /**
   * Get all available filter categories and their options
   */
  static getFilterCategories() {
    return {
      // Basic search filters
      condition: {
        label: 'Condition or Disease',
        apiParam: 'query.cond',
        type: 'text',
        placeholder: 'e.g., breast cancer, diabetes, heart disease',
        description: 'Search for studies of a specific condition or disease'
      },
      
      intervention: {
        label: 'Intervention/Treatment',
        apiParam: 'query.intr',
        type: 'text',
        placeholder: 'e.g., chemotherapy, surgery, behavioral therapy',
        description: 'Search for studies testing a specific intervention or treatment'
      },
      
      otherTerms: {
        label: 'Other Terms',
        apiParam: 'query.term',
        type: 'text',
        placeholder: 'e.g., keywords, study title words',
        description: 'Search for other keywords in study titles, descriptions, etc.'
      },
      
      // Location filters
      location: {
        label: 'Location',
        apiParam: 'query.locn',
        type: 'text',
        placeholder: 'e.g., Boston MA, New York, California',
        description: 'Search for studies in specific locations'
      },
      
      country: {
        label: 'Country',
        apiParam: 'query.country',
        type: 'select',
        options: [
          { value: 'US', label: 'United States' },
          { value: 'CA', label: 'Canada' },
          { value: 'GB', label: 'United Kingdom' },
          { value: 'AU', label: 'Australia' },
          { value: 'DE', label: 'Germany' },
          { value: 'FR', label: 'France' },
          { value: 'JP', label: 'Japan' },
          { value: 'CN', label: 'China' },
          // Add more countries as needed
        ],
        description: 'Filter studies by country'
      },
      
      // Study characteristics
      studyType: {
        label: 'Study Type',
        apiParam: 'query.type',
        type: 'select',
        options: [
          { value: '', label: 'All Study Types' },
          { value: 'Intr', label: 'Interventional Studies' },
          { value: 'Obsv', label: 'Observational Studies' },
          { value: 'PtRg', label: 'Patient Registries' },
          { value: 'Expn', label: 'Expanded Access Studies' }
        ],
        description: 'Type of clinical study'
      },
      
      studyStatus: {
        label: 'Study Status',
        apiParam: 'query.status',
        type: 'multiselect',
        options: [
          { value: 'RECRUITING', label: 'Recruiting' },
          { value: 'NOT_YET_RECRUITING', label: 'Not yet recruiting' },
          { value: 'ENROLLING_BY_INVITATION', label: 'Enrolling by invitation' },
          { value: 'ACTIVE_NOT_RECRUITING', label: 'Active, not recruiting' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'SUSPENDED', label: 'Suspended' },
          { value: 'TERMINATED', label: 'Terminated' },
          { value: 'WITHDRAWN', label: 'Withdrawn' }
        ],
        description: 'Current recruitment status of the study'
      },
      
      phase: {
        label: 'Study Phase',
        apiParam: 'query.phase',
        type: 'multiselect',
        options: [
          { value: 'EARLY_PHASE1', label: 'Early Phase 1' },
          { value: 'PHASE1', label: 'Phase 1' },
          { value: 'PHASE1_PHASE2', label: 'Phase 1/Phase 2' },
          { value: 'PHASE2', label: 'Phase 2' },
          { value: 'PHASE2_PHASE3', label: 'Phase 2/Phase 3' },
          { value: 'PHASE3', label: 'Phase 3' },
          { value: 'PHASE4', label: 'Phase 4' },
          { value: 'NA', label: 'Not Applicable' }
        ],
        description: 'Phase of clinical trial (mainly for drug studies)'
      },
      
      // Participant characteristics
      age: {
        label: 'Age Groups',
        apiParam: 'query.age',
        type: 'multiselect',
        options: [
          { value: 'CHILD', label: 'Child (birth-17)' },
          { value: 'ADULT', label: 'Adult (18-64)' },
          { value: 'OLDER_ADULT', label: 'Older Adult (65+)' }
        ],
        description: 'Age groups eligible for the study'
      },
      
      sex: {
        label: 'Sex',
        apiParam: 'query.sex',
        type: 'select',
        options: [
          { value: '', label: 'All' },
          { value: 'ALL', label: 'All' },
          { value: 'sex:f', label: 'Female' },
          { value: 'sex:m', label: 'Male' }
        ],
        description: 'Sex of participants eligible for the study'
      },
      
      healthyVolunteers: {
        label: 'Healthy Volunteers',
        apiParam: 'query.healthy',
        type: 'select',
        options: [
          { value: '', label: 'All Studies' },
          { value: 'Y', label: 'Studies accepting healthy volunteers' },
          { value: 'N', label: 'Studies not accepting healthy volunteers' }
        ],
        description: 'Whether study accepts healthy volunteers'
      },
      
      // Funding and sponsorship
      funderType: {
        label: 'Funder Type',
        apiParam: 'query.fundType',
        type: 'multiselect',
        options: [
          { value: 'FED', label: 'Federal (NIH, CDC, etc.)' },
          { value: 'INDIV', label: 'Individual' },
          { value: 'INDUSTRY', label: 'Industry' },
          { value: 'NETWORK', label: 'Network' },
          { value: 'NIH', label: 'NIH' },
          { value: 'OTHER', label: 'Other' },
          { value: 'OTHER_GOV', label: 'Other U.S. Federal agency' },
          { value: 'UNKNOWN', label: 'Unknown' }
        ],
        description: 'Type of organization funding the study'
      },
      
      // Study results
      studyResults: {
        label: 'Study Results',
        apiParam: 'query.resultsFirst',
        type: 'select',
        options: [
          { value: '', label: 'All Studies' },
          { value: 'Y', label: 'Studies with results' },
          { value: 'N', label: 'Studies without results' }
        ],
        description: 'Whether study has posted results'
      },
      
      // Advanced filters
      studyIds: {
        label: 'Study IDs',
        apiParam: 'query.id',
        type: 'text',
        placeholder: 'e.g., NCT00000000, NCT00000001',
        description: 'Search for specific study NCT numbers (comma-separated)'
      },
      
      sponsor: {
        label: 'Sponsor/Collaborator',
        apiParam: 'query.spons',
        type: 'text',
        placeholder: 'e.g., National Cancer Institute, Pfizer',
        description: 'Search for studies by sponsor or collaborator name'
      },
      
      // Date filters
      firstPosted: {
        label: 'First Posted Date',
        apiParam: 'query.firstPost',
        type: 'daterange',
        description: 'Date range when study was first posted'
      },
      
      lastUpdate: {
        label: 'Last Update Posted Date',
        apiParam: 'query.lastPost',
        type: 'daterange',
        description: 'Date range when study was last updated'
      },
      
      studyStart: {
        label: 'Study Start Date',
        apiParam: 'query.studyStart',
        type: 'daterange',
        description: 'Date range when study started or will start'
      },
      
      primaryCompletion: {
        label: 'Primary Completion Date',
        apiParam: 'query.primaryComp',
        type: 'daterange',
        description: 'Date range when study primary endpoint was/will be completed'
      },
      
      completion: {
        label: 'Study Completion Date',
        apiParam: 'query.completion',
        type: 'daterange',
        description: 'Date range when study was/will be completed'
      }
    };
  }
  
  /**
   * Build API parameters from filter object
   */
  static buildApiParams(filters) {
    const params = {};
    const filterCategories = this.getFilterCategories();
    
    // Set default page size
    params.pageSize = filters.pageSize || 100;
    
    // Process each filter
    Object.keys(filters).forEach(filterKey => {
      const filterValue = filters[filterKey];
      
      // Skip empty values
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return;
      }
      
      const filterConfig = filterCategories[filterKey];
      if (!filterConfig) {
        return;
      }
      
      const apiParam = filterConfig.apiParam;
      
      // Handle different filter types
      switch (filterConfig.type) {
        case 'text':
          if (typeof filterValue === 'string' && filterValue.trim()) {
            params[apiParam] = filterValue.trim();
          }
          break;
          
        case 'select':
          if (typeof filterValue === 'string' && filterValue.trim()) {
            params[apiParam] = filterValue.trim();
          }
          break;
          
        case 'multiselect':
          if (Array.isArray(filterValue) && filterValue.length > 0) {
            params[apiParam] = filterValue.join(',');
          } else if (typeof filterValue === 'string' && filterValue.trim()) {
            params[apiParam] = filterValue.trim();
          }
          break;
          
        case 'daterange':
          if (typeof filterValue === 'object') {
            if (filterValue.from) {
              params[`${apiParam}From`] = filterValue.from;
            }
            if (filterValue.to) {
              params[`${apiParam}To`] = filterValue.to;
            }
          }
          break;
      }
    });
    
    return params;
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
        type: categories[key].type
      };
    });
    
    return descriptions;
  }
  
  /**
   * Validate filter values
   */
  static validateFilters(filters) {
    const errors = [];
    const categories = this.getFilterCategories();
    
    Object.keys(filters).forEach(filterKey => {
      const filterValue = filters[filterKey];
      const filterConfig = categories[filterKey];
      
      if (!filterConfig) {
        errors.push(`Unknown filter: ${filterKey}`);
        return;
      }
      
      // Validate based on type
      switch (filterConfig.type) {
        case 'select':
          if (filterValue && filterConfig.options) {
            const validValues = filterConfig.options.map(opt => opt.value);
            if (!validValues.includes(filterValue)) {
              errors.push(`Invalid value for ${filterKey}: ${filterValue}`);
            }
          }
          break;
          
        case 'multiselect':
          if (Array.isArray(filterValue) && filterConfig.options) {
            const validValues = filterConfig.options.map(opt => opt.value);
            const invalidValues = filterValue.filter(val => !validValues.includes(val));
            if (invalidValues.length > 0) {
              errors.push(`Invalid values for ${filterKey}: ${invalidValues.join(', ')}`);
            }
          }
          break;
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * Get simplified filter options for basic UI
   */
  static getBasicFilters() {
    return {
      condition: this.getFilterCategories().condition,
      location: this.getFilterCategories().location,
      studyStatus: this.getFilterCategories().studyStatus,
      phase: this.getFilterCategories().phase,
      age: this.getFilterCategories().age,
      sex: this.getFilterCategories().sex
    };
  }
  
  /**
   * Get advanced filter options for comprehensive UI
   */
  static getAdvancedFilters() {
    const all = this.getFilterCategories();
    const basic = this.getBasicFilters();
    const advanced = {};
    
    Object.keys(all).forEach(key => {
      if (!basic[key]) {
        advanced[key] = all[key];
      }
    });
    
    return advanced;
  }
}

module.exports = ClinicalTrialsFilters;