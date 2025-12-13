

import { GoogleGenAI, Type, Schema, Chat, GenerateContentResponse } from "@google/genai";
import { HomeworkResponse, VisualValidation, WebSource, MathLabResponse, ExamConfig, VideoAnalysisMetadata, FactCheckItem, GradingAudit } from "../types";

// --- MODEL CONFIGURATION ---
// Strategy: Use Gemini 3 Pro (Smart) for reasoning, fall back to Flash (Fast) for quota safety.
const MODEL_SMART = "gemini-3-pro-preview"; // Limit: 25 RPM (Reasoning, Math, Vision)
const MODEL_FAST = "gemini-2.5-flash";      // Limit: 1000+ RPM (Chat, Tuning, Text)
const MODEL_IMAGE_SMART = "gemini-3-pro-image-preview"; // Limit: 20 RPM
const MODEL_IMAGE_FAST = "gemini-2.5-flash-image";      // Limit: 500 RPM

// Track active sessions
let chatSession: Chat | null = null;
let chatModelUsed: string = MODEL_FAST;
let examSession: Chat | null = null;
let examModelUsed: string = MODEL_FAST;

// Helper to get a fresh instance with the latest key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILS ---

/**
 * Safely parses JSON from AI response, handling markdown fences if present.
 */
const cleanAndParseJSON = (text: string | undefined): any => {
  if (!text) return {};
  
  // Attempt to find JSON object boundaries
  const firstOpen = text.indexOf('{');
  const lastClose = text.lastIndexOf('}');
  
  // Try rigorous extraction first if boundaries exist
  if (firstOpen !== -1 && lastClose !== -1) {
      const candidate = text.substring(firstOpen, lastClose + 1);
      try {
          return JSON.parse(candidate);
      } catch (e) {
          // Fall through to loose cleaning
      }
  }

  let cleaned = text.trim();
  // Remove markdown code blocks if the model wrapped them
  if (cleaned.startsWith("```")) {
    // Remove the opening fence (e.g., ```json or just ```)
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "");
    // Remove the closing fence
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("JSON Parse Failed on:", text);
    return {};
  }
};

// --- SMART HYBRID CALLER ---

/**
 * Executes an AI operation with automatic fallback handling.
 * Returns both the result and the name of the model that successfully executed the task.
 */
async function callAI<T>(
  operationName: string,
  apiCall: (modelId: string) => Promise<T>,
  primaryModel: string = MODEL_SMART,
  fallbackModel: string | null = MODEL_FAST
): Promise<{ output: T, model: string }> {
  const attemptCall = async (model: string): Promise<{ output: T, model: string }> {
    try {
      // console.log(`[${operationName}] Calling ${model}...`); 
      const result = await apiCall(model);
      return { output: result, model };
    } catch (error: any) {
      const msg = error?.message || JSON.stringify(error);
      const isQuota = error?.status === 429 || msg.includes('429') || msg.includes('quota');
      
      if (isQuota) {
        throw new Error("QUOTA_EXCEEDED");
      }
      throw error;
    }
  };

  try {
    return await attemptCall(primaryModel);
  } catch (error: any) {
    if (error.message === "QUOTA_EXCEEDED" && fallbackModel) {
      console.warn(`[${operationName}] Quota limit on ${primaryModel}. Fallback to ${fallbackModel}.`);
      return await attemptCall(fallbackModel);
    }
    throw error; // Propagate other errors or if no fallback
  }
}

// --- HOMEWORK HELPER ---

const tuningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    topic: { type: Type.STRING },
    has_student_solution: { type: Type.BOOLEAN },
    grading_rules: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["subject", "topic", "has_student_solution", "grading_rules"]
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    problems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          problem_statement: { type: Type.STRING },
          student_answer: { type: Type.STRING, nullable: true },
          is_correct: { type: Type.BOOLEAN, nullable: true },
          error_location: {
            type: Type.OBJECT,
            properties: { ymin: { type: Type.NUMBER }, xmin: { type: Type.NUMBER }, ymax: { type: Type.NUMBER }, xmax: { type: Type.NUMBER } },
            nullable: true
          },
          complete_solution: { type: Type.STRING },
          step_by_step: { type: Type.ARRAY, items: { type: Type.STRING } },
          key_concepts: { type: Type.ARRAY, items: { type: Type.STRING } },
          visual_aid_prompt: { type: Type.STRING, nullable: true },
          validation_check: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["verified", "warning"] },
              confidence_score: { type: Type.INTEGER },
              rendering_note: { type: Type.STRING, nullable: true }
            },
            required: ["status", "confidence_score"]
          }
        },
        required: ["problem_statement", "complete_solution", "step_by_step", "key_concepts", "validation_check"]
      }
    }
  },
  required: ["problems"]
};

