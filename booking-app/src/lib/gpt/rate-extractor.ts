import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GPT-powered rate extraction from unstructured data
 */
export async function extractRatesWithGPT(
  fileContent: string,
  fileName: string
): Promise<{
  success: boolean;
  rates: any[];
  errors?: string[];
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    confidence: 'high' | 'medium' | 'low';
  };
}> {
  const startTime = Date.now();

  try {
    console.log('🤖 [GPT] Extracting rates from:', fileName);

    const prompt = `You are a travel industry data extraction specialist. Extract travel rates (hotels, activities, transfers) from the following data and return ONLY valid JSON.

INPUT DATA:
${fileContent}

INSTRUCTIONS:
1. Extract ALL travel rates found in the data (hotels, activities, transfers, tours)
2. Identify the type: "hotel", "activity", or "transfer"
3. Infer missing information intelligently (e.g., commission %, source)
4. Handle multiple formats (CSV, table, unstructured text, emails, supplier quotes)
5. Convert all dates to YYYY-MM-DD format
6. If commission % is not mentioned, infer typical values (8-15%)
7. For source, use "offline_platform" if rates appear to be from suppliers, "offline_agent" if negotiated by agent
8. FOR HOTELS: Look for occupancy-based pricing (single/double/triple rates). Extract bedConfiguration and maxOccupancy from room type when possible. If rate varies by occupancy, populate singleRate, doubleRate, tripleRate, quadRate fields. Set ratePerPerson=true if pricing is per person, false if per room.

RETURN SCHEMA (valid JSON only):
{
  "rates": [
    // HOTEL RATES:
    {
      "type": "hotel",
      "supplier": "string (hotel chain or supplier name)",
      "propertyName": "string (full hotel name)",
      "propertyCode": "string or null",
      "roomType": "string (room category)",
      "bedConfiguration": "string or null (e.g., '1 King Bed', '2 Queen Beds')",
      "maxOccupancy": number or null (max people in room)",
      "checkIn": "YYYY-MM-DD",
      "checkOut": "YYYY-MM-DD",
      "startDate": "YYYY-MM-DD (same as checkIn)",
      "endDate": "YYYY-MM-DD (same as checkOut)",
      "ratePerPerson": boolean or null (true if rate is per person, false if per room)",
      "singleRate": number or null (rate for 1 person occupancy)",
      "doubleRate": number or null (rate for 2 people occupancy)",
      "tripleRate": number or null (rate for 3 people occupancy)",
      "quadRate": number or null (rate for 4+ people occupancy)",
      "rate": number (base rate - use doubleRate if available, otherwise singleRate or lowest rate)",
      "currency": "string (USD, EUR, etc.)",
      "commissionPercent": number,
      "source": "offline_platform" or "offline_agent",
      "mealPlan": "string or null",
      "notes": "string or null"
    },
    // ACTIVITY RATES:
    {
      "type": "activity",
      "supplier": "string (tour operator or supplier)",
      "activityName": "string (name of activity/tour)",
      "location": "string (city or location)",
      "category": "string or null (e.g., 'sightseeing', 'adventure', 'cultural')",
      "duration": number or null (hours or days)",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "rate": number,
      "currency": "string",
      "commissionPercent": number,
      "source": "offline_platform" or "offline_agent",
      "notes": "string or null"
    },
    // TRANSFER RATES:
    {
      "type": "transfer",
      "supplier": "string (transfer company)",
      "transferType": "airport" or "hotel" or "point-to-point" or "hourly",
      "from": "string (pickup location)",
      "to": "string (dropoff location)",
      "vehicleType": "string (e.g., 'sedan', 'van', 'bus')",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "rate": number,
      "currency": "string",
      "commissionPercent": number,
      "source": "offline_platform" or "offline_agent",
      "notes": "string or null"
    }
  ],
  "warnings": ["string (any ambiguities or assumptions made)"],
  "confidence": "high" or "medium" or "low"
}

IMPORTANT:
- Return ONLY valid JSON, no markdown, no explanations
- Each rate MUST have: type, supplier, startDate, endDate, rate, currency, commissionPercent, source
- Hotels MUST also have: propertyName, roomType, checkIn (=startDate), checkOut (=endDate)
- Hotels SHOULD have occupancy rates when available: singleRate, doubleRate, tripleRate, quadRate, bedConfiguration, maxOccupancy
- Activities MUST also have: activityName, location
- Transfers MUST also have: transferType, from, to, vehicleType
- If data is unclear or incomplete, include in "warnings" array
- Set confidence based on data quality and completeness`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a precise data extraction API. Return only valid JSON matching the exact schema provided.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const processingTime = Date.now() - startTime;
    const content = response.choices[0].message.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) {
      throw new Error('Empty response from GPT');
    }

    // Parse JSON response
    const result = JSON.parse(content);

    console.log('✅ [GPT] Extraction complete:', {
      ratesFound: result.rates?.length || 0,
      tokensUsed,
      processingTime: `${processingTime}ms`,
      confidence: result.confidence || 'unknown',
    });

    // Validate extracted rates
    const validatedRates = validateExtractedRates(result.rates || []);

    return {
      success: true,
      rates: validatedRates,
      errors: result.warnings || [],
      metadata: {
        tokensUsed,
        processingTime,
        confidence: result.confidence || 'medium',
      },
    };
  } catch (error: any) {
    console.error('❌ [GPT] Extraction failed:', error);

    return {
      success: false,
      rates: [],
      errors: [error.message || 'GPT processing failed'],
      metadata: {
        tokensUsed: 0,
        processingTime: Date.now() - startTime,
        confidence: 'low',
      },
    };
  }
}

