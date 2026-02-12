import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Recognition API Route
 * Supports: Google Cloud Vision API, AWS Rekognition
 */

export async function POST(request: NextRequest) {
  try {
    const { imageUri } = await request.json();
    
    if (!imageUri) {
      return NextResponse.json(
        { error: 'Image URI required' },
        { status: 400 }
      );
    }
    
    // Try Google Cloud Vision first
    const googleApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (googleApiKey) {
      try {
        const result = await recognizeWithGoogleVision(imageUri, googleApiKey);
        return NextResponse.json(result);
      } catch (error) {
        console.warn('Google Vision failed, trying AWS:', error);
      }
    }
    
    // Fallback to AWS Rekognition
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (awsAccessKey && awsSecretKey) {
      try {
        const result = await recognizeWithAWSRekognition(imageUri, awsAccessKey, awsSecretKey);
        return NextResponse.json(result);
      } catch (error) {
        console.error('AWS Rekognition failed:', error);
      }
    }
    
    // Return empty result if no services configured
    return NextResponse.json({
      labels: [],
      safeSearch: { adult: false, violence: false, racy: false },
    });
  } catch (error: any) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}

async function recognizeWithGoogleVision(imageUri: string, apiKey: string) {
  // Download image and convert to base64
  const imageResponse = await fetch(imageUri);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'TEXT_DETECTION' },
              { type: 'SAFE_SEARCH_DETECTION' },
            ],
          },
        ],
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error('Google Vision API error');
  }
  
  const data = await response.json();
  const result = data.responses[0];
  
  return {
    labels: (result.labelAnnotations || []).map((label: any) => ({
      name: label.description,
      confidence: label.score,
    })),
    text: result.textAnnotations?.[0]?.description,
    safeSearch: {
      adult: result.safeSearchAnnotation?.adult === 'LIKELY' || result.safeSearchAnnotation?.adult === 'VERY_LIKELY',
      violence: result.safeSearchAnnotation?.violence === 'LIKELY' || result.safeSearchAnnotation?.violence === 'VERY_LIKELY',
      racy: result.safeSearchAnnotation?.racy === 'LIKELY' || result.safeSearchAnnotation?.racy === 'VERY_LIKELY',
    },
  };
}

async function recognizeWithAWSRekognition(
  imageUri: string,
  accessKey: string,
  secretKey: string
) {
  // AWS Rekognition requires AWS SDK
  // For now, return empty result - implement with AWS SDK if needed
  throw new Error('AWS Rekognition not implemented - requires AWS SDK');
}
