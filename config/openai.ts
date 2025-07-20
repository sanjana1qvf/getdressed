import { OPENAI_API_KEY } from '@env';

export const openaiConfig = {
  apiKey: OPENAI_API_KEY || '',
  baseURL: 'https://api.openai.com/v1',
};

export default openaiConfig; 