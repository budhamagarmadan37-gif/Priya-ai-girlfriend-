import { useEffect, useRef, useState, FormEvent } from "react";
import { 
  ConnectionState, 
  WebsiteAction, 
  ScreenShareState, 
  ScreenVisionAnalysis, 
  VisionAnalysisStatus, 
  CameraState, 
  DeviceActionPayload 
} from "./types";
import { AudioPlayer, AudioRecorder } from "./utils/audio";
import { ScreenCaptureService } from "./services/ScreenCaptureService";
import { CameraControlService } from "./services/CameraControlService";
import { DeviceActionRegistry } from "./services/DeviceActionRegistry";
import { VisionAnalysisService } from "./services/VisionAnalysisService";
import PriyaAvatar from "./components/PriyaAvatar";
import BottomWaveform from "./components/BottomWaveform";
import BackgroundParticles from "./components/BackgroundParticles";
import WebsiteModal from "./components/WebsiteModal";
import ChatDrawer from "./components/ChatDrawer";
import UserNameModal from "./components/UserNameModal";
import WebsiteBuilderModal from "./components/builder/WebsiteBuilderModal";
import ScreenSharePermissionModal from "./components/vision/ScreenSharePermissionModal";
import ScreenShareHUD from "./components/vision/ScreenShareHUD";
import CameraViewfinder from "./components/vision/CameraViewfinder";
import DeviceActionToast from "./components/vision/DeviceActionToast";
import CallControlBar from "./components/vision/CallControlBar";
import { 
  saveChatMessage, 
  saveUserSettings, 
  loadUserSettings, 
  loadUserProfile, 
  saveUserProfile, 
  subscribeToAuth, 
  subscribeToUserProfile,
  UserProfile 
} from "./lib/firebase";
import { User } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertCircle, 
  HelpCircle, 
  Mic, 
  MicOff, 
  Power, 
  RefreshCw, 
  Sparkles, 
  Settings,
  Info,
  ChevronRight,
  Globe,
  Send,
  Database,
  MessageSquare,
  User as UserIcon,
  Code2,
  Wand2,
  Layers,
  Monitor,
  Camera as CameraIcon,
  Crown
} from "lucide-react";

