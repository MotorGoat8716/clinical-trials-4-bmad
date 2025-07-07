// src/clinicalTrialsApiWrapper.js
const axios = require('axios');
const cheerio = require('cheerio');

class ClinicalTrialsApiWrapper {
  constructor() {
    this.websiteUrl = 'https://clinicaltrials.gov/search';
    this.apiUrl = 'https://clinicaltrials.gov/api/v2/studies';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async searchTrials(searchParams) {
    const {
      condition = '',
      location = '',
      expr = '', // Universal search
      phase = '',
      studyStatus = '',
      ageGroup = '',
      sex = '',
      studyType = '',
      funderType = '',
      otherTerms = '',
      pageSize = 100
    } = searchParams;

    console.log('API-only search request:', searchParams);

    try {
      // Primary search with current parameters
      const apiData = await this.getApiData(searchParams, pageSize);
      console.log(`Primary API search returned ${apiData.studies.length} studies (total: ${apiData.totalCount})`);

      // If we have location and get fewer results than expected, try simpler approaches
      if (location && apiData.totalCount < 100) {
        console.log(`Location search returned only ${apiData.totalCount} studies, trying simpler approaches...`);
        
        // Strategy 1: Just city name in search terms
        const cityOnlyParams = { ...searchParams };
        const locationParts = location.split(',').map(s => s.trim());
        cityOnlyParams.location = '';
        cityOnlyParams.otherTerms = `${otherTerms} ${locationParts[0]}`.trim();
        
        const citySearch = await this.getApiData(cityOnlyParams, pageSize);
        console.log(`City-only search returned ${citySearch.studies.length} studies (total: ${citySearch.totalCount})`);
        
        // Strategy 2: Just state name in search terms
        if (locationParts.length >= 2) {
          const stateOnlyParams = { ...searchParams };
          stateOnlyParams.location = '';
          
          const state = locationParts[1];
          const stateExpansions = {
            'MA': 'Massachusetts',
            'NY': 'New York', 
            'CA': 'California',
            'IL': 'Illinois',
            'PA': 'Pennsylvania'
          };
          
          const stateName = stateExpansions[state.toUpperCase()] || state;
          stateOnlyParams.otherTerms = `${otherTerms} ${stateName}`.trim();
          
          const stateSearch = await this.getApiData(stateOnlyParams, pageSize);
          console.log(`State-only search returned ${stateSearch.studies.length} studies (total: ${stateSearch.totalCount})`);
          
          // Use the search that returned the most results
          const searches = [
            { data: apiData, name: 'primary', count: apiData.totalCount },
            { data: citySearch, name: 'city-only', count: citySearch.totalCount },
            { data: stateSearch, name: 'state-only', count: stateSearch.totalCount }
          ];
          
          const bestSearch = searches.reduce((best, current) => 
            current.count > best.count ? current : best
          );
          
          console.log(`Using ${bestSearch.name} search with ${bestSearch.count} total studies`);
          
          return {
            studies: bestSearch.data.studies,
            totalCount: bestSearch.data.totalCount,
            nextPageToken: bestSearch.data.nextPageToken,
            currentPageSize: bestSearch.data.studies.length,
            source: `api-${bestSearch.name}`,
            note: `Used ${bestSearch.name} location strategy (${bestSearch.count} studies found)`
          };
        } else {
          // Only city search available
          if (citySearch.totalCount > apiData.totalCount) {
            console.log(`Using city-only search with ${citySearch.totalCount} total studies`);
            
            return {
              studies: citySearch.studies,
              totalCount: citySearch.totalCount,
              nextPageToken: citySearch.nextPageToken,
              currentPageSize: citySearch.studies.length,
              source: 'api-city-only',
              note: `Used city-only location strategy (${citySearch.totalCount} studies found)`
            };
          }
        }
      }

      // Return the primary API results
      return {
        studies: apiData.studies,
        totalCount: apiData.totalCount,
        nextPageToken: apiData.nextPageToken,
        currentPageSize: apiData.studies.length,
        source: 'api-primary'
      };

    } catch (error) {
      console.error('Error in API search:', error.message);
      return {
        studies: [],
        totalCount: 0,
        nextPageToken: null,
        currentPageSize: 0,
        error: error.message
      };
    }
  }

  async getWebsiteCount(searchParams) {
    try {
      // Test different URL complexity levels to isolate the issue
      console.log('=== Testing Website URL Complexity ===');
      
      // Test 1: Just condition
      if (searchParams.condition && !searchParams.location && !searchParams.sex) {
        console.log('Testing: Condition only');
        const simpleUrl = `${this.websiteUrl}?cond=${encodeURIComponent(searchParams.condition)}&viewType=Card&limit=10`;
        console.log('Simple URL:', simpleUrl);
        
        const simpleResponse = await this.testUrl(simpleUrl);
        if (simpleResponse > 0) {
          console.log(`✅ Simple URL works: ${simpleResponse} studies`);
        } else {
          console.log('❌ Even simple URL failed');
        }
      }
      
      // Test 2: Full complex URL
      const websiteUrl = this.buildWebsiteUrl(searchParams);
      console.log('Testing: Full complex URL');
      console.log('Complex URL:', websiteUrl);
      
      const complexResponse = await this.testUrl(websiteUrl);
      if (complexResponse > 0) {
        console.log(`✅ Complex URL works: ${complexResponse} studies`);
        return complexResponse;
      } else {
        console.log('❌ Complex URL failed');
      }
      
      // Test 3: Try without some parameters to see what breaks it
      if (searchParams.location) {
        console.log('Testing: Condition + Location only');
        const locationUrl = `${this.websiteUrl}?cond=${encodeURIComponent(searchParams.condition)}&locStr=${encodeURIComponent(searchParams.location)}&viewType=Card&limit=10`;
        console.log('Location URL:', locationUrl);
        
        const locationResponse = await this.testUrl(locationUrl);
        if (locationResponse > 0) {
          console.log(`✅ Location URL works: ${locationResponse} studies`);
          return locationResponse;
        } else {
          console.log('❌ Location URL failed');
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting website count:', error.message);
      return 0;
    }
  }

  async testUrl(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status < 400
      });

      console.log(`Response status: ${response.status}, size: ${response.data.length}`);
      
      if (response.status === 200) {
        // Quick check - does this look like search results?
        const html = response.data;
        const isSearchPage = html.includes('studies found') || 
                            html.includes('clinical trials') || 
                            html.includes('search-results') || 
                            html.includes('"totalCount"') ||
                            html.includes(' studies ') ||
                            /\d+\s+studies/i.test(html);
        
        console.log(`Is search page: ${isSearchPage}`);
        
        if (isSearchPage) {
          const count = this.extractCountFromHTML(html);
          console.log(`Extracted count: ${count}`);
          return count;
        } else {
          console.log('Got non-search page (probably homepage/error)');
          console.log('First 500 chars:', html.substring(0, 500));
          return 0;
        }
      }
      
      return 0;
    } catch (error) {
      console.error(`Error testing URL ${url}:`, error.message);
      return 0;
    }
  }

