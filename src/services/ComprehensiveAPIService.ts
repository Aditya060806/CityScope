class ComprehensiveAPIService {
  // Get location details from PIN code using India Post API
  async getLocationFromPincode(pincode: string) {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        return {
          city: postOffice.Name,
          state: postOffice.State,
          district: postOffice.District,
          area: postOffice.Block
        };
      }
      return null;
    } catch (error) {
      console.error('PIN code lookup failed:', error);
      return null;
    }
  }

  // Reverse geocoding using OpenStreetMap Nominatim with proper headers and fallbacks
  async reverseGeocode(latitude: number, longitude: number) {
    // Try multiple geocoding services with fallbacks
    const services = [
      // Primary: OpenStreetMap Nominatim (with proper headers)
      async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
            {
              headers: {
                'User-Agent': 'CityScope/1.0 (Civic Engagement Platform; contact@cityscope.app)',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
              },
              // Add referrer policy for CORS
              referrerPolicy: 'no-referrer',
            }
          );
          
          if (!response.ok) {
            throw new Error(`Nominatim API returned ${response.status}`);
          }
          
          const data = await response.json();
          if (data && data.display_name) {
            return data.display_name;
          }
          throw new Error('No address data in response');
        } catch (error) {
          console.warn('Nominatim reverse geocoding failed:', error);
          throw error;
        }
      },
      // Fallback 1: MapTiler Geocoding API (if API key available)
      async () => {
        const mapTilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
        if (!mapTilerKey || mapTilerKey === 'your-maptiler-api-key') {
          throw new Error('MapTiler API key not configured');
        }
        
        try {
          const response = await fetch(
            `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${mapTilerKey}`
          );
          
          if (!response.ok) {
            throw new Error(`MapTiler API returned ${response.status}`);
          }
          
          const data = await response.json();
          if (data && data.features && data.features.length > 0) {
            return data.features[0].place_name || data.features[0].text;
          }
          throw new Error('No address data in MapTiler response');
        } catch (error) {
          console.warn('MapTiler reverse geocoding failed:', error);
          throw error;
        }
      },
      // Fallback 2: Use browser's built-in geocoding (if available)
      async () => {
        // Some browsers support reverse geocoding via Intl API
        // This is a last resort fallback
        throw new Error('Browser geocoding not available');
      }
    ];

    // Try each service in order
    for (const service of services) {
      try {
        const address = await service();
        if (address) {
          console.log('✅ Reverse geocoding successful:', address);
          return address;
        }
      } catch (error) {
        // Continue to next service
        continue;
      }
    }

    // If all services fail, return coordinates as fallback
    console.warn('⚠️ All reverse geocoding services failed, using coordinates');
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  // Forward geocoding - search for addresses/locations
  async geocode(query: string, limit = 5) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'CityScope/1.0 (Civic Engagement Platform; contact@cityscope.app)',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          referrerPolicy: 'no-referrer',
        }
      );
      
      if (!response.ok) throw new Error('Geocoding request failed');
      
      const data = await response.json();
      return data.map((result: {
        lat: string;
        lon: string;
        display_name: string;
        place_id: number;
        type: string;
        importance: number;
      }) => ({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name,
        placeId: result.place_id,
        type: result.type,
        importance: result.importance
      }));
    } catch (error) {
      console.error('Forward geocoding failed:', error);
      return [];
    }
  }
}

export const apiService = new ComprehensiveAPIService();