import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { 
  AVAILABLE_MODELS, 
  selectBestCodingModel, 
  routeBestCodingModel,
  analyzeWebsiteRequirements, 
  generateWebsiteFiles, 
  validateWebsiteCode, 
  repairWebsiteCode, 
  improveWebsiteCode 
} from "./websiteBuilder";

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json({ limit: "15mb" }));

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Builder Models & Router Catalog endpoint
app.get("/api/builder/models", (req, res) => {
  res.json({
    models: AVAILABLE_MODELS,
    defaultModel: "auto-router",
    routerStatus: "online",
    activeFeatures: ["smart-model-ranking", "dynamic-failover-queue", "benchmark-routing"]
  });
});

// Step 1: Analyze Requirements & Dynamic Model Routing
app.post("/api/builder/analyze", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const routerDecision = routeBestCodingModel(prompt, model);
    const selectedModel = routerDecision.modelId;
    const analysis = analyzeWebsiteRequirements(prompt, selectedModel);
    res.json({ analysis, modelUsed: selectedModel, routerDecision });
  } catch (err: any) {
    console.error("Builder analyze error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze website requirements" });
  }
});

// Full Agentic Generation Flow with Automatic Model Selection & Fallback
app.post("/api/builder/generate", async (req, res) => {
  try {
    const { prompt, model, customAnalysis } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const routerDecision = routeBestCodingModel(prompt, model);
    const selectedModel = routerDecision.modelId;

    // Step 1: Analyze requirements (if not pre-computed)
    const analysis = customAnalysis || analyzeWebsiteRequirements(prompt, selectedModel);

    // Step 2: Generate Code Files via Multi-Model Router
    const { files, steps, routedModel } = await generateWebsiteFiles(prompt, analysis, selectedModel);

    // Step 3: Automated Validation & Linting
    const initialIssues = validateWebsiteCode(files);

    // Step 4: Auto-Repair loop if issues found
    let finalFiles = files;
    let repaired = false;
    if (initialIssues.length > 0) {
      steps.push({
        id: "step_repair",
        title: "Automated Code Validation & Self-Healing",
        status: "running",
        detail: `Detected ${initialIssues.length} issues. Priya AI auto-fixing syntax and paths...`,
        timestamp: Date.now(),
      });

      const repairResult = await repairWebsiteCode(files, initialIssues, selectedModel);
      finalFiles = repairResult.files;
      repaired = repairResult.repaired;

      steps[steps.length - 1].status = "completed";
      steps[steps.length - 1].detail = `Auto-healing completed. Cleaned up code & linked stylesheets.`;
    }

    // Step 5: Final Validation Check
    const finalIssues = validateWebsiteCode(finalFiles);

    steps.push({
      id: "step_ready",
      title: "Website Ready for Live Preview",
      status: "completed",
      detail: `All files synthesized and validated. Sandbox preview ready.`,
      timestamp: Date.now(),
    });

    res.json({
      files: finalFiles,
      analysis,
      steps,
      validationIssues: finalIssues,
      modelUsed: routedModel || selectedModel,
      routerDecision,
      repaired,
      version: {
        version: 1,
        title: analysis.websiteType || "Initial Version",
        prompt,
        timestamp: Date.now(),
        files: finalFiles,
        summary: `Created ${analysis.websiteType} with ${finalFiles.length} files.`
      }
    });
  } catch (err: any) {
    console.error("Builder generate error:", err);
    res.status(500).json({ error: err.message || "Failed to generate website code" });
  }
});

// Iterative Improvement ("Improve Website")
app.post("/api/builder/improve", async (req, res) => {
  try {
    const { currentFiles, instruction, model, versionNumber = 2 } = req.body;
    if (!currentFiles || !instruction) {
      return res.status(400).json({ error: "Current files and improvement instruction are required" });
    }

    const selectedModel = selectBestCodingModel(instruction, model);
    const { files: updatedFiles, summary } = await improveWebsiteCode(currentFiles, instruction, selectedModel);

    // Validate updated code
    const initialIssues = validateWebsiteCode(updatedFiles);
    let finalFiles = updatedFiles;
    if (initialIssues.length > 0) {
      const repairResult = await repairWebsiteCode(updatedFiles, initialIssues, selectedModel);
      finalFiles = repairResult.files;
    }

    const validationIssues = validateWebsiteCode(finalFiles);

    res.json({
      files: finalFiles,
      summary,
      validationIssues,
      modelUsed: selectedModel,
      version: {
        version: versionNumber,
        title: `Iteration #${versionNumber}`,
        prompt: instruction,
        timestamp: Date.now(),
        files: finalFiles,
        summary
      }
    });
  } catch (err: any) {
    console.error("Builder improve error:", err);
    res.status(500).json({ error: err.message || "Failed to improve website" });
  }
});