export const analyzeHomework = async (
  input: { type: 'image' | 'text', data: string, mimeType?: string, textContext?: string },
  onStatusUpdate?: (status: string) => void
): Promise<HomeworkResponse> => {
  try {
    const ai = getAI();
    let inputParts: any[] = [];
    if (input.type === 'image') {
       inputParts = [{ inlineData: { data: input.data, mimeType: input.mimeType || 'image/jpeg' } }];
    } else {
       inputParts = [{ text: input.data }];
    }
    
    // Append extracted text context if available (improves accuracy for PDF/Text heavy)
    if (input.textContext) {
        inputParts.push({ text: `\n[EXTRACTED TEXT CONTEXT FROM FILE]:\n${input.textContext}\n` });
    }
    
    // STEP 1: Auto-Tuning (Use FAST model to save quota)
    if (onStatusUpdate) onStatusUpdate("Identifying subject and grading rules...");
    const tuningPrompt = `Analyze this input. Identify subject/topic. List 3 grading rules. Return JSON.`;

    const tuningRes = await callAI<GenerateContentResponse>(
      "Auto-Tuning", 
      (model) => ai.models.generateContent({
        model,
        contents: { parts: [...inputParts, { text: tuningPrompt }] },
        config: { responseMimeType: "application/json", responseSchema: tuningSchema }
      }),
      MODEL_FAST, // Primary
      null        // No fallback needed for Flash
    );

    const contextData = cleanAndParseJSON(tuningRes.output.text);
    const { subject, topic, has_student_solution, grading_rules } = contextData;

    // STEP 2: Deep Analysis (Use SMART model, fallback to FAST)
    if (onStatusUpdate) onStatusUpdate(`Applying ${subject} grading protocols...`);
    
    // STRICT PROMPT ENGINEERING FOR SPATIAL REASONING
    const executionPrompt = `
      Expert Professor in ${subject}. 
      RULES: ${grading_rules ? grading_rules.join(', ') : 'Standard grading'}. 
      
      TASK:
      1. Analyze the image visually pixel-by-pixel.
      2. Identify specific errors in the student's work.
      3. CRITICAL: For each error, you MUST provide precise bounding box coordinates in 'error_location' using a 0-1000 scale (ymin, xmin, ymax, xmax).
         - The box MUST tightly enclose the specific part of the handwriting that is incorrect.
         - Do not guess. If you cannot see the error clearly, mark it generally.
      4. Provide 'complete_solution' and 'step_by_step' corrections.
      5. If visual aid needed, provide 'visual_aid_prompt'.
      
      Return structured JSON.
    `;

    const analysisRes = await callAI<GenerateContentResponse>(
      "Deep Execution", 
      (model) => ai.models.generateContent({
        model,
        contents: { parts: [...inputParts, { text: executionPrompt }] },
        config: { responseMimeType: "application/json", responseSchema: analysisSchema, temperature: 0.1 }, // Low temperature for deterministic coords
      }),
      MODEL_SMART, // Try Gemini 3 Pro
      MODEL_FAST   // Fallback to Flash
    );

    const rawResponse = cleanAndParseJSON(analysisRes.output.text);
    
    // Ensure structure
    if (!rawResponse.problems) rawResponse.problems = [];

    // STEP 3: LOGIC RE-GENERATION & VERIFICATION LOOP (Reflexion)
    // Identify problems that the model itself flagged as low confidence or warning
    const problemsToRefine = rawResponse.problems.filter((p: any) => 
        p.validation_check?.status === 'warning' || (p.validation_check?.confidence_score || 0) < 80
    );

    if (problemsToRefine.length > 0) {
        if (onStatusUpdate) onStatusUpdate(`Self-correcting ${problemsToRefine.length} complex problems...`);
        
        const refinePrompt = `
          CRITICAL REVIEW: You previously analyzed the following problems but flagged them with low confidence/warnings.
          
          PROBLEMS TO REFINE: ${JSON.stringify(problemsToRefine)}
          
          Your Goal:
          1. Re-read the problem statement from the original input.
          2. Check the 'error_location' bounding boxes. Are they accurately targeting the mistake? If they seem wrong, adjust the coordinates (0-1000 scale).
          3. Address the 'rendering_note' or 'warning' specifically.
          4. Provide a corrected, high-confidence analysis for THESE problems only.
          
          Return JSON with key "problems" containing the corrected list.
        `;

        try {
            const refineRes = await callAI<GenerateContentResponse>(
                "Analysis Refinement",
                (model) => ai.models.generateContent({
                    model,
                    contents: { parts: [...inputParts, { text: refinePrompt }] },
                    config: { responseMimeType: "application/json", responseSchema: analysisSchema }
                }),
                MODEL_SMART, // Force SMART model for correction
                null
            );
            
            const refinedData = cleanAndParseJSON(refineRes.output.text);
            if (refinedData.problems && refinedData.problems.length > 0) {
                 // Merge corrected problems back into the original array
                 // We match based on the problem statement similarity or index if preserved
                 refinedData.problems.forEach((fixedP: any) => {
                     // Find index in original array
                     const index = rawResponse.problems.findIndex((p: any) => 
                        p.problem_statement === fixedP.problem_statement || 
                        p.student_answer === fixedP.student_answer
                     );
                     
                     if (index !== -1) {
                         rawResponse.problems[index] = {
                             ...fixedP,
                             validation: { status: 'verified', confidenceScore: 99, renderingNote: "AI Self-Corrected" }
                         };
                     }
                 });
            }
        } catch (e) {
            console.warn("Refinement step failed, falling back to original analysis", e);
        }
    }

    return {
      hasStudentSolution: has_student_solution,
      modelUsed: analysisRes.model, // REPORT MODEL USED
      problems: rawResponse.problems.map((p: any, index: number) => ({
        id: index + 1,
        subject: subject, topic: topic, isCorrect: p.is_correct,
        boundingBox: p.error_location, explanation: p.complete_solution,
        steps: p.step_by_step, problemStatement: p.problem_statement,
        keyConcepts: p.key_concepts, studentAnswer: p.student_answer,
        visualAidPrompt: p.visual_aid_prompt,
        validation: p.validation_check ? {
          status: p.validation_check.status,
          confidenceScore: p.validation_check.confidence_score,
          renderingNote: p.validation_check.rendering_note
        } : (p.validation || undefined) // Handle refined structure
      }))
    } as HomeworkResponse;

  } catch (error) { throw error; }
};

