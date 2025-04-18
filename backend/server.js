const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = " "; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);

const getSolution = async (errorMessage) => {
  try {
    // const model = genAI.getGenerativeModel({ model: "models/gemini-pro" });
//     const models = await genAI.listModels();
// console.log(models);
const model = genAI.getGenerativeModel({ model: "models/text-bison-001" });

    const result = await model.generateContent(
      `You are a cybersecurity expert. Analyze the following error and assign a severity score (1-10), with 1 being minor and 10 being critical. Provide:
      1. A severity score.
      2. A short justification for the severity.
      3. A detailed remediation plan.
      
      Error: ${errorMessage}
      
      Return a JSON response in this format (without any markdown or formatting):
      {
        "severity": number,
        "justification": "string",
        "solution": "string"
      }`
    );

    let responseText = result.response.text();
    responseText = responseText.replace(/```json|```/g, "").trim();

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error fetching solution:", error);
    return { severity: 0, justification: "Unknown", solution: "Solution not available." };
  }
};


const getVulnerabilityGraph = async (errors) => {
  try {
    // const model = genAI.getGenerativeModel({ model: "models/gemini-pro" });
    const model = genAI.getGenerativeModel({ model: "models/text-bison-001" });

    const prompt = `
      You are a cybersecurity expert. Based on these errors:
      ${errors.join(", ")}
      Create a JSON graph structure showing:
      - Nodes: Errors and affected components.
      - Edges: Relationships like "Dependency", "Causes", or "Affects".
      
      Return JSON **without any markdown or formatting** in this exact format:
      {
        "nodes": [{ "id": 1, "label": "Issue", "group": "Severity" }],
        "edges": [{ "from": 1, "to": 2, "label": "Relationship" }]
      }
    `;

    const result = await model.generateContent(prompt);

    let responseText = result.response.text();

    // Remove Markdown Code Blocks if Present (Handles ```json ... ```)
    responseText = responseText.replace(/```json|```/g, "").trim();

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error generating vulnerability graph:", error);
    return { nodes: [], edges: [] };
  }
};


app.post("/api/get-solution", async (req, res) => {
  const { errors } = req.body;
  const solutions = {};

  for (const error of errors) {
    solutions[error] = await getSolution(error);
  }

  res.json(solutions);
});

app.post("/api/vulnerability-graph", async (req, res) => {
  const { errors } = req.body;
  const graphData = await getVulnerabilityGraph(errors);
  res.json(graphData);
});

app.listen(5000, () => console.log("Server running on port 5000"));