/**
 * Validate and clean extracted rates
 */
function validateExtractedRates(rates: any[]): any[] {
  return rates
    .filter((rate) => {
      // Common required fields
      const hasCommonFields =
        rate.type &&
        rate.supplier &&
        rate.startDate &&
        rate.endDate &&
        rate.rate &&
        rate.currency &&
        rate.commissionPercent !== undefined &&
        rate.source;

      if (!hasCommonFields) return false;

      // Type-specific validation
      if (rate.type === 'hotel') {
        return rate.propertyName && rate.roomType && rate.checkIn && rate.checkOut;
      } else if (rate.type === 'activity') {
        return rate.activityName && rate.location;
      } else if (rate.type === 'transfer') {
        return rate.transferType && rate.from && rate.to && rate.vehicleType;
      }

      return false;
    })
    .map((rate) => {
      // Common cleanup
      const cleaned: any = {
        ...rate,
        // Ensure rate is a number
        rate: typeof rate.rate === 'string' ? parseFloat(rate.rate) : rate.rate,
        // Ensure commission is a number
        commissionPercent:
          typeof rate.commissionPercent === 'string'
            ? parseFloat(rate.commissionPercent)
            : rate.commissionPercent,
        // Default values
        notes: rate.notes || null,
      };

      // Type-specific cleanup
      if (rate.type === 'hotel') {
        cleaned.propertyCode = rate.propertyCode || null;
        cleaned.mealPlan = rate.mealPlan || null;
        cleaned.bedConfiguration = rate.bedConfiguration || null;
        cleaned.maxOccupancy = rate.maxOccupancy || null;
        cleaned.ratePerPerson = rate.ratePerPerson || false;
        cleaned.singleRate = rate.singleRate ? (typeof rate.singleRate === 'string' ? parseFloat(rate.singleRate) : rate.singleRate) : null;
        cleaned.doubleRate = rate.doubleRate ? (typeof rate.doubleRate === 'string' ? parseFloat(rate.doubleRate) : rate.doubleRate) : null;
        cleaned.tripleRate = rate.tripleRate ? (typeof rate.tripleRate === 'string' ? parseFloat(rate.tripleRate) : rate.tripleRate) : null;
        cleaned.quadRate = rate.quadRate ? (typeof rate.quadRate === 'string' ? parseFloat(rate.quadRate) : rate.quadRate) : null;
      } else if (rate.type === 'activity') {
        cleaned.category = rate.category || null;
        cleaned.duration = rate.duration || null;
        cleaned.minParticipants = rate.minParticipants || null;
        cleaned.maxParticipants = rate.maxParticipants || null;
      } else if (rate.type === 'transfer') {
        cleaned.maxPassengers = rate.maxPassengers || null;
        cleaned.duration = rate.duration || null;
      }

      return cleaned;
    });
}

/**
 * Estimate cost for GPT processing
 */
export function estimateGPTCost(inputTokens: number, outputTokens: number): number {
  // GPT-4o pricing (as of 2024)
  const INPUT_COST_PER_1M = 2.5; // $2.50 per 1M tokens
  const OUTPUT_COST_PER_1M = 10; // $10 per 1M tokens

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;

  return inputCost + outputCost;
}
