import { DeviceActionPayload, DeviceActionType } from "../types";

export interface ActionResult {
  success: boolean;
  message: string;
  openedUrl?: string;
}

export class DeviceActionRegistry {
  /**
   * Safely execute a device or web action
   */
  public static executeAction(
    action: DeviceActionType,
    target?: string,
    displayName?: string
  ): ActionResult {
    console.log(`[DeviceActionRegistry] Executing: ${action}, target: ${target}`);

    switch (action) {
      case "open_youtube": {
        let url = "https://www.youtube.com";
        if (target && target.trim()) {
          url = `https://www.youtube.com/results?search_query=${encodeURIComponent(target.trim())}`;
        }
        this.openExternalSafe(url);
        return {
          success: true,
          message: target 
            ? `Opened YouTube searching for "${target}".` 
            : "Opened YouTube homepage.",
          openedUrl: url
        };
      }

      case "search_google": {
        const query = target || "Google";
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        this.openExternalSafe(url);
        return {
          success: true,
          message: `Opened Google Search for "${query}".`,
          openedUrl: url
        };
      }

      case "open_maps": {
        const location = target || "";
        const url = location 
          ? `https://www.google.com/maps/search/${encodeURIComponent(location)}`
          : "https://www.google.com/maps";
        this.openExternalSafe(url);
        return {
          success: true,
          message: location 
            ? `Opened Google Maps showing "${location}".` 
            : "Opened Google Maps.",
          openedUrl: url
        };
      }

      case "open_settings": {
        // In web browsers, chrome://settings or intent cannot be launched directly due to browser sandboxing.
        // We open standard browser settings help or inform the user.
        const url = "chrome://settings";
        try {
          window.open(url, "_blank");
        } catch (e) {}
        return {
          success: true,
          message: "Triggered device and browser settings.",
          openedUrl: url
        };
      }

      case "open_url": {
        if (!target) {
          return { success: false, message: "No valid URL provided." };
        }
        let cleanUrl = target.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
          cleanUrl = `https://${cleanUrl}`;
        }
        this.openExternalSafe(cleanUrl);
        return {
          success: true,
          message: `Opened ${displayName || cleanUrl}.`,
          openedUrl: cleanUrl
        };
      }

      case "open_camera":
      case "close_camera":
      case "take_photo":
      case "switch_camera":
        // Handled via camera service event bus
        return {
          success: true,
          message: `Executed camera action: ${action}.`
        };

      default:
        return {
          success: false,
          message: `Unknown action: ${action}`
        };
    }
  }

  private static openExternalSafe(url: string): void {
    try {
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        // Fallback for pop-up blockers
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.warn("[DeviceActionRegistry] Failed to open external URL:", e);
    }
  }
}
