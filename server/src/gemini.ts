import { GoogleGenAI } from "@google/genai";
import { Card } from "./db";

export const getMarketInsight = async (card: Card): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing");
        return "API Key is missing. Please configure your environment.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
    I am a sports card collector. I have the following card in my collection:
    
    Player: ${card.player}
    Sport: ${card.sport}
    Year: ${card.year}
    Brand: ${card.brand}
    Series: ${card.series}
    Card Type: ${card.cardType}
    Serial Number: ${card.serialNumber || 'N/A'}
    
    Graded: ${card.graded ? 'Yes' : 'No'}
    ${card.graded ? `Grading Details: ${card.gradeCompany} ${card.gradeValue} (Cert: ${card.certNumber || 'N/A'})` : ''}

    Purchase Price: ${card.purchasePrice} ${card.currency}
    Current Estimated Value: ${card.currentValue} ${card.currency}

    Please provide a concise market analysis (max 150 words). 
    1. Is this card generally considered a "Hold", "Sell", or "Buy More"?
    2. What key factors affect its value (e.g., player performance, population count)?
    3. A rough, conservative estimate range if you have historical data (disclaimer that it is an estimate).
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        return response.text || "No insight available at this time.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Unable to fetch market insights at this moment. Please try again later.";
    }
};
