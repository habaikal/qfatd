
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || "DUMMY_API_KEY_FOR_DEMO";
const ai = new GoogleGenAI({ apiKey });

export const getMarketAnalysis = async (marketData: any, portfolio: any) => {
  const prompt = `Analyze current market data and portfolio state:
    Market: ${JSON.stringify(marketData.slice(-5))}
    Portfolio: ${JSON.stringify(portfolio)}
    Provide a professional, concise summary of market sentiment, potential risks, and optimization suggestions for the trading bots.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        systemInstruction: "You are an expert quantitative trading analyst. Provide actionable insights based on data."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Market Analysis Error:", error);
    return "Unable to retrieve AI analysis at this time.";
  }
};

export const getStrategyAdvice = async (strategyName: string, performance: any) => {
  const prompt = `Review the performance of strategy "${strategyName}":
    Performance Data: ${JSON.stringify(performance)}
    Suggest one specific technical improvement or parameter adjustment to increase the win rate.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        systemInstruction: "You are a senior algorithmic developer."
      }
    });
    return response.text;
  } catch (error) {
    return "Check algorithm logs for technical details.";
  }
};
