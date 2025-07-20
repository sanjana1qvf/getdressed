import { openaiConfig } from '../../config/openai';
import { OutfitAnalysis } from '../../utils/types';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface AIAnalysisResponse {
  analysis: OutfitAnalysis | null;
  error: string | null;
}

// Helper function to convert image URI to base64 with Android compatibility
const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    console.log('Processing image URI:', uri);
    console.log('Platform:', Platform.OS);
    
    // Handle different URI formats
    let processedUri = uri;
    
    // For Android, ensure we have the correct file:// prefix
    if (Platform.OS === 'android') {
      if (!uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('http')) {
        processedUri = `file://${uri}`;
      }
    }
    
    // For iOS, ensure we have the correct file:// prefix if it's a local file
    if (Platform.OS === 'ios' && !uri.startsWith('file://') && !uri.startsWith('http')) {
      processedUri = `file://${uri}`;
    }
    
    console.log('Processed URI:', processedUri);
    
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(processedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Determine MIME type based on file extension or default to JPEG
    let mimeType = 'image/jpeg'; // default
    const lowerUri = uri.toLowerCase();
    
    if (lowerUri.includes('.png')) {
      mimeType = 'image/png';
    } else if (lowerUri.includes('.gif')) {
      mimeType = 'image/gif';
    } else if (lowerUri.includes('.webp')) {
      mimeType = 'image/webp';
    } else if (lowerUri.includes('.heic') || lowerUri.includes('.heif')) {
      mimeType = 'image/heic';
    }
    
    console.log('Detected MIME type:', mimeType);
    console.log('Base64 length:', base64.length);
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    console.error('Original URI:', uri);
    console.error('Platform:', Platform.OS);
    
    // Provide more specific error messages
    if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      throw new Error('Image file not found. Please try selecting the image again.');
    } else if (error.message.includes('permission')) {
      throw new Error('Permission denied. Please allow access to your photos.');
    } else if (error.message.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }
};

// Store previous analyses for consistency checking
let previousAnalyses: Array<{
  imageHash: string;
  analysis: any;
  timestamp: number;
}> = [];

// Simple hash function for image comparison (you could use more sophisticated image hashing)
const generateImageHash = (imageData: string): string => {
  // Simple hash based on image size and first few characters
  return `${imageData.length}_${imageData.substring(0, 100)}`;
};

// Enhanced consistency check for outfit similarity
const checkOutfitSimilarity = (imageData: string, currentAnalysis: any): any | null => {
  const currentHash = generateImageHash(imageData);
  
  // Check against ALL previous analyses (not just recent ones)
  for (const prev of previousAnalyses) {
    // If same image hash, return previous analysis immediately
    if (prev.imageHash === currentHash) {
      console.log('Found identical outfit, returning previous analysis for consistency');
      return prev.analysis;
    }
  }
  
  // For similar outfits, use stricter criteria
  const similarAnalyses = previousAnalyses.filter(prev => {
    const feedbackSimilarity = calculateFeedbackSimilarity(prev.analysis.feedback, currentAnalysis.feedback);
    const ratingDifference = Math.abs(prev.analysis.rating - currentAnalysis.rating);
    
    // Only consider very similar feedback (90%+ similarity) and small rating differences
    return feedbackSimilarity > 0.9 && ratingDifference < 1.0;
  });
  
  if (similarAnalyses.length > 0) {
    // Return the most recent similar analysis to maintain consistency
    const mostRecent = similarAnalyses[similarAnalyses.length - 1];
    console.log('Found very similar outfit, maintaining rating consistency');
    return mostRecent.analysis;
  }
  
  return null;
};

// Calculate similarity between feedback texts
const calculateFeedbackSimilarity = (feedback1: string, feedback2: string): number => {
  const words1 = feedback1.toLowerCase().split(/\s+/);
  const words2 = feedback2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
};

// Normalize rating to ensure consistency and be more critical in the 3-5.5 range
const normalizeRating = (rating: number): number => {
  // Ensure rating is between 0-10
  let normalized = Math.max(0, Math.min(10, rating));
  
  // For ratings in the dangerous 3-5.5 range, be slightly more critical
  if (normalized >= 3 && normalized <= 5.5) {
    // Round down slightly to be more critical
    normalized = Math.max(3, normalized - 0.5);
  }
  
  // Round to nearest 0.5 for consistency
  normalized = Math.round(normalized * 2) / 2;
  
  // If rating is very close to a whole number, round to whole number
  if (Math.abs(normalized - Math.round(normalized)) < 0.1) {
    normalized = Math.round(normalized);
  }
  
  return normalized;
};