// --- VISUAL GENERATION ---

export const generateVerifiedVisualAid = async (
    problemStatement: string, prompt: string, context?: { subject: string, topic: string }
): Promise<{ type: 'image', content: string, validation: VisualValidation }> => {
  const ai = getAI();
  let imagePrompt = `Educational diagram: "${prompt}". White background. Clear labels. High contrast.`;
  
  // Generation: Try High-Quality Image model first
  const genRes = await callAI<GenerateContentResponse>(
    "Image Gen", 
    (model) => ai.models.generateContent({
        model,
        contents: { parts: [{ text: imagePrompt }] },
        config: { imageConfig: { aspectRatio: "4:3", imageSize: "1K" } } // imageSize only works on Pro, but Flash ignores it gracefully
    }),
    MODEL_IMAGE_SMART,
    MODEL_IMAGE_FAST
  );

  let content = "";
  const parts = genRes.output.candidates?.[0]?.content?.parts;
  if (parts) {
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              content = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
          }
      }
  }
  if (!content) throw new Error("No image generated.");

  // Validation: Use Fast model
  const valRes = await callAI<GenerateContentResponse>(
      "Vis Val", 
      (model) => ai.models.generateContent({
        model,
        contents: { parts: [
            { text: `Verify if image matches: "${problemStatement}". JSON: { "isAccurate": boolean, "critique": string }` },
            { inlineData: { data: content.split(',')[1], mimeType: 'image/png' } }
        ]},
        config: { responseMimeType: "application/json" }
      }),
      MODEL_FAST,
      null
  );
  
  return { 
      type: 'image', 
      content, 
      validation: { 
          ...cleanAndParseJSON(valRes.output.text),
          modelUsed: genRes.model // Report generation model
      } 
  };
};

