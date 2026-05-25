import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API brainstorm route
app.post("/api/ai/brainstorm", async (req, res) => {
  try {
    const { topic, contextNode } = req.body;
    
    const prompt = contextNode 
      ? `Given the mind map node "${contextNode.text}", suggest 5-8 related child topics/ideas for the main topic of "${topic}".`
      : `Generate a structured mind map outline for the topic: "${topic}". Include a central concept and 5-7 main branches.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["text"]
              }
            }
          },
          required: ["suggestions"]
        },
        systemInstruction: "You are a creative brainstorming assistant. Provide structured ideas for a mind map in JSON format."
      }
    });

    res.json(JSON.parse(response.text || '{"suggestions":[]}'));
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