  buildWebsiteUrl(searchParams) {
    const {
      condition = '',
      location = '',
      phase = '',
      studyStatus = '',
      ageGroup = '',
      sex = '',
      studyType = '',
      funderType = '',
      otherTerms = ''
    } = searchParams;

    const urlParams = new URLSearchParams();
    
    // Add main search terms
    if (condition) urlParams.append('cond', condition);
    if (location) urlParams.append('locStr', location);
    if (otherTerms) urlParams.append('term', otherTerms);
    
    // Build aggFilters for exact website matching
    const filters = [];
    
    if (studyStatus) {
      const statusMap = {
        'RECRUITING': 'recruiting',
        'NOT_YET_RECRUITING': 'not-yet-recruiting',
        'ACTIVE_NOT_RECRUITING': 'active-not-recruiting',
        'COMPLETED': 'completed',
        'SUSPENDED': 'suspended',
        'TERMINATED': 'terminated',
        'WITHDRAWN': 'withdrawn'
      };
      const mappedStatus = statusMap[studyStatus] || studyStatus.toLowerCase();
      filters.push(`status:${mappedStatus}`);
    }
    
    if (phase) {
      const phaseMap = {
        'EARLY_PHASE1': 'early-phase-1',
        'PHASE1': 'phase-1',
        'PHASE1_PHASE2': 'phase-1-phase-2',
        'PHASE2': 'phase-2',
        'PHASE2_PHASE3': 'phase-2-phase-3',
        'PHASE3': 'phase-3',
        'PHASE4': 'phase-4',
        'NA': 'na'
      };
      const mappedPhase = phaseMap[phase] || phase.toLowerCase();
      filters.push(`phase:${mappedPhase}`);
    }
    
    if (sex) {
      // This is the key fix - use website's exact sex filter format
      if (sex === 'FEMALE' || sex === 'female' || sex === 'f') {
        filters.push('sex:f');
      } else if (sex === 'MALE' || sex === 'male' || sex === 'm') {
        filters.push('sex:m');
      }
    }
    
    if (ageGroup) {
      const ageMap = {
        'CHILD': 'child',
        'ADULT': 'adult',
        'OLDER_ADULT': 'older-adult'
      };
      const mappedAge = ageMap[ageGroup] || ageGroup.toLowerCase();
      filters.push(`age:${mappedAge}`);
    }
    
    if (studyType) {
      const typeMap = {
        'INTERVENTIONAL': 'interventional',
        'OBSERVATIONAL': 'observational',
        'EXPANDED_ACCESS': 'expanded-access'
      };
      const mappedType = typeMap[studyType] || studyType.toLowerCase();
      filters.push(`type:${mappedType}`);
    }
    
    if (funderType) {
      const funderMap = {
        'INDUSTRY': 'industry',
        'NIH': 'nih',
        'FEDERAL': 'federal',
        'OTHER': 'other'
      };
      const mappedFunder = funderMap[funderType] || funderType.toLowerCase();
      filters.push(`funder:${mappedFunder}`);
    }
    
    if (filters.length > 0) {
      urlParams.append('aggFilters', filters.join(','));
    }
    
    // Add view parameters - try to force actual search results
    urlParams.append('viewType', 'Card');
    urlParams.append('limit', '100'); // Increase limit to get more results
    urlParams.append('sort', '@relevance');
    
    return `${this.websiteUrl}?${urlParams.toString()}`;
  }

