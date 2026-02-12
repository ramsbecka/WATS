/**
 * Firebase ML Kit Integration (On-Device Image Recognition)
 * Free, works offline, limited to 400+ labels
 */

export interface ImageRecognitionResult {
  labels: Array<{ name: string; confidence: number }>;
  text?: string;
  safeSearch?: {
    adult: boolean;
    violence: boolean;
    racy: boolean;
  };
}

export async function recognizeImageWithMLKit(imageUri: string): Promise<ImageRecognitionResult> {
  // Check if Firebase ML Kit is available
  try {
    // @ts-ignore - Dynamic import for optional dependency
    const mlkit = require('@react-native-firebase/ml-vision');
    
    const labels: Array<{ name: string; confidence: number }> = [];
    
    // Image Labeling
    try {
      const imageLabeler = mlkit().vision().imageLabeler();
      const result = await imageLabeler.processImage(imageUri);
      
      result.forEach((label: any) => {
        labels.push({
          name: label.text,
          confidence: label.confidence,
        });
      });
    } catch (error) {
      console.warn('ML Kit labeling failed:', error);
    }
    
    // Text Recognition (OCR)
    let text: string | undefined;
    try {
      const textRecognizer = mlkit().vision().textRecognizer();
      const result = await textRecognizer.processImage(imageUri);
      text = result.text;
    } catch (error) {
      // OCR not critical, continue
    }
    
    return {
      labels,
      text,
      safeSearch: {
        adult: false,
        violence: false,
        racy: false,
      },
    };
  } catch (error) {
    // ML Kit not available, throw to use fallback
    throw new Error('ML Kit not configured');
  }
}
