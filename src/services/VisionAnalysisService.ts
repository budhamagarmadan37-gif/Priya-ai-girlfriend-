import { ScreenVisionAnalysis } from "../types";

export interface VisionAnalysisRequest {
  image: string; // base64 JPEG
  userQuestion?: string;
  focusArea?: string;
  mode?: "quick" | "detailed";
}

export class VisionAnalysisService {
  /**
   * Request deep vision analysis of a captured screen frame
   */
  public static async analyzeScreen(
    request: VisionAnalysisRequest
  ): Promise<ScreenVisionAnalysis> {
    const startTime = Date.now();

    try {
      if (!request.image || request.image.length < 50) {
        return {
          timestamp: startTime,
          description: "Screen frame is empty or black. Please ensure your window or app is open and visible.",
          confidence: "low",
          errorFound: "Empty frame buffer"
        };
      }

      const response = await fetch("/api/vision/analyze-screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: request.image,
          userQuestion: request.userQuestion || "Describe what is visible on the screen, apps, text, and active interface elements.",
          focusArea: request.focusArea || "entire_screen",
          mode: request.mode || "detailed"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision API error (${response.status}): ${errorText.slice(0, 120)}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const rawText = await response.text();
        throw new Error(`Invalid response format from vision API (${response.status})`);
      }

      const data = await response.json();

      return {
        timestamp: Date.now(),
        description: data.description || "I can see your screen, but the interface content is unclear.",
        detectedElements: data.detectedElements || [],
        appsIdentified: data.appsIdentified || [],
        textSummary: data.textSummary || "",
        errorFound: data.errorFound || undefined,
        confidence: data.confidence || "high",
        suggestedAction: data.suggestedAction || undefined
      };
    } catch (err: any) {
      console.warn("[VisionAnalysisService] Analysis error:", err);
      return {
        timestamp: Date.now(),
        description: `Screen visual analysis encountered a temporary glitch: ${err.message || "Network issue"}. Please try again.`,
        confidence: "low",
        errorFound: err.message
      };
    }
  }
}
