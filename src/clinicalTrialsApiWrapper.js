const axios = require('axios');
const ClinicalTrialsFilters = require('./clinicalTrialsFiltersV2');

const CLINICAL_TRIALS_API_URL = 'https://clinicaltrials.gov/api/v2/studies';

class ClinicalTrialsApiWrapper {
  constructor() {
    // Simple in-memory cache with TTL
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Build query term from condition and location
   */
  buildQueryTerm(condition, location) {
    const terms = [];
    
    if (condition && condition.trim()) {
      terms.push(condition.trim());
    }
    
    if (location && location.trim()) {
      // Smart location processing - extract city name only for better results
      const cleanLocation = this.cleanLocationForSearch(location.trim());
      terms.push(cleanLocation);
    }
    
    return terms.join(' ');
  }

  /**
   * Clean location input for better search results
   */
  cleanLocationForSearch(location) {
    // Remove common problematic suffixes that cause API failures
    let cleaned = location.toLowerCase();
    
    // Remove state abbreviations and common variations
    cleaned = cleaned
      .replace(/,\s*(fl|florida)$/i, '')         // Remove ", fl" or ", florida"
      .replace(/,\s*(ma|massachusetts)$/i, '')   // Remove ", ma" or ", massachusetts"
      .replace(/,\s*(ny|new york)$/i, '')        // Remove ", ny" or ", new york"
      .replace(/,\s*(ca|california)$/i, '')      // Remove ", ca" or ", california"
      .replace(/,\s*(tx|texas)$/i, '')           // Remove ", tx" or ", texas"
      .replace(/,\s*usa?$/i, '')                 // Remove ", us" or ", usa"
      .replace(/,\s*united states$/i, '')        // Remove ", united states"
      .trim();
    
    // Extract just the city name (first part before any comma)
    const cityMatch = cleaned.match(/^([^,]+)/);
    if (cityMatch) {
      return cityMatch[1].trim();
    }
    
    return cleaned;
  }

  /**
   * Build API parameters for ClinicalTrials.gov using working filter system
   */
  buildApiParams(searchParams) {
    // Use the working filter system
    const params = ClinicalTrialsFilters.buildApiParams(searchParams);

    // Handle location parameter specially to avoid API failures
    if (searchParams.location && params['query.locn']) {
      params['query.locn'] = this.cleanLocationForSearch(params['query.locn']);
    }

    // Backward compatibility: handle legacy simple parameters
    if (searchParams.condition && !params['query.cond'] && !params['query.term']) {
      params['query.cond'] = searchParams.condition;
    }
    
    if (searchParams.location && !params['query.locn']) {
      // Use cleaned location for the location parameter
      params['query.locn'] = this.cleanLocationForSearch(searchParams.location);
    }

    return params;
  }

  /**
   * Generate cache key for request parameters
   */
  getCacheKey(params) {
    return JSON.stringify(params);
  }

  /**
   * Check if cached result is still valid
   */
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  /**
   * Get accurate total count only (no actual study data needed for large searches)
   * Uses progressive sampling to estimate totals for very large result sets
   */
  async getTotalCountOnly(apiParams) {
    try {
      // For count-only queries, start with pageSize=1 to minimize data transfer
      const countParams = { ...apiParams, pageSize: 1 };
      const initialResponse = await axios.get(CLINICAL_TRIALS_API_URL, {
        params: countParams,
        timeout: 10000
      });
      
      // If API provides totalCount, use it
      if (initialResponse.data.totalCount && initialResponse.data.totalCount > 0) {
        console.log(`Using API-provided totalCount: ${initialResponse.data.totalCount}`);
        return initialResponse.data.totalCount;
      }
      
      // If no totalCount, progressively sample to estimate
      console.log('No reliable totalCount from API, using progressive sampling...');
      
      // Sample with increasing page sizes to estimate total
      const sampleSizes = [1000, 5000, 10000];
      let bestEstimate = 0;
      
      for (const pageSize of sampleSizes) {
        try {
          const sampleParams = { ...apiParams, pageSize };
          const sampleResponse = await axios.get(CLINICAL_TRIALS_API_URL, {
            params: sampleParams,
            timeout: 15000
          });
          
          const studiesReturned = sampleResponse.data.studies?.length || 0;
          const hasNextPage = sampleResponse.data.nextPageToken;
          
          if (studiesReturned === pageSize && hasNextPage) {
            // There are more results, continue sampling
            bestEstimate = studiesReturned;
            console.log(`Sample with pageSize=${pageSize}: ${studiesReturned} studies, more available`);
            continue;
          } else {
            // This is the actual total
            bestEstimate = studiesReturned;
            console.log(`Final count with pageSize=${pageSize}: ${studiesReturned} studies`);
            break;
          }
        } catch (sampleError) {
          console.warn(`Sampling failed with pageSize=${pageSize}:`, sampleError.message);
          break;
        }
      }
      
      return bestEstimate;
      
    } catch (error) {
      console.warn('Failed to get total count:', error.message);
      return null;
    }
  }

  /**
   * Search trials using ClinicalTrials.gov API with working filters and caching
   */
  async searchTrials(searchParams) {
    // Map legacy parameters
    const mappedParams = ClinicalTrialsFilters.mapLegacyParams(searchParams);
    
    // Validate filters
    const validation = ClinicalTrialsFilters.validateFilters(mappedParams);
    if (!validation.isValid) {
      throw new Error(`Invalid filters: ${validation.errors.join(', ')}`);
    }
    
    // Log warnings for experimental or problematic filters
    if (validation.warnings.length > 0) {
      console.warn('Filter warnings:', validation.warnings.join(', '));
    }
    const apiParams = this.buildApiParams(mappedParams);

    let cachedResult;
    try {
      console.log(`Querying ClinicalTrials.gov API with single optimized call`);
      
      // Build params for a single, efficient API call
      const finalApiParams = {
        ...apiParams,
        pageSize: 1000, // Max page size
        countTotal: true // Ensure we get the total count
      };
      
      const cacheKey = this.getCacheKey(finalApiParams);
      cachedResult = this.cache.get(cacheKey);
      if (cachedResult && this.isCacheValid(cachedResult)) {
        console.log(`Cache hit for query: ${JSON.stringify(finalApiParams)}`);
        return cachedResult.data;
      }

      console.log('Final API Parameters:', finalApiParams);

      const response = await axios.get(CLINICAL_TRIALS_API_URL, {
        params: finalApiParams,
        timeout: 20000
      });

      const studies = response.data.studies || [];
      const totalCount = response.data.totalCount || studies.length;
      const isSmallResultSet = totalCount <= 10;

      console.log(`API returned ${studies.length} studies with a total count of ${totalCount}`);

      const result = {
        studies: isSmallResultSet ? studies : [],
        totalCount: totalCount,
        nextPageToken: response.data.nextPageToken || null,
        sourceUrl: `${CLINICAL_TRIALS_API_URL}?${new URLSearchParams(finalApiParams).toString()}`,
        apiParams: finalApiParams,
        timestamp: new Date().toISOString(),
        accurateTotal: true,
        isSmallResultSet: isSmallResultSet,
        isLargeResultSet: !isSmallResultSet,
        note: !isSmallResultSet
          ? `Large result set (${totalCount} trials). Use more specific filters to see detailed summaries.`
          : null
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('ClinicalTrials.gov API Error:', error.message);
      
      // Return cached result if available, even if stale
      if (cachedResult) {
        console.log('Returning stale cached result due to API error');
        return cachedResult.data;
      }

      throw new Error(`ClinicalTrials.gov API unavailable: ${error.message}`);
    }
  }

  /**
   * Get detailed information for a specific trial by NCT ID
   */
  async getTrialDetails(nctId) {
    const cacheKey = `trial_${nctId}`;
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult && this.isCacheValid(cachedResult)) {
      return cachedResult.data;
    }

    try {
      const response = await axios.get(CLINICAL_TRIALS_API_URL, {
        params: {
          'query.id': nctId,
          format: 'json'
        },
        timeout: 10000
      });

      const study = response.data.studies?.[0];
      if (!study) {
        throw new Error(`Trial ${nctId} not found`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: study,
        timestamp: Date.now()
      });

      return study;

    } catch (error) {
      console.error(`Error fetching trial ${nctId}:`, error.message);
      
      // Return cached result if available
      if (cachedResult) {
        return cachedResult.data;
      }
      
      throw error;
    }
  }

  /**
   * Transform study data to our format for compatibility
   */
  transformStudyData(study) {
    const protocol = study.protocolSection;
    const identification = protocol?.identificationModule;
    const conditions = protocol?.conditionsModule;
    const status = protocol?.statusModule;
    const design = protocol?.designModule;
    const contacts = protocol?.contactsLocationsModule;
    const description = protocol?.descriptionModule;

    // Build location string
    let locationString = null;
    if (contacts?.locations?.length > 0) {
      locationString = contacts.locations
        .map(loc => [loc.city, loc.state, loc.country].filter(Boolean).join(', '))
        .join('; ');
    }

    // Extract phase
    let phase = null;
    if (design?.phases?.length > 0) {
      const phaseStr = design.phases[0];
      const phaseMatch = phaseStr.match(/(\d+)/);
      phase = phaseMatch ? parseInt(phaseMatch[1]) : null;
    }

    return {
      trial_id: identification?.nctId,
      title: identification?.officialTitle || identification?.briefTitle,
      condition: conditions?.conditions?.join(', ') || null,
      location: locationString,
      status: status?.overallStatus,
      phase: phase,
      summary: description?.briefSummary,
      detailed_description: description?.detailedDescription,
      official_url: `https://clinicaltrials.gov/study/${identification?.nctId}`,
      source: 'ClinicalTrials.gov',
      last_updated: status?.lastUpdatePostDate || status?.statusVerifiedDate
    };
  }

  /**
   * Get available filter options and descriptions
   */
  getAvailableFilters() {
    return {
      all: ClinicalTrialsFilters.getFilterCategories(),
      working: ClinicalTrialsFilters.getWorkingFilters(),
      basic: ClinicalTrialsFilters.getBasicFilters(),
      advanced: ClinicalTrialsFilters.getAdvancedFilters(),
      descriptions: ClinicalTrialsFilters.getFilterDescriptions()
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache.clear();
    console.log('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

module.exports = ClinicalTrialsApiWrapper;