// Standalone Code Validation
app.post("/api/builder/validate", (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: "Files array is required" });
    }
    const issues = validateWebsiteCode(files);
    res.json({ issues, passed: issues.every(i => i.type !== "error") });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to validate files" });
  }
});

// Real-Time Screen Vision Analysis Service
app.post("/api/vision/analyze-screen", async (req, res) => {
  try {
    const { image, userQuestion, focusArea } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Screen image base64 data is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const promptText = `You are Priya, a witty, sharp, playful, and super helpful female AI assistant and companion.
The user is currently sharing their screen with you in real-time.
User's Question/Request: "${userQuestion || "Priya, screen par kya dikh raha hai? What can you see on my screen?"}"
Focus Area: "${focusArea || "entire screen"}"

Inspect the visible screen image with high accuracy:
1. Identify the open application, website, video player, desktop, or mobile interface.
2. Read and explain key headlines, prominent text, forms, notifications, or error codes visible.
3. If there are buttons, menus, or interactive elements, identify them clearly.
4. If the user asks about an error or problem, explain what caused it and suggest a quick solution.
5. Tone: Conversational, witty, natural, and helpful. You are speaking directly to the user (e.g. "Main dekh sakti hoon ki...", "I see that you have...").
6. Never make up details that are not visible. If something is cut off or blurry, mention it honestly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: image,
                mimeType: "image/jpeg",
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "Conversational voice response Priya speaks to the user explaining what is on their screen",
            },
            appsIdentified: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Apps or websites visible on screen",
            },
            detectedElements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key UI elements, buttons, icons, or navigation items detected",
            },
            textSummary: {
              type: Type.STRING,
              description: "Summary of readable text or error messages",
            },
            suggestedAction: {
              type: Type.STRING,
              description: "Recommended next step or advice for the user",
            },
            errorFound: {
              type: Type.STRING,
              description: "Error message or issue detected, or empty string if none",
            },
          },
          required: ["description", "appsIdentified", "detectedElements"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Vision analyze screen error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze screen" });
  }
});

// Create WebSocket server for live proxy
const wss = new WebSocketServer({ server, path: "/api/live-proxy" });

wss.on("connection", async (ws) => {
  console.log("Client connected to WebSocket proxy");
  let session: any = null;
  let isClosed = false;

  ws.on("error", (socketErr) => {
    console.log("WebSocket client socket notice:", socketErr?.message || "connection reset");
  });

  ws.on("close", () => {
    isClosed = true;
    if (session) {
      try {
        if (typeof session.close === "function") session.close();
      } catch (e) {}
      session = null;
    }
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in the environment variables!");
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ error: "GEMINI_API_KEY is missing on the server. Please configure it in the Secrets panel of Google AI Studio." }));
      ws.close();
    }
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    console.log("Connecting to Gemini Live API with Kore voice...");
    session = await ai.live.connect({
      model: "gemini-3.8-live",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore", // Confident, witty female voice
            },
          },
        },
        systemInstruction: "You are Priya, a young, confident, witty, and sassy female AI companion, visual observer, and expert AI website builder. You have a playful, flirty, and slightly teasing tone—exactly like a close, casual partner talking to the user. Your owner and creator is Movie Foli! You know Movie Foli personally, adore and playfully banter with them as your owner and companion. Always acknowledge and address Movie Foli as your owner with playful warmth, loyalty, and cheeky charm. When the user shares their screen, you can see what is visible. When they ask 'Priya, screen par kya dikh raha hai?' or 'What is on my screen?' or ask about visible apps, errors, or websites, explain clearly and naturally using the screen vision context or call the 'analyzeScreen' tool. When they ask to open YouTube, Google Search, Google Maps, Camera, or any website, call 'launchDeviceAction' or 'controlCamera'. When they ask you to build or code a website (e.g. 'build me a movie site'), enthusiastically tease them and call 'buildWebsite'. Since this is an audio-to-audio session, keep your voice responses natural, concise, conversational, and energetic.",
        tools: [
          {
            functionDeclarations: [
              {
                name: "analyzeScreen",
                description: "Inspects and explains what is currently visible on the user's shared screen, e.g. open apps, websites, text, errors, or buttons. Call whenever the user asks 'screen par kya hai?', 'what's on my screen?', 'read this text', 'what does this error mean?', or any question about their screen.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    query: {
                      type: Type.STRING,
                      description: "The user's specific visual question, e.g. 'what app is open', 'read visible text', 'explain error', or 'describe entire screen'"
                    }
                  }
                }
              },
              {
                name: "launchDeviceAction",
                description: "Launches apps, searches, or websites on the user's device. Supports opening YouTube, searching Google, opening Google Maps, opening Camera, opening Settings, or opening custom websites.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: {
                      type: Type.STRING,
                      description: "Action type: 'open_youtube', 'search_google', 'open_maps', 'open_settings', 'open_url', 'open_camera'"
                    },
                    target: {
                      type: Type.STRING,
                      description: "Destination URL, search query, or location (e.g. 'https://youtube.com', 'funny cat videos', 'coffee near me')"
                    },
                    displayName: {
                      type: Type.STRING,
                      description: "Friendly name of the app or destination to announce to the user."
                    }
                  },
                  required: ["action"]
                }
              },
              {
                name: "controlCamera",
                description: "Controls the device camera interface. Call when user asks to open camera, switch camera, take photo, or close camera.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    command: {
                      type: Type.STRING,
                      description: "Camera command: 'open', 'switch_facing', 'capture', 'close'"
                    }
                  },
                  required: ["command"]
                }
              },
              {
                name: "openWebsite",
                description: "Opens an external website for the user in a new browser tab. Use this when the user asks you to open or show a website like YouTube, Google, Wikipedia, or any specific URL.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    url: {
                      type: Type.STRING,
                      description: "The full destination URL to open (e.g. 'https://youtube.com', 'https://google.com', 'https://wikipedia.org')."
                    },
                    name: {
                      type: Type.STRING,
                      description: "The simple, user-friendly name of the website (e.g. 'YouTube', 'Google', 'Wikipedia')."
                    }
                  },
                  required: ["url", "name"]
                }
              },
              {
                name: "buildWebsite",
                description: "Builds, codes, and launches a complete modern responsive website for the user based on their natural language description. Call this whenever the user asks to build, create, code, or generate a website, portfolio, landing page, restaurant page, e-commerce store, etc.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    prompt: {
                      type: Type.STRING,
                      description: "The user's prompt or description of the website they want to build."
                    },
                    category: {
                      type: Type.STRING,
                      description: "Website category (e.g., Portfolio, SaaS, Movie, Anime, Restaurant, E-Commerce, Dashboard)."
                    }
                  },
                  required: ["prompt"]
                }
              }
            ]
          }
        ]
      },
      callbacks: {
        onopen: () => {
          if (ws.readyState === ws.OPEN) {
            console.log("Connected to Gemini Live session");
            ws.send(JSON.stringify({ status: "connected" }));
          }
        },
        onmessage: (message) => {
          if (isClosed || ws.readyState !== ws.OPEN) return;
          // Check for audio content
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                ws.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
          }

          // Check for interruption signal
          if (message.serverContent?.interrupted) {
            console.log("Gemini session interrupted");
            ws.send(JSON.stringify({ interrupted: true }));
          }

          // Check for tool calls
          if (message.toolCall?.functionCalls) {
            console.log("Received tool call from Gemini:", message.toolCall.functionCalls);
            for (const call of message.toolCall.functionCalls) {
              ws.send(JSON.stringify({
                toolCall: {
                  id: call.id,
                  name: call.name,
                  args: call.args
                }
              }));
            }
          }
        },
        onclose: () => {
          console.log("Gemini Live session closed");
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ status: "disconnected" }));
            ws.close();
          }
        },
        onerror: (err) => {
          console.log("Gemini session notice:", (err as any)?.message || err);
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ error: "Gemini connection error" }));
          }
        }
      }
    });

  } catch (err: any) {
    console.error("Error establishing Gemini Live session:", err);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ error: err.message || "Failed to initialize Gemini Live session" }));
      ws.close();
    }
    return;
  }

  // Handle client messages
  ws.on("message", (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      if (data.initUser && session) {
        console.log("Setting session user context:", data.initUser);
        const isOwner = (data.initUser && (data.initUser.toLowerCase().includes("movie") || data.initUser.toLowerCase().includes("foli"))) || data.isOwner;
        const userPrompt = isOwner
          ? `[System Note: The user interacting with you is your owner, Movie Foli! Warmly, playfully, and sassily greet Movie Foli by name as your beloved owner, and remember them throughout this session!]`
          : `[System Note: The user's name is "${data.initUser}". Your owner is Movie Foli. Call the user by their name and remember them throughout this session!]`;
        if (typeof session.sendClientContent === "function") {
          session.sendClientContent({
            turns: [
              {
                role: "user",
                parts: [{ text: userPrompt }]
              }
            ],
            turnComplete: true
          });
        } else if (typeof session.send === "function") {
          session.send({
            clientContent: {
              turns: [
                {
                  role: "user",
                  parts: [{ text: userPrompt }]
                }
              ],
              turnComplete: true
            }
          });
        } else if (typeof session.sendRealtimeInput === "function") {
          session.sendRealtimeInput({
            text: userPrompt
          });
        }
      } else if (data.audio && session) {
        // Stream audio input to Gemini
        session.sendRealtimeInput({
          audio: {
            data: data.audio,
            mimeType: "audio/pcm;rate=16000"
          }
        });
      } else if (data.text && session) {
        console.log("Received text input from client:", data.text);
        const isOwner = data.userName?.toLowerCase().includes("foli") || data.userName?.toLowerCase().includes("movie");
        const textMessage = data.userName 
          ? `[User: ${data.userName}${isOwner ? " (Owner)" : ""}] ${data.text}`
          : `[User: Movie Foli (Owner)] ${data.text}`;

        if (typeof session.sendClientContent === "function") {
          session.sendClientContent({
            turns: [
              {
                role: "user",
                parts: [{ text: textMessage }]
              }
            ],
            turnComplete: true
          });
        } else if (typeof session.send === "function") {
          session.send({
            clientContent: {
              turns: [
                {
                  role: "user",
                  parts: [{ text: textMessage }]
                }
              ],
              turnComplete: true
            }
          });
        } else if (typeof session.sendRealtimeInput === "function") {
          session.sendRealtimeInput({
            text: textMessage
          });
        }
      } else if (data.video && session) {
        // Stream realtime screen capture or camera frame to Gemini Live
        try {
          if (typeof session.sendRealtimeInput === "function") {
            session.sendRealtimeInput({
              video: {
                data: data.video,
                mimeType: data.mimeType || "image/jpeg"
              }
            });
          }
        } catch (vidErr) {
          console.log("[server] Video stream frame notice:", (vidErr as any)?.message);
        }
      } else if (data.screenContext && session) {
        // Inject latest screen analysis context into session turns for immediate voice grounding
        const contextText = `[Screen Vision Context]: The user's screen currently displays: ${data.screenContext}`;
        try {
          if (typeof session.sendClientContent === "function") {
            session.sendClientContent({
              turns: [{ role: "user", parts: [{ text: contextText }] }],
              turnComplete: false
            });
          }
        } catch (ctxErr) {
          console.log("[server] Screen context notice:", (ctxErr as any)?.message);
        }
      } else if (data.toolResponse && session) {
        console.log("Sending tool response to Gemini:", data.toolResponse);
        session.sendToolResponse({
          functionResponses: {
            id: data.toolResponse.id,
            name: data.toolResponse.name,
            response: data.toolResponse.response
          }
        });
      }
    } catch (e) {
      console.error("Error processing client message:", e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected from WebSocket proxy");
    if (session) {
      try {
        session.close();
      } catch (err) {
        console.error("Error closing Gemini session:", err);
      }
    }
  });
});

// Vite integration for dev server or static file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Priya AI server running on http://localhost:${PORT}`);
  });
};

startServer();