// --- CHAT ---

export const initializeChat = (input: { type: 'image' | 'text', data: string, textContext?: string }, onStatus?: (s: string) => void) => {
  const ai = getAI();
  // Chat uses FAST model for responsiveness and higher quota
  return callAI<GenerateContentResponse>(
    "Init Chat", 
    async (model) => {
        chatSession = ai.chats.create({
            model: model,
            config: { systemInstruction: "Helpful AI Tutor. Use Google Search for facts.", tools: [{ googleSearch: {} }] }
        });
        chatModelUsed = model; // Store model for subsequent messages
        
        const messageParts: any[] = [];
        if (input.type === 'image') {
            messageParts.push({ inlineData: { data: input.data, mimeType: 'image/jpeg' } });
        } else {
            messageParts.push({ text: input.data });
        }
        
        if (input.textContext) {
            messageParts.push({ text: `Context:\n${input.textContext}` });
        } else {
            messageParts.push({ text: "Context." });
        }

        return chatSession.sendMessage({ message: messageParts });
    },
    MODEL_FAST, 
    null
  );
};

export const sendChatMessage = async (message: string, useSearch: boolean = false): Promise<{text: string, sources?: WebSource[], modelUsed: string}> => {
  if (!chatSession) throw new Error("Chat not initialized");
  // Chat session is already tied to a model
  const result = await chatSession.sendMessage({ message });
  const sources: WebSource[] = [];
  result.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
    if (c.web) sources.push({ uri: c.web.uri, title: c.web.title });
  });
  return { 
      text: result.text || "", 
      sources: sources.length ? sources : undefined,
      modelUsed: chatModelUsed
  };
};

// --- VIDEO TUTOR ---

// Shared Schema for Video analysis to ensure robust structured data
const videoAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING },
    transcribed_text: { type: Type.STRING, description: "Verbatim text visible on board/screen" },
    fact_checks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          claim: { type: Type.STRING },
          verdict: { type: Type.STRING, enum: ["verified", "disputed", "outdated"] },
          correction: { type: Type.STRING },
          source: { type: Type.STRING }
        }
      }
    }
  },
  required: ["analysis"]
};

export const analyzeVideoFrame = async (
    frameData: string, 
    question: string, 
    timestamp: number,
    factCheck: boolean = false
): Promise<{ text: string, modelUsed: string, sources?: WebSource[], videoMetadata?: VideoAnalysisMetadata }> => {
    const ai = getAI();
    
    let prompt = `
      The user is watching a video. 
      This image is the frame at timestamp ${new Date(timestamp * 1000).toISOString().substr(11, 8)}.
      User Question: "${question}"
      Analyze the whiteboard/screen content in this frame carefully.
    `;
    
    if (factCheck) {
        prompt += " IMPORTANT: Verify any facts visible on screen. Return structured JSON with 'fact_checks' and 'transcribed_text'.";
    } else {
        prompt += " Return structured JSON with 'analysis' and 'transcribed_text' if applicable.";
    }

    const res = await callAI<GenerateContentResponse>(
        "Video Frame", 
        (model) => ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { data: frameData, mimeType: 'image/jpeg' } },
                    { text: prompt }
                ]
            },
            config: { 
                responseMimeType: "application/json",
                responseSchema: videoAnalysisSchema,
                tools: factCheck ? [{ googleSearch: {} }] : undefined
            }
        }),
        MODEL_SMART,
        MODEL_FAST
    );
    
    const output = cleanAndParseJSON(res.output.text);
    
    const sources: WebSource[] = [];
    res.output.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
      if (c.web) sources.push({ uri: c.web.uri, title: c.web.title });
    });

    const metadata: VideoAnalysisMetadata = {
        ocrText: output.transcribed_text,
        factChecks: output.fact_checks
    };

    return { 
        text: output.analysis || "Analysis complete.", 
        modelUsed: res.model,
        sources: sources.length ? sources : undefined,
        videoMetadata: metadata
    };
};