export const openaiService = {
  // Analyze outfit using OpenAI Vision API - Brutally honest fashion stylist
  async analyzeOutfit(imageBase64: string): Promise<AIAnalysisResponse> {
    try {
      console.log('Sending request to OpenAI API...');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `You are a brutally honest, no-nonsense fashion critic. Your job is to give REAL, unfiltered feedback about outfits. Do NOT sugarcoat anything. Do NOT be nice just to be nice. Be direct, harsh, and brutally honest.

RATE THE OUTFIT OUT OF 10 (BE BRUTALLY HONEST):
- 10: Exceptional, magazine-worthy styling, perfect coordination
- 9: Excellent, very well-put-together, minor issues only
- 8: Very good, well-coordinated, small improvements needed
- 7: Good, decent styling, some issues but overall acceptable
- 6: Average, nothing special, basic styling
- 5: BELOW AVERAGE - This outfit has serious problems that make you look bad
- 4: POOR - This outfit is embarrassing and makes you look unprofessional
- 3: VERY POOR - This outfit is a fashion disaster that will get you judged
- 2: BAD - This outfit is so bad it's almost comical
- 1: TERRIBLE - Complete fashion failure, you'll be laughed at
- 0: UNACCEPTABLE - Worst possible styling, don't leave the house

CRITICAL RATING RULES (3-5.5 RANGE):
- If rating is 3-5.5, think: "Would I be embarrassed to be seen in this?"
- Consider how others will actually perceive this outfit in real life
- Be EXTRA critical of outfits in this range - they're the most dangerous
- A 5 rating means "This outfit will make you look bad to others"
- Don't sugarcoat - if it looks bad, rate it accordingly
- Think like a normal person seeing this outfit on the street

BE BRUTALLY HONEST ABOUT (ONLY THE OUTFIT):
- Color combinations that clash
- Poor fit and proportions of the clothing
- Cheap-looking clothing items
- Outdated or tacky clothing choices
- Lack of effort in outfit coordination
- Inappropriate clothing for the occasion
- Missing essential clothing elements

IMPORTANT: ONLY JUDGE THE CLOTHING ITSELF:
- Ignore lighting, photo quality, camera angles, or posing
- Ignore background, setting, or environment
- Ignore the person's appearance, body type, or how they look
- Focus ONLY on the actual clothing items and how they work together
- Judge the outfit as if it were on a mannequin or hanger

GIVE FEEDBACK IN 3 BULLET POINTS MAX:
- Be direct and specific about the biggest problems with the CLOTHING
- Use harsh but constructive language about the outfit choices
- Focus on the most critical clothing issues first
- For ratings 3-5.5: Be EXTRA critical - these outfits will embarrass you
- Think: "How would this outfit look on a mannequin?"
- Example: "• The color combination is atrocious and clashes horribly"
- Example: "• The clothing fit is completely wrong and unflattering"
- Example: "• These shoes are cheap and ruin the whole outfit"

SUGGEST 3 SPECIFIC IMPROVEMENTS:
- Be extremely specific about what to change
- Suggest exact alternatives (e.g., "Replace with navy chinos")
- Focus on the biggest problems first
- Give actionable, concrete advice

DETERMINE THE BEST OCCASION:
- Be honest about where this would work
- If it doesn't work anywhere, say "No appropriate occasion"

RESPOND WITH ONLY THIS JSON FORMAT:
{
  "rating": 4.5,
  "occasion": "Casual",
  "suggestions": ["Replace the cheap sneakers with proper leather loafers", "The shirt is too tight - size up to medium", "Add a structured blazer to balance the proportions"],
  "feedback": "• The bright colors clash horribly and make you look like a traffic cone • The fit is completely wrong - everything is either too tight or too loose • This looks like you grabbed random clothes without any thought"
}

If no clothing visible:
{"error": "No outfit detected. Please upload a clear photo where your clothing is completely visible and well-lit."}

REMEMBER: Be brutally honest about the CLOTHING ONLY. Don't hold back. The user needs real feedback about their outfit choices, not compliments. Keep feedback to 3 bullet points maximum.

MOST IMPORTANT: For ratings 3-5.5, be EXTRA critical. These are the most dangerous ratings because they can mislead users into thinking their outfit is "okay" when it's actually embarrassing. Think like a real person seeing this outfit on a mannequin - would you be embarrassed to be seen wearing it? Rate accordingly.

FOCUS ONLY ON THE CLOTHING: Ignore photo quality, lighting, posing, background, or the person's appearance. Judge the outfit as if it were hanging on a rack.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64,
                  },
                },
              ],
            },
          ],
          max_tokens: 800,
          temperature: 0.3, // Lower temperature for more consistent responses
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        
        // Handle specific API errors
        if (response.status === 401) {
          return { analysis: null, error: 'API key is invalid or expired' };
        } else if (response.status === 429) {
          return { analysis: null, error: 'Rate limit exceeded. Please try again in a moment.' };
        } else if (response.status === 500) {
          return { analysis: null, error: 'AI service is temporarily unavailable. Please try again.' };
        } else if (response.status === 400) {
          return { analysis: null, error: 'Invalid request. Please try with a different image.' };
        } else {
          return { analysis: null, error: `API Error: ${errorData.error?.message || 'Unknown error'}` };
        }
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return { analysis: null, error: 'No analysis received from AI' };
      }

      console.log('Raw AI response:', content);

      // Clean the response - remove markdown formatting if present
      let cleanContent = content.trim();
      
      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Remove any actual newlines that might be in the JSON (they're invalid)
      // Replace all newlines with spaces to make JSON valid
      cleanContent = cleanContent.replace(/\n/g, ' ');

      // Parse the JSON response
      try {
        const analysis = JSON.parse(cleanContent);
        
        // Check if AI returned an error message for unclear image
        if (analysis.error) {
          return { analysis: null, error: analysis.error };
        }
        
        // Validate the response structure
        if (!analysis.rating || !analysis.occasion || !analysis.suggestions || !analysis.feedback) {
          return { analysis: null, error: 'Invalid analysis format received' };
        }

        // Clean up the feedback - convert bullet points to proper formatting
        const cleanFeedback = analysis.feedback
          .replace(/\\n/g, '\n')  // Handle any escaped newlines
          .replace(/• /g, '\n• ') // Add newlines before bullet points
          .replace(/^\n/, '');    // Remove leading newline

        const outfitAnalysis: OutfitAnalysis = {
          rating: normalizeRating(parseFloat(analysis.rating)), // Normalize rating for consistency
          occasion: analysis.occasion,
          suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
          feedback: cleanFeedback,
        };

        // Check for outfit similarity and maintain consistency
        const similarAnalysis = checkOutfitSimilarity(imageBase64, outfitAnalysis);
        if (similarAnalysis) {
          console.log('Returning consistent analysis for similar outfit');
          return { analysis: similarAnalysis, error: null };
        }

                // Store this analysis for future consistency checks
        const analysisEntry = {
          imageHash: generateImageHash(imageBase64),
          analysis: outfitAnalysis,
          timestamp: Date.now(),
        };
        
        previousAnalyses.push(analysisEntry);

        // Keep only last 50 analyses to prevent memory issues (increased for better consistency)
        if (previousAnalyses.length > 50) {
          previousAnalyses = previousAnalyses.slice(-50);
        }
        
        console.log(`Stored analysis with rating ${outfitAnalysis.rating} for consistency tracking`);

        console.log('Parsed analysis:', outfitAnalysis);
        return { analysis: outfitAnalysis, error: null };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw content that failed to parse:', content);
        console.error('Cleaned content that failed to parse:', cleanContent);
        
        // Try to extract JSON from the response if it's wrapped in markdown
        try {
          // Look for JSON content between curly braces
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = jsonMatch[0];
            // Remove any actual newlines that might be in the extracted JSON
            const cleanedExtractedJson = extractedJson.replace(/\n/g, ' ');
            const analysis = JSON.parse(cleanedExtractedJson);
            
            if (analysis.error) {
              return { analysis: null, error: analysis.error };
            }
            
            if (!analysis.rating || !analysis.occasion || !analysis.suggestions || !analysis.feedback) {
              return { analysis: null, error: 'Invalid analysis format received' };
            }

            const cleanFeedback = analysis.feedback
              .replace(/\\n/g, '\n')  // Handle any escaped newlines
              .replace(/• /g, '\n• ') // Add newlines before bullet points
              .replace(/^\n/, '');    // Remove leading newline

            const outfitAnalysis: OutfitAnalysis = {
              rating: normalizeRating(parseFloat(analysis.rating)), // Normalize rating for consistency
              occasion: analysis.occasion,
              suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
              feedback: cleanFeedback,
            };

            // Check for outfit similarity and maintain consistency
            const similarAnalysis = checkOutfitSimilarity(imageBase64, outfitAnalysis);
            if (similarAnalysis) {
              console.log('Returning consistent analysis for similar outfit');
              return { analysis: similarAnalysis, error: null };
            }

            // Store this analysis for future consistency checks
            const analysisEntry = {
              imageHash: generateImageHash(imageBase64),
              analysis: outfitAnalysis,
              timestamp: Date.now(),
            };
            
            previousAnalyses.push(analysisEntry);

            // Keep only last 50 analyses to prevent memory issues (increased for better consistency)
            if (previousAnalyses.length > 50) {
              previousAnalyses = previousAnalyses.slice(-50);
            }
            
            console.log(`Stored extracted analysis with rating ${outfitAnalysis.rating} for consistency tracking`);

            console.log('Extracted and parsed analysis:', outfitAnalysis);
            return { analysis: outfitAnalysis, error: null };
          }
        } catch (extractError) {
          console.error('Failed to extract JSON:', extractError);
        }
        
        // Check if the response indicates unclear image
        if (cleanContent.toLowerCase().includes('unable to view') || 
            cleanContent.toLowerCase().includes('cannot see') ||
            cleanContent.toLowerCase().includes('no outfit') ||
            cleanContent.toLowerCase().includes('unclear')) {
          return { 
            analysis: null, 
            error: 'Please upload a clear photo of your outfit. Make sure the image shows your clothing clearly and is well-lit.' 
          };
        }
        
        return { analysis: null, error: 'Failed to parse AI analysis' };
      }
    } catch (error) {
      console.error('OpenAI service error:', error);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        return { analysis: null, error: 'Request timed out. Please try again.' };
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return { analysis: null, error: 'Network error. Please check your internet connection.' };
      } else if (error.message.includes('Failed to fetch')) {
        return { analysis: null, error: 'Unable to connect to AI service. Please try again.' };
      } else {
        return { analysis: null, error: 'An unexpected error occurred during analysis' };
      }
    }
  },

  // Get outfit suggestions based on occasion
  async getOutfitSuggestions(occasion: string, style: string = 'modern'): Promise<{
    suggestions: string[] | null;
    error: string | null;
  }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: `Provide 5 specific outfit suggestions for a ${occasion} occasion with a ${style} style. 
              Format as a JSON array of strings. Each suggestion should be specific and actionable.`,
            },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { suggestions: null, error: `API Error: ${errorData.error?.message || 'Unknown error'}` };
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return { suggestions: null, error: 'No suggestions received from AI' };
      }

      try {
        const suggestions = JSON.parse(content);
        return { suggestions: Array.isArray(suggestions) ? suggestions : [], error: null };
      } catch (parseError) {
        console.error('Error parsing suggestions:', parseError);
        return { suggestions: null, error: 'Failed to parse suggestions' };
      }
    } catch (error) {
      console.error('Get suggestions error:', error);
      return { suggestions: null, error: 'An unexpected error occurred' };
    }
  },

  // Get style advice based on user preferences
  async getStyleAdvice(preferences: string): Promise<{
    advice: string | null;
    error: string | null;
  }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: `Provide personalized style advice based on these preferences: ${preferences}. 
              Give 2-3 specific, actionable tips that would help improve their style.`,
            },
          ],
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { advice: null, error: `API Error: ${errorData.error?.message || 'Unknown error'}` };
      }

      const data = await response.json();
      const advice = data.choices[0]?.message?.content;

      return { advice: advice || null, error: null };
    } catch (error) {
      console.error('Get style advice error:', error);
      return { advice: null, error: 'An unexpected error occurred' };
    }
  },
};

// Main function to analyze outfit from image URI
export const analyzeOutfitWithAI = async (imageUri: string): Promise<{
  overallRating: number;
  feedback: string;
  suggestions: string[];
  occasion: string;
}> => {
  try {
    const base64Image = await convertImageToBase64(imageUri);
    const result = await openaiService.analyzeOutfit(base64Image);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (!result.analysis) {
      throw new Error('No analysis received');
    }
    
    return {
      overallRating: result.analysis.rating,
      feedback: result.analysis.feedback,
      suggestions: result.analysis.suggestions,
      occasion: result.analysis.occasion,
    };
  } catch (error) {
    console.error('Error in analyzeOutfitWithAI:', error);
    throw error;
  }
}; 