import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { VideoGenerator } from "./components/VideoGenerator";
import { VideoPlayer } from "./components/VideoPlayer";
import { Id } from "../convex/_generated/dataModel";

type View = "home" | "generate" | "watch";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const [view, setView] = useState<View>("home");
  const [watchingVideoId, setWatchingVideoId] = useState<Id<"videos"> | null>(null);
  const [authFlow, setAuthFlow] = useState<"signIn" | "signUp">("signIn");
  const [authError, setAuthError] = useState<string | null>(null);

  const handleWatchVideo = (videoId: Id<"videos">) => {
    setWatchingVideoId(videoId);
    setView("watch");
  };

  const handleBackToHome = () => {
    setView("home");
    setWatchingVideoId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 font-medium tracking-wide">Loading TubeSim...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg viewBox="0 0 90 20" className="w-32 h-8">
                <rect x="0" y="0" width="28" height="20" rx="4" fill="#FF0000" />
                <polygon points="11,5 11,15 21,10" fill="white" />
                <text x="34" y="15" fill="white" fontFamily="'Oswald', sans-serif" fontSize="14" fontWeight="700" letterSpacing="0.5">TubeSim</text>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 font-display">AI YouTube Simulator</h1>
            <p className="text-zinc-400">Generate viral videos with AI magic</p>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800/50 shadow-2xl">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthError(null);
                const formData = new FormData(e.currentTarget);
                try {
                  await signIn("password", formData);
                } catch {
                  setAuthError(authFlow === "signIn" ? "Invalid credentials" : "Could not create account");
                }
              }}
              className="space-y-4"
            >
              <div>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
              <input name="flow" type="hidden" value={authFlow} />

              {authError && (
                <p className="text-red-400 text-sm text-center">{authError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25"
              >
                {authFlow === "signIn" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthFlow(authFlow === "signIn" ? "signUp" : "signIn")}
                className="text-zinc-400 hover:text-white text-sm transition-colors"
              >
                {authFlow === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-zinc-900/80 text-zinc-500">or</span>
              </div>
            </div>

            <button
              onClick={() => signIn("anonymous")}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-all border border-zinc-700"
            >
              Continue as Guest
            </button>
          </div>

          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={handleBackToHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg viewBox="0 0 90 20" className="w-28 h-6 md:w-32 md:h-7">
              <rect x="0" y="0" width="28" height="20" rx="4" fill="#FF0000" />
              <polygon points="11,5 11,15 21,10" fill="white" />
              <text x="34" y="15" fill="white" fontFamily="'Oswald', sans-serif" fontSize="14" fontWeight="700" letterSpacing="0.5">TubeSim</text>
            </svg>
          </button>

          <nav className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setView("home")}
              className={`px-3 py-2 md:px-4 rounded-full text-sm font-medium transition-all ${
                view === "home"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <span className="hidden md:inline">Home</span>
              <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button
              onClick={() => setView("generate")}
              className={`px-3 py-2 md:px-4 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                view === "generate"
                  ? "bg-red-500 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden md:inline">Create</span>
            </button>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 md:px-4 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
            >
              <span className="hidden md:inline">Sign Out</span>
              <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {view === "home" && <HomePage onWatchVideo={handleWatchVideo} />}
        {view === "generate" && <VideoGenerator onComplete={() => setView("home")} />}
        {view === "watch" && watchingVideoId && (
          <VideoPlayer videoId={watchingVideoId} onBack={handleBackToHome} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="py-4 px-4 text-center">
      <p className="text-zinc-600 text-xs">
        Requested by <span className="text-zinc-500">@WolfyBlair</span> · Built by <span className="text-zinc-500">@clonkbot</span>
      </p>
    </footer>
  );
}