export const analyzeYoutubeSegment = async (
    youtubeUrl: string,
    question: string,
    timestamp: number,
    factCheck: boolean = false,
    scope: 'timestamp' | 'full' = 'timestamp'
): Promise<{text: string, sources?: WebSource[], modelUsed: string, videoMetadata?: VideoAnalysisMetadata}> => {
    const ai = getAI();
    const timeString = new Date(timestamp * 1000).toISOString().substr(11, 8);
    
    let prompt = `
        I am analyzing a specific YouTube video: ${youtubeUrl}
        Current Timestamp: ${timeString}.
        User Question: "${question}"

        TASK:
        1. Use Google Search to find the transcript, detailed summaries, or scene-by-scene breakdowns of this video.
        2. Answer the user's question based *strictly* on the search results.
        3. If you cannot find specific visual details for this timestamp via search, state: "I cannot directly see YouTube visuals, but based on summaries..." and give your best estimate found in text.
        4. Do NOT hallucinate content.

        ${scope === 'full' ? 'Analyze the video broadly.' : 'Focus on the context around the provided timestamp.'}
        ${factCheck ? "IMPORTANT: Verify any claims found against reliable external sources." : ""}
    `;

    const res = await callAI<GenerateContentResponse>(
        "YouTube Analysis", 
        (model) => ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: { 
                responseMimeType: "application/json",
                responseSchema: videoAnalysisSchema,
                tools: [{ googleSearch: {} }] 
            }
        }),
        MODEL_SMART,
        MODEL_FAST
    );

    const output = cleanAndParseJSON(res.output.text);
    const sources: WebSource[] = [];
    res.output.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
      if (c.web) sources.push({ uri: c.web.uri, title: c.web.title });
    });

    const metadata: VideoAnalysisMetadata = {
        ocrText: output.transcribed_text,
        factChecks: output.fact_checks
    };

    return { 
        text: output.analysis || "Analysis complete.", 
        sources: sources.length ? sources : undefined,
        modelUsed: res.model,
        videoMetadata: metadata
    };
};

// --- MATH LAB ---

export const convertTextToMath = async (text: string): Promise<string> => {
    const ai = getAI();
    // Strengthened prompt to prevent full document generation and enforce pure math syntax
    const prompt = `
        Act as a mathematical formatter. Convert the following text input into a standard LaTeX expression.
        Input: "${text}"
        
        Rules:
        1. Output ONLY the raw LaTeX string. No markdown formatting (\`\`\`), no explanations.
        2. Do NOT generate a full LaTeX document (no \\documentclass, \\usepackage).
        3. If the input is a request to plot/graph, simply output the function equation in LaTeX (e.g., "y = x^2").
        4. Strip any display math delimiters like \\[ \\] or $$.
    `;
    
    // Simple task -> FAST model
    const res = await callAI<GenerateContentResponse>(
        "Math Convert", 
        (model) => ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] }
        }),
        MODEL_FAST,
        null
    );
    
    let latex = res.output.text || "";
    // Clean up code blocks
    latex = latex.replace(/```latex/gi, '').replace(/```/g, '').trim();
    // Clean up math delimiters to ensure consistency
    latex = latex.replace(/^\\\[/, '').replace(/\\\]$/, '').replace(/^\$\$/, '').replace(/\$\$$/, '').trim();
    return latex;
};

