/**
 * ClinicalTrials.gov API v2 Filter System
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
      }
    };
  }
  
  /**
   * Build API parameters from filter object
   */
  static buildApiParams(filters) {
    const params = {
      format: 'json'
    };
    const filterCategories = this.getFilterCategories();
    
    // Set default page size
    if (!filters.pageSize) {
      params.pageSize = 100;
    }
    
    // Process each filter
    Object.keys(filters).forEach(filterKey => {
      const filterValue = filters[filterKey];
      
      // Skip empty values
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return;
      }
      
      const filterConfig = filterCategories[filterKey];
      if (!filterConfig) {
        // For unknown filters, try direct mapping for backward compatibility
        console.warn(`Unknown filter: ${filterKey}, trying direct mapping`);
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
          } else if (typeof filterValue === 'number') {
            params[apiParam] = filterValue;
          }
          break;
          
        default:
          // Default to string handling
          if (filterValue) {
            params[apiParam] = filterValue;
          }
      }
    });
    
    return params;
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
    const mapped = { ...params };
    
    // Map old parameter names to new ones
    if (mapped.status && !mapped.studyStatus) {
      console.warn('Legacy parameter "status" detected, but not supported in API v2');
      delete mapped.status;
    }
    
    if (mapped.phase) {
      console.warn('Legacy parameter "phase" detected, but not supported in API v2');
      delete mapped.phase;
    }
    
    if (mapped.age) {
      console.warn('Legacy parameter "age" detected, but not supported in API v2');
      delete mapped.age;
    }
    
    if (mapped.sex) {
      console.warn('Legacy parameter "sex" detected, but not supported in API v2');
      delete mapped.sex;
    }
    
    return mapped;
  }
}

module.exports = ClinicalTrialsFiltersV2;