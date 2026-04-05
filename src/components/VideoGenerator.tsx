import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface VideoGeneratorProps {
  onComplete: () => void;
}

type GenerationStep = "idle" | "generating-metadata" | "generating-thumbnail" | "saving" | "complete" | "error";

const VIDEO_CATEGORIES = [
  { id: "viral", label: "Viral/Trending", icon: "🔥" },
  { id: "tutorial", label: "Tutorial", icon: "📚" },
  { id: "vlog", label: "Vlog", icon: "📹" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "comedy", label: "Comedy", icon: "😂" },
  { id: "tech", label: "Tech Review", icon: "💻" },
  { id: "cooking", label: "Cooking", icon: "🍳" },
];

export function VideoGenerator({ onComplete }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("viral");
  const [step, setStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const chat = useAction(api.ai.chat);
  const generateImage = useAction(api.ai.generateImage);
  const createVideo = useMutation(api.videos.create);

  const generateVideo = async () => {
    if (!prompt.trim()) return;

    setStep("generating-metadata");
    setError(null);
    setProgress(10);

    try {
      // Generate video metadata with AI
      const metadataPrompt = `Generate a YouTube video based on this concept: "${prompt}"
Category: ${category}

Return a JSON object with these exact fields (no markdown, just raw JSON):
{
  "title": "catchy clickbait title (max 80 chars)",
  "description": "engaging description (2-3 sentences)",
  "channelName": "creative channel name",
  "views": number between 10000 and 5000000,
  "likes": number between 500 and 100000,
  "dislikes": number between 10 and 5000,
  "duration": "MM:SS format between 1:00 and 25:00",
  "uploadedAt": "relative time like '2 hours ago' or '3 days ago'",
  "comments": [
    {"author": "username", "text": "comment text", "likes": number, "timestamp": "relative time"},
    {"author": "username", "text": "comment text", "likes": number, "timestamp": "relative time"},
    {"author": "username", "text": "comment text", "likes": number, "timestamp": "relative time"}
  ]
}

Make it feel authentic to YouTube culture with realistic engagement numbers and typical YouTube comments.`;

      setProgress(25);
      const metadataResponse = await chat({
        messages: [{ role: "user", content: metadataPrompt }],
        systemPrompt: "You are a YouTube content expert. Generate realistic YouTube video metadata. Return only valid JSON, no markdown formatting.",
      });

      setProgress(40);

      // Parse the metadata
      let metadata;
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanedResponse = metadataResponse.trim();
        if (cleanedResponse.startsWith("```json")) {
          cleanedResponse = cleanedResponse.slice(7);
        } else if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.slice(3);
        }
        if (cleanedResponse.endsWith("```")) {
          cleanedResponse = cleanedResponse.slice(0, -3);
        }
        metadata = JSON.parse(cleanedResponse.trim());
      } catch {
        throw new Error("Failed to parse video metadata");
      }

      setStep("generating-thumbnail");
      setProgress(50);

      // Generate thumbnail
      const thumbnailPrompt = `YouTube video thumbnail for: "${metadata.title}". Style: professional YouTube thumbnail, vibrant colors, dramatic lighting, high contrast, eye-catching, ${category} content. No text overlays.`;

      setProgress(65);
      const thumbnailBase64 = await generateImage({ prompt: thumbnailPrompt });

      setProgress(85);
      setStep("saving");

      // Save to database
      await createVideo({
        title: metadata.title,
        description: metadata.description,
        thumbnailBase64: thumbnailBase64 || undefined,
        channelName: metadata.channelName,
        views: metadata.views,
        likes: metadata.likes,
        dislikes: metadata.dislikes,
        comments: metadata.comments,
        duration: metadata.duration,
        uploadedAt: metadata.uploadedAt,
      });

      setProgress(100);
      setStep("complete");

      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">Create AI Video</h1>
        <p className="text-zinc-400">Describe your video idea and let AI generate the rest</p>
      </div>

      {step !== "idle" && step !== "error" ? (
        <GenerationProgress step={step} progress={progress} />
      ) : (
        <div className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Video Category</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {VIDEO_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    category === cat.id
                      ? "bg-red-500 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-[#0f0f0f]"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  <span className="hidden md:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Video Concept</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A day in the life of a time-traveling chef who cooks historical meals..."
              className="w-full h-32 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateVideo}
            disabled={!prompt.trim()}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-zinc-700 disabled:to-zinc-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25 disabled:shadow-none flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Video
          </button>

          {/* Tips */}
          <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
            <h3 className="text-sm font-medium text-zinc-300 mb-2">💡 Tips for great videos:</h3>
            <ul className="text-xs text-zinc-500 space-y-1">
              <li>• Be specific about the topic and style</li>
              <li>• Mention unique angles or perspectives</li>
              <li>• Include emotional hooks or surprising elements</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

interface GenerationProgressProps {
  step: GenerationStep;
  progress: number;
}

function GenerationProgress({ step, progress }: GenerationProgressProps) {
  const steps = [
    { id: "generating-metadata", label: "Crafting video concept...", icon: "✨" },
    { id: "generating-thumbnail", label: "Creating thumbnail...", icon: "🎨" },
    { id: "saving", label: "Publishing video...", icon: "📤" },
    { id: "complete", label: "Video created!", icon: "🎉" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-6 md:p-8 border border-zinc-800">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-zinc-500 text-sm mt-2 text-right">{progress}%</p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((s, index) => {
          const isActive = s.id === step;
          const isComplete = index < currentStepIndex || step === "complete";

          return (
            <div
              key={s.id}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                isActive ? "bg-red-500/10 border border-red-500/30" : "opacity-50"
              } ${isComplete && !isActive ? "opacity-100" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  isComplete ? "bg-green-500/20" : isActive ? "bg-red-500/20 animate-pulse" : "bg-zinc-800"
                }`}
              >
                {isComplete ? "✓" : s.icon}
              </div>
              <span className={`font-medium ${isActive ? "text-white" : "text-zinc-400"}`}>
                {s.label}
              </span>
              {isActive && step !== "complete" && (
                <div className="ml-auto">
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {step === "complete" && (
        <div className="mt-6 text-center">
          <p className="text-green-400 font-medium">Redirecting to home...</p>
        </div>
      )}
    </div>
  );
}