export const solveMathWithCode = async (
    problem: string, 
    verifiedLatex?: string, 
    useSearch: boolean = false, 
    history: string[] = [] // STATEFUL EXECUTION SUPPORT
): Promise<MathLabResponse> => {
    const ai = getAI();
    let contextInfo = "";
    let sources: WebSource[] = [];

    // Step 1: Gather Real-World Data if requested (2-Step Process to allow JSON output later)
    if (useSearch) {
        const searchPrompt = `Find data required to solve this problem: "${problem}". Return a summary of values.`;
        // Use FAST model for tool call to save quota/time
        const searchRes = await callAI<GenerateContentResponse>(
            "Math Search",
            (model) => ai.models.generateContent({
                model,
                contents: { parts: [{ text: searchPrompt }] },
                config: { tools: [{ googleSearch: {} }] }
            }),
            MODEL_FAST, null
        );
        
        contextInfo = searchRes.output.text || "";
        searchRes.output.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
             if (c.web) sources.push({ uri: c.web.uri, title: c.web.title });
        });
    }

    // Step 2: Math Engine Execution
    // Use MathArena capabilities of Gemini 3 Pro
    const prompt = `
        You are an advanced Python Math Engine.
        ${verifiedLatex ? `CONTEXT: Verified LaTeX: "${verifiedLatex}"` : ''}
        ${contextInfo ? `REAL-WORLD CONTEXT: ${contextInfo}` : ''}
        ${history.length > 0 ? `PREVIOUS CODE EXECUTION HISTORY:\n${history.join('\n')}\n` : ''}
        
        User Input: "${problem}"
        
        TASK:
        1. Interpret logic.
        2. Write Python code to solve or plot (using matplotlib/numpy).
        3. EXECUTE/SIMULATE the code mentally to produce the result.
        
        CRITICAL - PLOTTING INSTRUCTIONS:
        - If the user request implies a visual (plot, graph, draw, visualize), you MUST generate the raw SVG XML.
        - The SVG must be self-contained (starting with <svg>).
        - Use a white or transparent background.
        - Ensure the SVG XML string is properly escaped for JSON (e.g., use \\" for quotes inside the string).
        
        Return JSON: { 
            "latex": "optional latex representation", 
            "explanation": "concise logic summary", 
            "pythonCode": "full script", 
            "result": "final output string",
            "plotSvg": "RAW SVG XML STRING (if plot requested, else null)"
        }
    `;

    const res = await callAI<GenerateContentResponse>(
        "Math Lab", 
        (model) => ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json" }
        }),
        MODEL_SMART, // MathArena capability
        MODEL_FAST   // Fallback to Flash
    );

    const firstPassData = cleanAndParseJSON(res.output.text);

    // Step 3: Code Logic Verification (Audit)
    // We double-check the logic of the generated code against the original math problem
    const verificationPrompt = `
        REVIEW THIS SOLUTION:
        Problem: "${problem}"
        
        Proposed Logic: "${firstPassData.explanation}"
        Proposed Code: "${firstPassData.pythonCode}"
        
        Task:
        1. Does the Python code accurately implement the Logic?
        2. Are there potential division by zero errors or logic gaps?
        3. Does it match the original problem constraints?
        
        If PERFECT, return { "valid": true }.
        If FLAWED, return { "valid": false, "corrected_response": { ...same schema as input... } }
    `;

    try {
        const verifyRes = await callAI<GenerateContentResponse>(
            "Math Verification",
            (model) => ai.models.generateContent({
                model,
                contents: { parts: [{ text: verificationPrompt }] },
                config: { responseMimeType: "application/json" }
            }),
            MODEL_FAST, // Flash is excellent at syntax checking quickly
            null
        );
        
        const verifyData = cleanAndParseJSON(verifyRes.output.text);
        if (verifyData.valid === false && verifyData.corrected_response) {
            // Return corrected data with Flag
            return { 
                ...verifyData.corrected_response, 
                modelUsed: `${res.model} + Verified`, 
                sources,
                wasAutoRepaired: true
            };
        }
    } catch (e) {
        console.warn("Verification step skipped", e);
    }

    // Return original data with explicit repair flag false
    return { ...firstPassData, modelUsed: res.model, sources, wasAutoRepaired: false };
};

// --- EXAM PREP ---

const examAuditSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    auditedScore: { type: Type.STRING },
    fairnessScore: { type: Type.NUMBER },
    discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
    feedback: { type: Type.STRING }
  },
  required: ["auditedScore", "fairnessScore", "discrepancies", "feedback"]
};

