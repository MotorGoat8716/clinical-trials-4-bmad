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

  // Remove website count method since it doesn't work
  async getWebsiteCount(searchParams) {
    // Website scraping doesn't work - always return 0 to use API count
    console.log('Website scraping not supported - using API count');
    return 0;
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
      console.log('Getting data from API:', apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClinicalTrialsWrapper/1.0'
        },
        timeout: 30000
      });

      if (response.status === 200) {
        const data = response.data;
        const studies = data.studies || [];
        
        // Format studies for consistent response
        const formattedStudies = studies.map(study => ({
          nctId: study.protocolSection?.identificationModule?.nctId || '',
          title: study.protocolSection?.identificationModule?.briefTitle || '',
          status: study.protocolSection?.statusModule?.overallStatus || '',
          condition: study.protocolSection?.conditionsModule?.conditions?.[0] || '',
          phase: study.protocolSection?.designModule?.phases?.[0] || '',
          studyType: study.protocolSection?.designModule?.studyType || '',
          enrollment: study.protocolSection?.designModule?.enrollmentInfo?.count || 0,
          startDate: study.protocolSection?.statusModule?.startDateStruct?.date || '',
          location: study.protocolSection?.contactsLocationsModule?.locations?.[0]?.city || '',
          sponsor: study.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name || ''
        }));

        return {
          studies: formattedStudies,
          totalCount: data.totalCount || 0,
          nextPageToken: data.nextPageToken || null
        };
      }
      
      return { studies: [], totalCount: 0, nextPageToken: null };
      
    } catch (error) {
      console.error('Error getting API data:', error.message);
      return { studies: [], totalCount: 0, nextPageToken: null };
    }
  }

  buildApiUrl(searchParams, pageSize) {
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
    
    // Query parameters (search terms)
    if (condition) urlParams.append('query.cond', condition);
    
    // Simplified location handling - less is more
    if (location) {
      // Strategy: Use ONLY the location as provided, don't over-complicate
      const locationTerms = [];
      
      // Just add the basic location components
      const parts = location.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        const city = parts[0];
        const state = parts[1];
        
        // Add city and state simply
        locationTerms.push(city);
        
        // Convert common state abbreviations
        const stateExpansions = {
          'MA': 'Massachusetts',
          'NY': 'New York', 
          'CA': 'California',
          'IL': 'Illinois',
          'PA': 'Pennsylvania',
          'TX': 'Texas',
          'FL': 'Florida'
        };
        
        if (stateExpansions[state.toUpperCase()]) {
          locationTerms.push(stateExpansions[state.toUpperCase()]);
        } else {
          locationTerms.push(state);
        }
      } else {
        // Single location term
        locationTerms.push(location);
      }
      
      // Combine with other terms if provided
      const allTerms = otherTerms ? 
        `${otherTerms} ${locationTerms.join(' ')}` : 
        locationTerms.join(' ');
      
      urlParams.append('query.term', allTerms);
      
      // Don't use query.locn as it seems too restrictive
      // urlParams.append('query.locn', location);
      
    } else if (otherTerms) {
      urlParams.append('query.term', otherTerms);
    }
    
    // Build aggFilters array for complex filtering
    const aggFilters = [];
    
    // Filter parameters (exact matching)
    if (studyStatus) {
      urlParams.append('filter.overallStatus', studyStatus);
    }
    
    if (phase) {
      const phaseMap = {
        'EARLY_PHASE1': 'phase:0',
        'PHASE1': 'phase:1',
        'PHASE1_PHASE2': 'phase:1',
        'PHASE2': 'phase:2',
        'PHASE2_PHASE3': 'phase:2',
        'PHASE3': 'phase:3',
        'PHASE4': 'phase:4',
        'NA': 'phase:na'
      };
      if (phaseMap[phase]) {
        aggFilters.push(phaseMap[phase]);
      }
    }
    
    if (sex) {
      const sexMap = {
        'MALE': 'sex:m',
        'FEMALE': 'sex:f'
      };
      if (sexMap[sex]) {
        aggFilters.push(sexMap[sex]);
      }
    }
    
    if (ageGroup) {
      const ageMap = {
        'CHILD': 'ages:child',
        'ADULT': 'ages:adult',
        'OLDER_ADULT': 'ages:older'
      };
      if (ageMap[ageGroup]) {
        aggFilters.push(ageMap[ageGroup]);
      }
    }
    
    // Note: Study type filtering is not supported by ClinicalTrials.gov API v2
    // The API doesn't provide a way to filter by INTERVENTIONAL/OBSERVATIONAL/EXPANDED_ACCESS
    // We'll need to filter results client-side or use a different approach
    
    if (funderType) {
      const funderMap = {
        'INDUSTRY': 'funder:industry',
        'NIH': 'funder:nih',
        'FEDERAL': 'funder:federal',
        'OTHER': 'funder:other'
      };
      if (funderMap[funderType]) {
        aggFilters.push(funderMap[funderType]);
      }
    }
    
    // Add aggFilters if we have any
    if (aggFilters.length > 0) {
      urlParams.append('aggFilters', aggFilters.join(','));
    }
    
    urlParams.append('pageSize', pageSize.toString());
    urlParams.append('countTotal', 'true');
    
    return `${this.apiUrl}?${urlParams.toString()}`;
  }

  // Helper method to get just the count (uses website only)
  async getTrialCount(searchParams) {
    return await this.getWebsiteCount(searchParams);
  }

  // Legacy method for backward compatibility
  async getTrialDetails(nctId) {
    try {
      const response = await axios.get(`${this.apiUrl}/${nctId}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClinicalTrialsWrapper/1.0'
        },
        timeout: 30000
      });
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      console.error(`Error getting trial details for ${nctId}:`, error.message);
      return null;
    }
  }

  // Method to get available filter options
  getAvailableFilters() {
    return {
      studyStatus: [
        'RECRUITING',
        'NOT_YET_RECRUITING', 
        'COMPLETED',
        'SUSPENDED',
        'TERMINATED',
        'WITHDRAWN',
        'ACTIVE_NOT_RECRUITING',
        'ENROLLING_BY_INVITATION',
        'UNKNOWN'
      ],
      phase: [
        'EARLY_PHASE1',
        'PHASE1',
        'PHASE1_PHASE2',
        'PHASE2',
        'PHASE2_PHASE3',
        'PHASE3',
        'PHASE4',
        'NA'
      ],
      sex: [
        'MALE',
        'FEMALE',
        'ALL'
      ],
      ageGroup: [
        'CHILD',
        'ADULT',
        'OLDER_ADULT'
      ],
      studyType: [
        'INTERVENTIONAL',
        'OBSERVATIONAL',
        'EXPANDED_ACCESS'
      ],
      funderType: [
        'INDUSTRY',
        'NIH',
        'FEDERAL',
        'OTHER'
      ]
    };
  }
}

module.exports = ClinicalTrialsApiWrapper;