import { NextRequest, NextResponse } from 'next/server';
import { parseFile, validateFile } from '@/lib/parsers/file-parser';
import { extractRatesWithGPT } from '@/lib/gpt/rate-extractor';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [GPT Process] Request received');

    // Get form data with file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📄 [GPT Process] File received:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
    });

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Step 1: Parse file to extract text content
    console.log('📖 [GPT Process] Parsing file...');
    const parseResult = await parseFile(file);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'File parsing failed',
          details: parseResult.error,
        },
        { status: 400 }
      );
    }

    console.log('✅ [GPT Process] File parsed:', {
      contentLength: parseResult.content.length,
    });

    // Step 2: Send to GPT for extraction
    console.log('🤖 [GPT Process] Sending to GPT for extraction...');
    const extractionResult = await extractRatesWithGPT(
      parseResult.content,
      file.name
    );

    if (!extractionResult.success) {
      return NextResponse.json(
        {
          error: 'GPT extraction failed',
          details: extractionResult.errors?.[0] || 'Unknown error',
        },
        { status: 500 }
      );
    }

    console.log('✅ [GPT Process] Extraction complete:', {
      ratesFound: extractionResult.rates.length,
      warnings: extractionResult.errors?.length || 0,
    });

    // Step 3: Return extracted rates for preview
    return NextResponse.json({
      success: true,
      rates: extractionResult.rates,
      metadata: {
        fileName: file.name,
        ratesExtracted: extractionResult.rates.length,
        warnings: extractionResult.errors || [],
        confidence: extractionResult.metadata?.confidence || 'unknown',
        tokensUsed: extractionResult.metadata?.tokensUsed || 0,
        processingTime: extractionResult.metadata?.processingTime || 0,
        estimatedCost: calculateCost(extractionResult.metadata?.tokensUsed || 0),
      },
    });
  } catch (error: any) {
    console.error('❌ [GPT Process] Error:', error);

    return NextResponse.json(
      {
        error: 'Server error',
        details: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate estimated cost for GPT processing
 */
function calculateCost(tokensUsed: number): string {
  // GPT-4o pricing: ~$2.50 per 1M input tokens, $10 per 1M output tokens
  // Rough estimate: assume 60/40 split
  const inputTokens = tokensUsed * 0.6;
  const outputTokens = tokensUsed * 0.4;

  const inputCost = (inputTokens / 1_000_000) * 2.5;
  const outputCost = (outputTokens / 1_000_000) * 10;

  const totalCost = inputCost + outputCost;

  return `$${totalCost.toFixed(4)}`;
}
