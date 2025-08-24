import OpenAI from "openai";

// This is not recommended for production apps.
// Your API key is exposed on the client side.
// It is recommended to have a backend server that makes the API calls to OpenAI.
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default openai;