export default function App() {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestAction, setLatestAction] = useState<WebsiteAction | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Live Screen Vision & Device Control State
  const [screenShareState, setScreenShareState] = useState<ScreenShareState>("off");
  const [screenPreviewUrl, setScreenPreviewUrl] = useState<string | null>(null);
  const [latestVisionAnalysis, setLatestVisionAnalysis] = useState<ScreenVisionAnalysis | null>(null);
  const [visionAnalysisStatus, setVisionAnalysisStatus] = useState<VisionAnalysisStatus>("idle");
  const [showScreenPermissionModal, setShowScreenPermissionModal] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>({
    isOpen: false,
    isStreaming: false,
    facingMode: "user",
    error: null,
    lastCapturedPhoto: null,
  });
  const [deviceActionNotification, setDeviceActionNotification] = useState<DeviceActionPayload | null>(null);

  const screenCaptureRef = useRef<ScreenCaptureService | null>(null);
  const cameraServiceRef = useRef<CameraControlService | null>(null);

  // AI Website Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderPrompt, setBuilderPrompt] = useState("");
  const [builderCategory, setBuilderCategory] = useState("");

  // User Profile & Firebase Auth State (Owner: Movie Foli)
  const [userProfile, setUserProfile] = useState<UserProfile | null>({
    name: "Movie Foli",
    email: "madanbudhamagar79@gmail.com",
    role: "Owner"
  });
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // Generate unique session ID for current interaction
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);

  // Refs for managing audio and socket objects securely without re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const stateRef = useRef<ConnectionState>("disconnected");
  const lastUserSpeechTimeRef = useRef<number>(0);

  // Load and subscribe to User Profile from Firebase Storage / Firestore
  useEffect(() => {
    // 1. Initial Load from Firebase Firestore / local storage
    loadUserProfile().then((profile) => {
      if (profile && profile.name) {
        setUserProfile(profile);
      } else {
        const defaultOwnerProfile: UserProfile = {
          name: "Movie Foli",
          email: "madanbudhamagar79@gmail.com",
          role: "Owner"
        };
        setUserProfile(defaultOwnerProfile);
        saveUserProfile(defaultOwnerProfile.name, defaultOwnerProfile.email, "", "", "Owner");
      }
    });

    // 2. Subscribe to Firebase Auth
    const unsubAuth = subscribeToAuth((u) => {
      setAuthUser(u);
      if (u) {
        const name = u.displayName || u.email?.split("@")[0] || "Movie Foli";
        const prof: UserProfile = {
          name,
          email: u.email || "",
          uid: u.uid,
          photoURL: u.photoURL || "",
          role: "Owner"
        };
        setUserProfile(prof);
        saveUserProfile(name, u.email || "", u.uid, u.photoURL || "", "Owner");
      }
    });

    // 3. Subscribe to Realtime Profile Snapshot
    const unsubProfile = subscribeToUserProfile(authUser?.uid, (prof) => {
      if (prof && prof.name) {
        setUserProfile(prof);
      }
    });

    return () => {
      unsubAuth();
      unsubProfile();
    };
  }, [authUser?.uid]);

  const retryMicrophone = async () => {
    if (!recorderRef.current) return;
    setError(null);
    try {
      await recorderRef.current.start((base64Audio) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      });
      setAnalyser(recorderRef.current.analyser);
    } catch (err: any) {
      console.error("Retry microphone failed:", err);
      setError(err?.message || "Microphone permission denied. Try opening the app in a new standalone tab.");
    }
  };

  const handleSendText = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const userText = textInput.trim();
    setTextInput("");
    setState("thinking");

    // Store user message in Firebase Realtime Storage (Firestore)
    saveChatMessage(userText, "user", sessionIdRef.current);

    wsRef.current.send(JSON.stringify({ text: userText, userName: userProfile?.name }));
  };

  // Keep stateRef in sync for audio callbacks
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize player, recorder, screen capture, and camera on mount
  useEffect(() => {
    playerRef.current = new AudioPlayer();
    recorderRef.current = new AudioRecorder();

    // Initialize Screen Capture Service with callbacks
    screenCaptureRef.current = new ScreenCaptureService(
      (newState, reason) => {
        setScreenShareState(newState);
        if (newState === "active") {
          const snap = screenCaptureRef.current?.captureSnapshot(320, 0.6);
          if (snap) setScreenPreviewUrl(snap.dataUrl);
        } else if (newState === "off" || newState === "stopped") {
          setScreenPreviewUrl(null);
        }
        if (reason && (newState === "denied" || newState === "unsupported")) {
          setError(reason);
        }
      },
      (base64Frame) => {
        // Stream 1 FPS video frame to Gemini Live session if active
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            video: base64Frame,
            mimeType: "image/jpeg"
          }));
        }
        // Update local preview thumbnail
        const snap = screenCaptureRef.current?.captureSnapshot(320, 0.6);
        if (snap) {
          setScreenPreviewUrl(snap.dataUrl);
        }
      }
    );

    // Initialize Camera Control Service
    cameraServiceRef.current = new CameraControlService((camState) => {
      setCameraState(camState);
    });

    return () => {
      // Complete cleanup on unmount to release resources
      disconnectSession();
      screenCaptureRef.current?.stopCapture();
      cameraServiceRef.current?.closeCamera();
    };
  }, []);

  // Screen Sharing Handlers
  const handleToggleScreenShare = () => {
    if (screenShareState === "active" || screenShareState === "paused") {
      screenCaptureRef.current?.stopCapture("User stopped screen sharing");
    } else {
      setShowScreenPermissionModal(true);
    }
  };

  const handleConfirmStartScreenShare = async () => {
    setShowScreenPermissionModal(false);
    const success = await screenCaptureRef.current?.startCapture();
    if (success && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        text: "[User has just started sharing their screen with Priya. Acknowledge happily that you can now see their screen in real time!]"
      }));
    }
  };

  const handlePauseScreenShare = () => {
    screenCaptureRef.current?.pauseCapture();
  };

  const handleResumeScreenShare = () => {
    screenCaptureRef.current?.resumeCapture();
  };

  const handleStopScreenShare = () => {
    screenCaptureRef.current?.stopCapture("User tapped stop");
  };

  const handleManualAnalyzeScreen = async () => {
    if (!screenCaptureRef.current || screenShareState !== "active") return;
    setVisionAnalysisStatus("analyzing");
    const snap = screenCaptureRef.current.captureSnapshot(1280, 0.85);
    if (!snap) {
      setVisionAnalysisStatus("error");
      return;
    }
    setScreenPreviewUrl(snap.dataUrl);
    try {
      const analysis = await VisionAnalysisService.analyzeScreen({
        image: snap.base64,
        userQuestion: "Priya, screen par kya dikh raha hai? What can you see on my screen?"
      });
      setLatestVisionAnalysis(analysis);
      setVisionAnalysisStatus("completed");

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          screenContext: analysis.description,
          text: `[Visual analysis of user's screen]: ${analysis.description}. Speak to the user explaining what is on their screen naturally.`
        }));
      }
    } catch (e) {
      setVisionAnalysisStatus("error");
    }
  };

  // Camera Handlers
  const handleToggleCamera = () => {
    if (cameraState.isOpen) {
      cameraServiceRef.current?.closeCamera();
    } else {
      cameraServiceRef.current?.openCamera();
    }
  };

  const handleSwitchCameraFacing = () => {
    cameraServiceRef.current?.switchFacingMode();
  };

  const handleCaptureCameraPhoto = () => {
    return cameraServiceRef.current?.capturePhoto() || null;
  };

  const handleAnalyzePhoto = async (base64Photo: string) => {
    setVisionAnalysisStatus("analyzing");
    try {
      const analysis = await VisionAnalysisService.analyzeScreen({
        image: base64Photo,
        userQuestion: "Describe what is captured in this photo taken with the camera."
      });
      setLatestVisionAnalysis(analysis);
      setVisionAnalysisStatus("completed");

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          text: `[Camera Photo Analysis]: ${analysis.description}. Speak to the user about what is in the captured photo.`
        }));
      }
    } catch (e) {
      setVisionAnalysisStatus("error");
    }
  };

  // Monitor microphone volume to detect active user speech and map to state
  useEffect(() => {
    if (state === "disconnected" || state === "connecting") {
      setIsUserSpeaking(false);
      return;
    }

    const interval = setInterval(() => {
      if (!recorderRef.current) return;
      
      const vol = recorderRef.current.getVolume();
      const now = Date.now();

      // threshold of 15 out of 255 represents actual speech input
      if (state === "listening") {
        if (vol > 15) {
          if (!isUserSpeaking) {
            setIsUserSpeaking(true);
            console.log("Speech detected! Mic level:", vol);
          }
          lastUserSpeechTimeRef.current = now;
        } else {
          // If the user was speaking and has now been silent for over 1.4 seconds
          if (isUserSpeaking && now - lastUserSpeechTimeRef.current > 1400) {
            console.log("User finished speaking. Transitioning to thinking...");
            setIsUserSpeaking(false);
            setState("thinking");
          }
        }
      } else if (state === "thinking") {
        // If the user starts talking again during thinking, interrupt/return to listening
        if (vol > 18) {
          console.log("User resumed speaking during thinking.");
          setIsUserSpeaking(true);
          setState("listening");
          lastUserSpeechTimeRef.current = now;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state, isUserSpeaking]);

  const connectSession = () => {
    setError(null);
    setState("connecting");

    // Close any prior socket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
    }

    // Resolve socket URL relative to current deployment
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/live-proxy`;

    console.log("Connecting to voice proxy at:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Proxy WebSocket tunnel opened, awaiting Gemini session...");
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        // 1. Handle error states
        if (msg.error) {
          setError(msg.error);
          disconnectSession();
          return;
        }

        // 2. Handle connection confirmation
        if (msg.status === "connected") {
          console.log("Priya connected and ready!");
          setState("listening");

          // Send initUser if user profile exists
          const currentName = userProfile?.name || "Movie Foli";
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ 
              initUser: currentName,
              isOwner: true 
            }));
          }
          
          // Setup and start mic recorder
          if (recorderRef.current) {
            try {
              await recorderRef.current.start((base64Audio) => {
                // Only stream audio to Gemini if we are in listening, thinking or speaking states
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ audio: base64Audio }));
                }
              });
              setAnalyser(recorderRef.current.analyser);
            } catch (err: any) {
              console.error("Microphone access failed:", err);
              const errMsg = err?.message || "Microphone permission denied. Please allow microphone access or open in a new tab.";
              setError(errMsg);
            }
          }
          return;
        }

        // 3. Handle incoming voice chunks from Priya
        if (msg.audio) {
          // Immediately stop any thinking state once Priya's voice returns
          setState("speaking");
          setIsUserSpeaking(false);
          
          if (playerRef.current) {
            // Point the visualizer to Priya's voice analyser
            setAnalyser(playerRef.current.analyser);
            
            playerRef.current.playChunk(msg.audio, () => {
              // Callback triggered when an audio chunk ends
              if (playerRef.current && playerRef.current["activeSources"].length === 0) {
                if (stateRef.current === "speaking") {
                  setState("listening");
                  // Point visualizer back to user's mic analyser
                  if (recorderRef.current) {
                    setAnalyser(recorderRef.current.analyser);
                  }
                }
              }
            });
          }
          return;
        }

        // 4. Handle Gemini output interruption (User spoke over Priya)
        if (msg.interrupted) {
          console.log("User interrupted Priya, stopping playback...");
          if (playerRef.current) {
            playerRef.current.stop();
          }
          setState("listening");
          setIsUserSpeaking(true); // they are actively speaking right now
          lastUserSpeechTimeRef.current = Date.now();
          if (recorderRef.current) {
            setAnalyser(recorderRef.current.analyser);
          }
          return;
        }

        // 5. Handle tool call requests
        if (msg.toolCall) {
          const { id, name, args } = msg.toolCall;
          console.log(`Executing tool: ${name}`, args);

          if (name === "analyzeScreen") {
            const query = args.query || "What is visible on the screen?";
            console.log("Priya requested analyzeScreen with query:", query);

            if (screenCaptureRef.current && (screenCaptureRef.current.getState() === "active" || screenCaptureRef.current.getState() === "paused")) {
              setVisionAnalysisStatus("analyzing");
              const snap = screenCaptureRef.current.captureSnapshot(1280, 0.85);
              if (snap) {
                setScreenPreviewUrl(snap.dataUrl);
                VisionAnalysisService.analyzeScreen({
                  image: snap.base64,
                  userQuestion: query
                }).then((analysis) => {
                  setLatestVisionAnalysis(analysis);
                  setVisionAnalysisStatus("completed");

                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      toolResponse: {
                        id,
                        name,
                        response: {
                          output: analysis.description,
                          detectedElements: analysis.detectedElements,
                          appsIdentified: analysis.appsIdentified,
                          textSummary: analysis.textSummary,
                          suggestedAction: analysis.suggestedAction
                        }
                      }
                    }));
                  }
                }).catch((err) => {
                  setVisionAnalysisStatus("error");
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      toolResponse: {
                        id,
                        name,
                        response: { output: "I could not inspect the screen clearly due to a temporary capture error." }
                      }
                    }));
                  }
                });
              } else {
                setVisionAnalysisStatus("error");
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({
                    toolResponse: {
                      id,
                      name,
                      response: { output: "The screen feed is currently blank or blocked. Please make sure your window is open and visible." }
                    }
                  }));
                }
              }
            } else {
              // Screen sharing is not yet active, prompt user to start
              setShowScreenPermissionModal(true);
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  toolResponse: {
                    id,
                    name,
                    response: { output: "Screen sharing is currently off. I just displayed the screen share prompt. Please tap Start Sharing so I can see your screen!" }
                  }
                }));
              }
            }
          } else if (name === "launchDeviceAction") {
            const actionType = args.action;
            const target = args.target;
            const displayName = args.displayName || actionType;

            const result = DeviceActionRegistry.executeAction(actionType, target, displayName);
            setDeviceActionNotification({
              id,
              action: actionType,
              target: target || result.openedUrl,
              displayName: displayName || result.message,
              timestamp: Date.now(),
              status: result.success ? "executed" : "failed",
              details: result.message
            });

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                toolResponse: {
                  id,
                  name,
                  response: { output: result.message }
                }
              }));
            }
          } else if (name === "controlCamera") {
            const cmd = args.command;
            console.log("Priya triggered camera command:", cmd);
            let responseText = "Camera action executed.";

            if (cmd === "open") {
              cameraServiceRef.current?.openCamera();
              responseText = "Opened device camera. You can see the live feed, switch cameras, or take a photo.";
            } else if (cmd === "close") {
              cameraServiceRef.current?.closeCamera();
              responseText = "Closed camera.";
            } else if (cmd === "switch_facing") {
              cameraServiceRef.current?.switchFacingMode();
              responseText = "Switched camera view.";
            } else if (cmd === "capture") {
              const photo = cameraServiceRef.current?.capturePhoto();
              if (photo) {
                responseText = "Photo captured successfully!";
              } else {
                responseText = "Could not capture photo. Please make sure the camera is open.";
              }
            }

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                toolResponse: {
                  id,
                  name,
                  response: { output: responseText }
                }
              }));
            }
          } else if (name === "openWebsite") {
            const result = DeviceActionRegistry.executeAction("open_url", args.url, args.name);
            const action: WebsiteAction = {
              id,
              url: args.url,
              name: args.name,
              timestamp: Date.now(),
              status: "executed",
            };
            setLatestAction(action);
            setDeviceActionNotification({
              id,
              action: "open_url",
              target: args.url,
              displayName: args.name,
              timestamp: Date.now(),
              status: "executed",
              details: result.message
            });

            // Instantly reply to Gemini so she stays responsive
            ws.send(
              JSON.stringify({
                toolResponse: {
                  id,
                  name,
                  response: { output: `Successfully triggered browser tab opening to ${args.name}` },
                },
              })
            );
          } else if (name === "buildWebsite") {
            console.log("Priya triggered AI Website Builder with prompt:", args.prompt);
            setBuilderPrompt(args.prompt);
            setBuilderCategory(args.category || "");
            setIsBuilderOpen(true);

            // Reply to Gemini so she playfully acknowledges the build
            ws.send(
              JSON.stringify({
                toolResponse: {
                  id,
                  name,
                  response: { 
                    output: `AI Website Builder opened successfully! I am now generating the complete website code for: "${args.prompt}".` 
                  },
                },
              })
            );
          }
        }
      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    };

    ws.onclose = (e) => {
      console.log("Proxy WebSocket tunnel closed:", e.reason || "normal disconnect");
      disconnectSession();
    };

    ws.onerror = () => {
      console.log("WebSocket connection notice / reconnecting...");
      setError("Session disconnected. Tap to talk again with Priya.");
      disconnectSession();
    };
  };

  const disconnectSession = () => {
    setState("disconnected");
    setIsUserSpeaking(false);
    setAnalyser(null);

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    if (recorderRef.current) {
      recorderRef.current.stop();
    }

    if (playerRef.current) {
      playerRef.current.stop();
    }
  };

  const toggleSession = () => {
    if (state === "disconnected") {
      // Eagerly initialize and resume audio player context during direct user click
      // to bypass iOS Safari and Chrome audio autoplay constraints.
      if (playerRef.current) {
        playerRef.current.init();
      }
      connectSession();
    } else {
      disconnectSession();
    }
  };

  // Derive displayState purely from ConnectionState and isUserSpeaking
  const getDisplayState = (): "disconnected" | "connecting" | "idle" | "listening" | "thinking" | "speaking" => {
    if (state === "disconnected") return "disconnected";
    if (state === "connecting") return "connecting";
    if (state === "thinking") return "thinking";
    if (state === "speaking") return "speaking";
    if (state === "listening") {
      return isUserSpeaking ? "listening" : "idle";
    }
    return "idle";
  };

  const displayState = getDisplayState();

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#020617] text-[#f8fafc] overflow-hidden select-none font-sans">
      
      {/* Immersive futuristic glow backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e1b4b]/30 via-[#020617] to-black pointer-events-none z-0" />
      
      {/* Floating Star/Glow Particles in Background */}
      <BackgroundParticles />

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5 flex items-center justify-between z-30">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 bg-gradient-to-tr from-pink-500 to-cyan-500 rounded-xl shadow-lg shadow-pink-500/10"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
              Priya <span className="text-[9px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold">Companion</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                displayState === "disconnected" ? "bg-slate-500" :
                displayState === "connecting" ? "bg-blue-400 animate-pulse" :
                displayState === "listening" ? "bg-cyan-400 animate-ping" :
                displayState === "speaking" ? "bg-pink-400 animate-ping" : "bg-emerald-400"
              }`} />
              <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider font-mono">
                {displayState === "disconnected" && "Offline"}
                {displayState === "connecting" && "Summoning"}
                {displayState === "idle" && "Connected"}
                {displayState === "listening" && "User Speaking"}
                {displayState === "thinking" && "Processing"}
                {displayState === "speaking" && "Priya Speaking"}
              </p>
            </div>
          </div>
        </div>

        {/* Info & Settings Controls */}
        <div className="flex items-center gap-2">
          {/* AI Website Builder Launcher Button */}
          <button
            onClick={() => {
              setBuilderPrompt("");
              setIsBuilderOpen(true);
            }}
            id="btn-ai-website-builder"
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 via-indigo-500/20 to-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:text-white hover:border-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95 group"
            title="Launch Autonomous AI Website Builder"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 group-hover:rotate-12 transition-transform" />
            <span className="bg-gradient-to-r from-pink-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent font-bold">
              AI Website Builder
            </span>
            <span className="hidden sm:inline-block text-[9px] bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 rounded-full font-mono uppercase">
              NEW
            </span>
          </button>

          <button
            onClick={() => setIsNameModalOpen(true)}
            id="btn-user-profile"
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-cyan-500/15 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-lg group"
            title="App Owner: Movie Foli"
          >
            {authUser?.photoURL ? (
              <img src={authUser.photoURL} alt="Profile" className="w-4 h-4 rounded-full border border-amber-400" referrerPolicy="no-referrer" />
            ) : (
              <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="max-w-[100px] truncate">{userProfile?.name ? userProfile.name : "Movie Foli"}</span>
            <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">
              Owner
            </span>
          </button>

          <button
            onClick={() => setIsChatOpen(true)}
            id="btn-firebase-logs"
            className="px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:text-white hover:bg-pink-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-lg"
            title="Realtime Firebase Database Storage Logs"
          >
            <Database className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span className="hidden sm:inline">Firebase Realtime Logs</span>
            <span className="sm:hidden">Logs</span>
          </button>

          <button
            onClick={() => setShowIntro((prev) => !prev)}
            id="btn-info-toggle"
            className={`p-2.5 rounded-full border transition duration-200 cursor-pointer ${
              showIntro 
                ? "bg-pink-500/10 border-pink-500/30 text-pink-400" 
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title="Toggle Assistant Info"
            aria-label="Toggle Persona Information"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container / Priya Stage (Occupies 70-80% Screen height) */}
      <main className="relative flex-1 w-full max-w-5xl mx-auto px-4 flex flex-col items-center justify-center z-20 min-h-0">
        
        {/* Error Announcement */}
        <AnimatePresence>
          {error && (
            <motion.div 
              id="error-banner"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 inset-x-4 max-w-md mx-auto z-40 flex flex-col gap-3 bg-red-950/90 border border-red-500/40 backdrop-blur-md rounded-2xl p-4 text-red-200 shadow-2xl shadow-red-500/20"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">Connection/Permission Error</h4>
                  <p className="text-xs text-red-400/90 mt-1 leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-xs font-semibold text-red-400 hover:text-red-200 underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>

              {(error.toLowerCase().includes("mic") || error.toLowerCase().includes("permission")) && (
                <div className="mt-2 pt-3 border-t border-red-500/20 text-xs text-red-300 space-y-2">
                  <p className="font-medium">💡 How to fix microphone access:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-red-400/90">
                    <li>Iframe container blocks mic access in some browsers.</li>
                    <li>Try opening this app in a <strong>new standalone browser tab</strong>.</li>
                    <li>Ensure you granted permission in your browser URL bar.</li>
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    <button
                      onClick={retryMicrophone}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white font-bold text-[10px] rounded-xl transition uppercase tracking-wider cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" /> Retry Microphone
                    </button>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/80 hover:bg-red-800 border border-red-500/50 text-white font-bold text-[10px] rounded-xl transition uppercase tracking-wider"
                    >
                      <Globe className="w-3.5 h-3.5" /> Open in New Tab
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Priya Video Stage (Large, responsive center avatar) */}
        <div className="w-full flex-1 flex items-center justify-center py-2 sm:py-4 min-h-0">
          <PriyaAvatar state={displayState} />
        </div>

        {/* Floating Interactive Persona Information Modal */}
        <AnimatePresence>
          {showIntro && (
            <motion.div 
              id="intro-card"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute inset-x-6 max-w-md mx-auto bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl z-30"
            >
              <div className="flex items-center justify-between text-pink-400 text-xs font-mono uppercase tracking-wider mb-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Priya Voice Companion
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  <Crown className="w-3 h-3 text-amber-400" /> Owner: Movie Foli
                </span>
              </div>
              <h2 className="text-white text-lg font-bold">"Hey Movie Foli! Ready to chat, or are you too shy?"</h2>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Priya is your personal ultra-realistic, low-latency female voice companion and autonomous AI website builder. She recognizes you as her owner, ready to chat, observe your screen in real time, and code full websites on command.
              </p>
              <ul className="text-slate-400 text-xs space-y-2 mt-4 list-disc list-inside">
                <li><strong className="text-pink-300">Interrupt her anytime:</strong> Speak over her voice and she’ll pause instantly!</li>
                <li><strong className="text-cyan-300">Autonomous AI Website Builder:</strong> Say <em>"Priya, build me a movie site"</em> or tap the builder button!</li>
                <li><strong className="text-amber-300">Screen Perception:</strong> Share your screen and ask <em>"Priya, what's on my screen?"</em></li>
                <li><strong className="text-indigo-300">Device & Web Control:</strong> Ask her to launch apps, websites, or control your camera.</li>
              </ul>
              <button
                onClick={() => setShowIntro(false)}
                className="w-full mt-5 py-2.5 bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 active:scale-[0.98] transition font-bold text-xs tracking-wider uppercase rounded-xl text-white cursor-pointer shadow-lg shadow-pink-500/10"
              >
                Let's Start
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer (Controls, state indicator, and waveforms) */}
      <footer className="relative w-full max-w-lg mx-auto px-4 sm:px-6 pb-4 sm:pb-8 flex flex-col items-center gap-3 sm:gap-5 z-30">
        
        {/* Real-time State and Guidance Caption */}
        <div className="text-center h-12 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={displayState}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-0.5"
            >
              {displayState === "disconnected" && (
                <p className="text-slate-400 text-sm font-medium animate-pulse">
                  Priya is sleeping. Tap the power button to awaken her.
                </p>
              )}
              {displayState === "connecting" && (
                <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> ESTABLISHING LINK...
                </p>
              )}
              {displayState === "idle" && (
                <div className="flex flex-col items-center">
                  <p className="text-cyan-500 text-sm font-bold tracking-wider uppercase">Priya is Listening</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">"Say something cheekily..."</p>
                </div>
              )}
              {displayState === "listening" && (
                <div className="flex flex-col items-center">
                  <p className="text-cyan-400 text-sm font-bold tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" /> Hearing You...
                  </p>
                  <p className="text-slate-300 text-xs mt-0.5">Streaming your voice...</p>
                </div>
              )}
              {displayState === "thinking" && (
                <div className="flex flex-col items-center">
                  <p className="text-indigo-400 text-sm font-bold tracking-widest uppercase flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Priya is Thinking...
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">Formulating a sassy comeback</p>
                </div>
              )}
              {displayState === "speaking" && (
                <div className="flex flex-col items-center">
                  <p className="text-pink-400 text-sm font-bold tracking-widest uppercase flex items-center gap-1">
                    Priya is Speaking
                  </p>
                  <p className="text-slate-300 text-xs mt-0.5">Teasing you in real time...</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Waveform Visualization directly below state text */}
        <div className="w-full">
          <BottomWaveform displayState={displayState} analyser={analyser} />
        </div>

        {/* Compact Call Control Panel: Mic, Screen Share, Camera, AI Builder, End Call */}
        <div className="relative mt-2">
          <CallControlBar
            connectionState={displayState}
            screenShareState={screenShareState}
            cameraState={cameraState}
            onToggleSession={toggleSession}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleCamera={handleToggleCamera}
            onOpenBuilder={() => setIsBuilderOpen(true)}
            onStopScreenShare={handleStopScreenShare}
          />
        </div>

        {/* Text Input Bar for quiet typing or mic fallback when connected */}
        {displayState !== "disconnected" && (
          <form 
            onSubmit={handleSendText} 
            className="w-full max-w-md mt-1 flex items-center gap-2 bg-slate-900/90 border border-white/10 rounded-2xl p-1.5 focus-within:border-cyan-500/50 transition backdrop-blur-md shadow-xl"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type a message to Priya..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || displayState === "thinking" || displayState === "connecting"}
              className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer shrink-0 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Small minimalist subtext */}
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5 mt-1">
          {displayState !== "disconnected" ? (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> End-to-End Encryption
            </span>
          ) : (
            <span>Standalone Voice Companion Node</span>
          )}
        </span>
      </footer>

      {/* Website Trigger Overlay (Modal-like card) */}
      <WebsiteModal 
        action={latestAction} 
        onClose={() => setLatestAction(null)} 
      />

      {/* Realtime Firebase Storage Logs Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        sessionId={sessionIdRef.current}
        isConnected={displayState !== "disconnected"}
        onSendTextMessage={(msg) => {
          setTextInput(msg);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ text: msg, userName: userProfile?.name }));
            setState("thinking");
          }
        }}
      />

      {/* User Name & Google Auth Modal */}
      <UserNameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        currentProfile={userProfile}
        authUser={authUser}
        onNameSaved={(name) => {
          setUserProfile((prev) => ({
            name,
            email: prev?.email || authUser?.email || "",
            uid: prev?.uid || authUser?.uid || "",
            photoURL: prev?.photoURL || authUser?.photoURL || ""
          }));
        }}
      />

      {/* Autonomous AI Website Builder Full-Stack Modal */}
      <WebsiteBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        initialPrompt={builderPrompt}
        initialCategory={builderCategory}
      />

      {/* Real-time Screen Sharing HUD (Visible when sharing is active) */}
      <ScreenShareHUD
        state={screenShareState}
        analysisStatus={visionAnalysisStatus}
        latestAnalysis={latestVisionAnalysis}
        previewUrl={screenPreviewUrl}
        onPause={handlePauseScreenShare}
        onResume={handleResumeScreenShare}
        onStop={handleStopScreenShare}
        onTriggerAnalysis={handleManualAnalyzeScreen}
      />

      {/* Screen Sharing Permission and Explanation Modal */}
      <ScreenSharePermissionModal
        isOpen={showScreenPermissionModal}
        onClose={() => setShowScreenPermissionModal(false)}
        onConfirm={handleConfirmStartScreenShare}
      />

      {/* Futuristic Device Camera Viewfinder Modal */}
      <CameraViewfinder
        state={cameraState}
        onClose={() => cameraServiceRef.current?.closeCamera()}
        onSwitchFacing={handleSwitchCameraFacing}
        onCapturePhoto={handleCaptureCameraPhoto}
        onAnalyzePhoto={handleAnalyzePhoto}
        attachStreamToVideo={(video) => cameraServiceRef.current?.attachToVideoElement(video)}
      />

      {/* Device Action Execution Toast Notification */}
      <DeviceActionToast
        action={deviceActionNotification}
        onDismiss={() => setDeviceActionNotification(null)}
      />
    </div>
  );
}