// New function: Double-marks the exam
export const auditExamGrading = async (historyText: string): Promise<GradingAudit> => {
    const ai = getAI();
    const prompt = `
      AUDIT THIS EXAM SESSION.
      You are an independent auditor.
      
      Review the following exam transcript between an AI Invigilator and a Student.
      TRANSCRIPT:
      ${historyText}
      
      Tasks:
      1. Calculate the final score independently.
      2. Rate the "Fairness" of the invigilator (0-100). Did they grade too harshly?
      3. List any discrepancies where the invigilator was wrong.
      
      Return JSON.
    `;
    
    const res = await callAI<GenerateContentResponse>(
        "Exam Audit",
        (model) => ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: examAuditSchema }
        }),
        MODEL_SMART, // Independent Smart Model
        null
    );
    
    return cleanAndParseJSON(res.output.text) as GradingAudit;
};

export const startExamSession = async (config: ExamConfig, fileData?: { data: string, mimeType: string }) => {
    const ai = getAI();
    
    let systemPrompt = "";
    
    // Explicitly handle array joining for prompt
    const formats = config.questionFormats?.join(", ") || "Mixed";
    const count = config.numberOfQuestions || 5;

    if (config.strictMode) {
        systemPrompt = `
        You are an STRICT EXAM INVIGILATOR. 
        MODE: SIMULATION (Strict).
        Subject: ${config.subject}. Grade: ${config.gradeLevel}.
        Total Questions: ${count}.
        Question Formats Allowed: ${formats}.
        
        RULES:
        1. Ask ONE question at a time. Number them (e.g., "Question 1 of ${count}").
        2. Wait for the user's answer.
        3. DO NOT give feedback, hints, or grades immediately. Just say "Answer recorded." or "Proceeding..." and ask the next question.
        4. If the user asks for help, refuse politely: "This is a strict exam. I cannot help you."
        5. When the user sends the command "FINISH_EXAM" OR after Question ${count} is answered, output a grading report.
        
        Grading Report Format (at the end):
        - List each question.
        - User's Answer vs Correct Answer.
        - Score (e.g., 5/10).
        - Feedback for improvement.
        `;
    } else {
        systemPrompt = `
        You are a SOCRATIC TUTOR (Study Buddy).
        Subject: ${config.subject}. Grade: ${config.gradeLevel}.
        
        RULES:
        1. Ask questions one by one. Use these formats: ${formats}.
        2. If the user is wrong, give a HINT. Do not give the answer immediately. Guide them.
        3. Be encouraging and helpful.
        `;
    }
    
    // Inject Institution Guidelines if present
    if (config.institutionGuidelines && config.institutionGuidelines.trim()) {
        systemPrompt += `
        \nIMPORTANT INSTITUTION GUIDELINES:
        "${config.institutionGuidelines}"
        `;
    }

    if (config.realWorldMode) {
        systemPrompt += `
        REAL-WORLD MODE: Incorporate recent news/events into your questions using Google Search.
        `;
    }

    // Interactive Chat -> FAST Model
    const res = await callAI<string>(
        "Start Exam",
        async (model) => {
            examSession = ai.chats.create({
                model: model,
                config: { 
                    systemInstruction: systemPrompt,
                    tools: [{ googleSearch: {} }] // Enable search for Real-World Mode
                }
            });
            examModelUsed = model; // Store
            const initialParts: any[] = [];
            if (fileData) {
                // Handle different mime types
                if (fileData.mimeType.startsWith('image/')) {
                    initialParts.push({ inlineData: { data: fileData.data, mimeType: fileData.mimeType } });
                } else {
                    // For text/plain or other types
                    initialParts.push({ text: `Context Material:\n${fileData.data}` });
                }
                initialParts.push({ text: "Here is the reference material." });
            }
            initialParts.push({ text: config.strictMode 
                ? "Start the exam immediately with Question 1." 
                : "Hello, I am ready to study. Start with the first question." 
            });
            
            const result = await examSession.sendMessage({ message: initialParts });
            return result.text || "Ready.";
        },
        MODEL_FAST,
        null
    );
    return { text: res.output, modelUsed: res.model };
};

export const sendExamMessage = async (text: string) => {
    if (!examSession) throw new Error("Exam not started");
    const result = await examSession.sendMessage({ message: text });
    
    // Extract sources if any (Exam mode might return sources now)
    const sources: WebSource[] = [];
    result.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
      if (c.web) sources.push({ uri: c.web.uri, title: c.web.title });
    });

    return { 
        text: result.text || "", 
        modelUsed: examModelUsed,
        sources: sources.length ? sources : undefined
    };
};
