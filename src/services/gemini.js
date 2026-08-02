import { GoogleGenerativeAI } from "@google/generative-ai";
import { STARTUP_ANALYSIS_PROMPT } from "../utils/prompts";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Gemini API Key not found.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function testGemini() {
  try {
    const result = await model.generateContent(
      "Reply with only: Gemini connection successful."
    );

    return result.response.text();
  } catch (error) {
    console.error("Gemini Test Error:", error);
    throw error;
  }
}

export async function analyzeStartup(formData, tavilyData) {
  try {
    console.log("==================================");
    console.log("🚀 STARTING GEMINI ANALYSIS");
    console.log("==================================");

    const prompt = STARTUP_ANALYSIS_PROMPT(
      formData,
      tavilyData
    );

    console.log("Prompt Generated Successfully");

    const result = await model.generateContent(prompt);

    const response = result.response;

    let text = response.text();

    console.log("========== RAW GEMINI RESPONSE ==========");
    console.log(text);
    console.log("=========================================");

    // Remove markdown if Gemini returns it
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Extract JSON safely
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("Gemini did not return valid JSON.");
    }

    const jsonString = text.slice(start, end + 1);

    let report;

try {
  report = JSON.parse(jsonString);
} catch (e) {
  console.log("INVALID JSON RECEIVED:");
  console.log(jsonString);

  throw new Error(
    "Gemini returned invalid JSON. Please try again."
  );
}

if (report?.status === "invalid") {
  throw new Error(
    report.reason ||
    "The startup information is insufficient for AI analysis."
  );
}

const requiredFields = [
  "overallScore",
  "originalityScore",
  "marketScore",
  "riskScore",
  "summary",
  "competitors",
  "swot",
  "recommendations",
];

for (const field of requiredFields) {
  if (!(field in report)) {
    throw new Error(`Gemini response missing "${field}"`);
  }
}


    if (report.status === "invalid") {
      throw new Error(
        report.reason ||
        "The startup information is insufficient for AI analysis."
      );
    }

    console.log("========== PARSED REPORT ==========");
    console.log(report);
    console.log("===================================");

    return report;
  } 
  
catch (error) {
  console.error("==================================");
  console.error("GEMINI ANALYSIS ERROR");
  console.error(error);
  console.error("==================================");

  throw new Error(
    error?.message ||
    error?.toString() ||
    "Gemini Analysis Failed"
  );
}
}