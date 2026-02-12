# AI Integration Guide - WATS E-Commerce Platform

## Overview

This document describes the AI services integration layer for the WATS e-commerce platform, supporting multiple AI providers and use cases.

## Architecture

The AI system is designed with a layered architecture:

1. **Service Layer** (`apps/mobile/src/services/ai/`) - Core AI functionality
2. **API Routes** (`apps/admin/src/app/api/ai/`) - Backend API endpoints
3. **Components** (`apps/mobile/src/components/ai/`) - React Native UI components

## Supported AI Services

### 1. Product Recommendations

**Current Implementation:**
- Simple collaborative filtering based on user order history
- Falls back to popular products for new users

**Future Integration Options:**
- **AWS Personalize**: `$0.05/GB` data ingestion, `$0.24/hr` training, `$0.056/1000` recommendations
- **Google Recommendations AI**: Part of Vertex AI Search
- **Azure Personalizer**: Enterprise-grade personalization

**Usage:**
```typescript
import { getProductRecommendations } from '@/services/ai';

const recommendations = await getProductRecommendations(userId, {
  limit: 10,
  categoryId: 'optional-category-id',
});
```

### 2. Chatbot / Customer Support

**Current Implementation:**
- Rule-based fallback responses
- OpenAI GPT-3.5-turbo integration (via API route)

**Future Integration Options:**
- **OpenAI ChatGPT**: `$0.50/$1.50 per 1000 tokens` (input/output)
- **Google Dialogflow ES**: `~$0.002 per text request`
- **AWS Lex**: Part of AWS Connect
- **Azure Bot Service**: With LUIS/QnA Maker

**Usage:**
```typescript
import { chatWithAI } from '@/services/ai';

const response = await chatWithAI([
  { role: 'user', content: 'Where is my order?' }
], { userId, orderId });
```

### 3. Image Recognition

**Current Implementation:**
- Firebase ML Kit (on-device, free, 400+ labels)
- Cloud API fallback (Google Vision / AWS Rekognition)

**Future Integration Options:**
- **Google Cloud Vision**: `$1.50/1000 images` (after 1000 free)
- **AWS Rekognition**: `~$0.001/image` for label detection
- **Azure Computer Vision**: `~$1.50/1000 images`

**Usage:**
```typescript
import { recognizeImage } from '@/services/ai';

const result = await recognizeImage(imageUri);
// Returns: { labels: [...], text?: string, safeSearch?: {...} }
```

### 4. Analytics

**Current Implementation:**
- Firebase Analytics (free tier)
- Custom analytics events stored in database

**Future Integration Options:**
- **Google Analytics / Firebase Analytics**: Free for most events
- **AWS Kinesis**: `$0.032/GB` ingestion, `$0.016/GB` read
- **Azure Application Insights**: Pay-as-you-go

**Usage:**
```typescript
import { trackEvent, trackProductView, trackPurchase } from '@/services/ai';

trackEvent('button_click', { button_name: 'add_to_cart' });
trackProductView(productId, productName);
trackPurchase(orderId, totalAmount, 'TZS', items);
```

### 5. Fraud Detection

**Current Implementation:**
- Rule-based checks:
  - Unusual order amounts
  - Multiple orders in short time
  - New users with large orders
  - Unusual item quantities

**Future Integration Options:**
- **AWS SageMaker AutoML**: Custom fraud detection models
- **Azure Anomaly Detector**: `20,000 free events/month`
- **Custom ML Models**: Train on historical data

**Usage:**
```typescript
import { checkOrderFraud } from '@/services/ai';

const result = await checkOrderFraud({
  userId,
  totalAmount,
  items,
  shippingAddress,
});
// Returns: { isFraud: boolean, riskScore: number, reasons: string[] }
```

## Environment Variables

### Mobile App (.env)
```env
# OpenAI (optional - for chatbot)
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# Firebase (optional - for ML Kit & Analytics)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
```

### Admin Backend (.env.local)
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Google Cloud Vision
GOOGLE_CLOUD_VISION_API_KEY=...

# AWS (optional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## Cost Optimization

1. **Use Free Tiers First**:
   - Firebase ML Kit (on-device) - Free
   - Firebase Analytics - Free tier
   - Simple rule-based fraud detection - Free

2. **Cache Results**:
   - Cache recommendations for 1 hour
   - Cache image recognition results

3. **Use Cheaper Models**:
   - GPT-3.5-turbo instead of GPT-4 for chatbot
   - On-device ML Kit instead of cloud APIs when possible

4. **Rate Limiting**:
   - Limit API calls per user
   - Batch analytics events

## Security Considerations

1. **API Keys**: Never expose API keys in client code
2. **Input Validation**: Validate all user inputs before sending to AI services
3. **Content Filtering**: Use safe search filters for image recognition
4. **Fraud Checks**: Always validate AI fraud detection results with manual review

## Migration Path

### Phase 1 (Current - MVP)
- ✅ Simple recommendations based on order history
- ✅ Rule-based chatbot
- ✅ Firebase ML Kit for image recognition
- ✅ Basic analytics tracking
- ✅ Rule-based fraud detection

### Phase 2 (Future Enhancement)
- [ ] Integrate AWS Personalize for better recommendations
- [ ] Add OpenAI GPT-4 for advanced chatbot
- [ ] Cloud image recognition for better accuracy
- [ ] ML-based fraud detection with SageMaker

### Phase 3 (Advanced)
- [ ] Real-time inventory forecasting
- [ ] Dynamic pricing optimization
- [ ] Advanced customer behavior analysis
- [ ] Predictive analytics dashboard

## Components

### Chatbot Component
```tsx
import Chatbot from '@/components/ai/Chatbot';

<Chatbot userId={user.id} orderId={orderId} onClose={() => setShowChat(false)} />
```

### Product Recommendations Component
```tsx
import ProductRecommendations from '@/components/ai/ProductRecommendations';

<ProductRecommendations 
  categoryId={categoryId} 
  limit={10}
  title="Recommended for You"
/>
```

## API Routes

### POST `/api/ai/chat`
Chatbot endpoint using OpenAI.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Where is my order?" }
  ],
  "context": {
    "userId": "uuid",
    "orderId": "uuid"
  }
}
```

**Response:**
```json
{
  "response": "You can check your order status in the Orders section..."
}
```

### POST `/api/ai/vision`
Image recognition endpoint.

**Request:**
```json
{
  "imageUri": "https://..."
}
```

**Response:**
```json
{
  "labels": [
    { "name": "Product", "confidence": 0.95 }
  ],
  "text": "SKU-12345",
  "safeSearch": {
    "adult": false,
    "violence": false,
    "racy": false
  }
}
```

## Best Practices

1. **Graceful Degradation**: Always provide fallbacks when AI services fail
2. **User Privacy**: Don't send sensitive data to AI services
3. **Error Handling**: Log errors but don't expose details to users
4. **Testing**: Test with various inputs and edge cases
5. **Monitoring**: Track API usage and costs

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google Cloud AI](https://cloud.google.com/ai)
- [AWS AI Services](https://aws.amazon.com/machine-learning/)
- [Firebase ML Kit](https://firebase.google.com/docs/ml)
- [Azure Cognitive Services](https://azure.microsoft.com/en-us/products/cognitive-services)