  extractCountFromHTML(html) {
    try {
      const $ = cheerio.load(html);
      
      console.log('=== HTML Count Extraction Debug ===');
      console.log('HTML length:', html.length);
      
      // Method 1: Look for JSON data in script tags first (most reliable)
      console.log('Looking for JSON in script tags...');
      const scripts = $('script:not([src])');
      let foundInScript = false;
      
      scripts.each((i, elem) => {
        const scriptContent = $(elem).html();
        if (scriptContent && (scriptContent.includes('totalCount') || scriptContent.includes('studies'))) {
          console.log(`Script ${i} contains relevant data:`, scriptContent.substring(0, 200));
          
          // Look for various JSON patterns
          const patterns = [
            /"totalCount"\s*:\s*(\d+)/,
            /"count"\s*:\s*(\d+)/,
            /"total"\s*:\s*(\d+)/,
            /window\.__INITIAL_STATE__.*"totalCount"\s*:\s*(\d+)/,
            /window\.initialData.*"count"\s*:\s*(\d+)/
          ];
          
          for (const pattern of patterns) {
            const match = scriptContent.match(pattern);
            if (match) {
              const count = parseInt(match[1]);
              console.log(`Extracted count from script pattern ${pattern}: ${count}`);
              foundInScript = true;
              return count;
            }
          }
        }
      });
      
      if (foundInScript) return foundInScript;
      
      // Method 2: Look for specific count elements
      console.log('Looking for count in DOM elements...');
      const countSelectors = [
        '.results-count',
        '.search-results-count', 
        '.total-count',
        '.count-display',
        '[data-testid="results-count"]',
        '.ct-results-header',
        '.results-summary',
        '.search-summary',
        'h1:contains("studies")',
        'h2:contains("studies")',
        '.study-count',
        '#results-count'
      ];
      
      for (const selector of countSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, elem) => {
            const text = $(elem).text().trim();
            console.log(`Found element ${selector}: "${text}"`);
            
            const patterns = [
              /(\d{1,3}(?:,\d{3})*)\s+studies/i,
              /(\d{1,3}(?:,\d{3})*)\s+results/i,
              /(\d{1,3}(?:,\d{3})*)\s+trials/i
            ];
            
            for (const pattern of patterns) {
              const match = text.match(pattern);
              if (match) {
                const count = parseInt(match[1].replace(/,/g, ''));
                console.log(`Extracted count from ${selector}: ${count}`);
                return count;
              }
            }
          });
        }
      }
      
      // Method 3: Look for count in all text content with more patterns
      console.log('Looking for count in body text...');
      const bodyText = $('body').text();
      const sampleText = bodyText.substring(0, 2000);
      console.log('Body text sample (first 2000 chars):', sampleText);
      
      const bodyPatterns = [
        /(\d{1,3}(?:,\d{3})*)\s+studies?\s+found/i,
        /(\d{1,3}(?:,\d{3})*)\s+clinical\s+trials?/i,
        /(\d{1,3}(?:,\d{3})*)\s+results?/i,
        /found\s+(\d{1,3}(?:,\d{3})*)\s+studies?/i,
        /showing\s+(?:\d+\s+)?(?:of\s+)?(\d{1,3}(?:,\d{3})*)/i,
        /total\s+of\s+(\d{1,3}(?:,\d{3})*)/i,
        /(\d{1,3}(?:,\d{3})*)\s+matching/i,
        /(\d{1,3}(?:,\d{3})*)\s+study/i,
        /(\d{1,3}(?:,\d{3})*)\s+trial/i
      ];
      
      for (const pattern of bodyPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const count = parseInt(match[1].replace(/,/g, ''));
          console.log(`Extracted count from body text pattern ${pattern}: ${count}`);
          return count;
        }
      }
      
      // Method 4: Look for data attributes
      console.log('Looking for data attributes...');
      const dataElements = $('[data-count], [data-total], [data-results], [data-studies]');
      if (dataElements.length > 0) {
        dataElements.each((i, elem) => {
          const $elem = $(elem);
          const dataCount = $elem.attr('data-count') || $elem.attr('data-total') || 
                           $elem.attr('data-results') || $elem.attr('data-studies');
          if (dataCount) {
            const count = parseInt(dataCount);
            console.log(`Extracted count from data attribute: ${count}`);
            return count;
          }
        });
      }
      
      // Method 5: Look for any large numbers that might be the count
      console.log('Looking for potential count numbers...');
      const allNumbers = bodyText.match(/\d{1,3}(?:,\d{3})*/g);
      if (allNumbers) {
        const numbers = allNumbers.map(n => parseInt(n.replace(/,/g, ''))).filter(n => n > 10 && n < 50000);
        console.log('Found potential count numbers:', numbers);
        
        // If we find numbers in a reasonable range for clinical trials, return the largest
        if (numbers.length > 0) {
          const likelyCount = Math.max(...numbers);
          console.log(`Using largest reasonable number as count: ${likelyCount}`);
          return likelyCount;
        }
      }
      
      console.log('No count found in HTML using any method');
      return 0;
    } catch (error) {
      console.error('Error extracting count from HTML:', error.message);
      return 0;
    }
  }

  async getApiData(searchParams, pageSize) {
    try {
      const apiUrl = this.buildApiUrl(searchParams, pageSize);
      console.log('API URL:', apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        return {
          studies: data.studies || [],
          totalCount: data.totalCount || 0,
          nextPageToken: data.nextPageToken || null
        };
      } else {
        console.error('API response not successful:', response.status);
        return {
          studies: [],
          totalCount: 0,
          nextPageToken: null
        };
      }
    } catch (error) {
      console.error('Error fetching API data:', error.message);
      return {
        studies: [],
        totalCount: 0,
        nextPageToken: null
      };
    }
  }

  buildApiUrl(searchParams, pageSize) {
    const {
      condition = '',
      location = '',
      expr = '',
      phase = '',
      studyStatus = '',
      ageGroup = '',
      sex = '',
      studyType = '',
      funderType = '',
      otherTerms = '',
      pageToken = ''
    } = searchParams;

    const params = new URLSearchParams();
    
    // Add search terms
    if (condition) params.append('query.cond', condition);
    if (location) params.append('query.locn', location);
    if (expr) params.append('query.term', expr);
    if (otherTerms) params.append('query.term', otherTerms);
    
    // Add filters
    if (phase) params.append('filter.phase', phase);
    if (studyStatus) params.append('filter.overallStatus', studyStatus);
    if (ageGroup) params.append('filter.ageGroup', ageGroup);
    if (sex) params.append('filter.sex', sex);
    if (studyType) params.append('filter.studyType', studyType);
    if (funderType) params.append('filter.funderType', funderType);
    
    // Add pagination
    params.append('pageSize', pageSize.toString());
    if (pageToken) params.append('pageToken', pageToken);
    
    // Add format
    params.append('format', 'json');
    
    return `${this.apiUrl}?${params.toString()}`;
  }

  /**
   * Generates plain language explanations for clinical trial fields
   * @param {string} fieldName - The field name to explain
   * @param {string} fieldValue - The value of the field
   * @returns {string} Plain language explanation
   */
  getFieldExplanation(fieldName, fieldValue) {
    if (!fieldValue) return '';
    
    const explanations = {
      phase: {
        'EARLY_PHASE1': 'This is a very early study testing a new treatment for the first time in humans.',
        'PHASE1': 'This is an early study testing the safety and best dose of a new treatment.',
        'PHASE1_PHASE2': 'This study tests both safety and effectiveness of a treatment.',
        'PHASE2': 'This study tests whether a treatment works and continues to monitor safety.',
        'PHASE2_PHASE3': 'This study tests effectiveness in a larger group while comparing to standard treatment.',
        'PHASE3': 'This large study compares the new treatment to the current standard treatment.',
        'PHASE4': 'This study monitors long-term effects after a treatment has been approved.',
        'NA': 'This study does not test a new treatment or drug.'
      },
      
      overallStatus: {
        'RECRUITING': 'This study is currently accepting new participants.',
        'NOT_YET_RECRUITING': 'This study has not started recruiting participants yet.',
        'ACTIVE_NOT_RECRUITING': 'This study is ongoing but not accepting new participants.',
        'COMPLETED': 'This study has finished and is no longer recruiting participants.',
        'SUSPENDED': 'This study has been temporarily stopped.',
        'TERMINATED': 'This study has been stopped early and will not continue.',
        'WITHDRAWN': 'This study was stopped before it started recruiting participants.'
      },
      
      studyType: {
        'INTERVENTIONAL': 'This study tests a specific treatment or intervention.',
        'OBSERVATIONAL': 'This study observes participants without giving them a specific treatment.',
        'EXPANDED_ACCESS': 'This study provides access to experimental treatments outside of regular clinical trials.'
      },
      
      sex: {
        'FEMALE': 'This study only includes female participants.',
        'MALE': 'This study only includes male participants.',
        'ALL': 'This study includes participants of all genders.'
      },
      
      ageGroup: {
        'CHILD': 'This study includes children (under 18 years old).',
        'ADULT': 'This study includes adults (18-65 years old).',
        'OLDER_ADULT': 'This study includes older adults (65+ years old).'
      },
      
      funderType: {
        'INDUSTRY': 'This study is funded by a pharmaceutical or biotechnology company.',
        'NIH': 'This study is funded by the National Institutes of Health.',
        'FEDERAL': 'This study is funded by the federal government.',
        'OTHER': 'This study is funded by universities, foundations, or other organizations.'
      }
    };
    
    const fieldExplanations = explanations[fieldName.toLowerCase()];
    if (fieldExplanations) {
      return fieldExplanations[fieldValue.toUpperCase()] || fieldValue;
    }
    
    return fieldValue;
  }

  /**
   * Generates a comprehensive plain language summary of a clinical trial
   * @param {object} trial - The clinical trial data
   * @returns {string} Plain language summary
   */
  generatePlainLanguageSummary(trial) {
    const parts = [];
    
    // Basic description
    if (trial.briefTitle) {
      parts.push(`Study Title: ${trial.briefTitle}`);
    }
    
    if (trial.condition) {
      parts.push(`This study focuses on ${trial.condition.toLowerCase()}.`);
    }
    
    // Study type and phase
    if (trial.studyType) {
      parts.push(this.getFieldExplanation('studyType', trial.studyType));
    }
    
    if (trial.phase) {
      parts.push(this.getFieldExplanation('phase', trial.phase));
    }
    
    // Status
    if (trial.overallStatus) {
      parts.push(this.getFieldExplanation('overallStatus', trial.overallStatus));
    }
    
    // Participant criteria
    const participantInfo = [];
    if (trial.sex) {
      participantInfo.push(this.getFieldExplanation('sex', trial.sex));
    }
    if (trial.minimumAge || trial.maximumAge) {
      const ageRange = `Ages ${trial.minimumAge || 'any'} to ${trial.maximumAge || 'any'}`;
      participantInfo.push(`Participant age range: ${ageRange}`);
    }
    
    if (participantInfo.length > 0) {
      parts.push('Participant Requirements: ' + participantInfo.join(' '));
    }
    
    // Location
    if (trial.locationCountries) {
      parts.push(`This study is taking place in: ${trial.locationCountries.join(', ')}`);
    }
    
    // Funding
    if (trial.funderType) {
      parts.push(this.getFieldExplanation('funderType', trial.funderType));
    }
    
    return parts.join(' ');
  }
}

module.exports = ClinicalTrialsApiWrapper;