import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface VideoPlayerProps {
  videoId: Id<"videos">;
  onBack: () => void;
}

export function VideoPlayer({ videoId, onBack }: VideoPlayerProps) {
  const video = useQuery(api.videos.get, { id: videoId });
  const incrementViews = useMutation(api.videos.incrementViews);
  const likeVideo = useMutation(api.videos.likeVideo);
  const dislikeVideo = useMutation(api.videos.dislikeVideo);
  const tts = useAction(api.ai.textToSpeech);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isReadingDescription, setIsReadingDescription] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    incrementViews({ id: videoId });
  }, [videoId, incrementViews]);

  const handleLike = () => {
    if (!hasLiked) {
      likeVideo({ id: videoId });
      setHasLiked(true);
      setHasDisliked(false);
    }
  };

  const handleDislike = () => {
    if (!hasDisliked) {
      dislikeVideo({ id: videoId });
      setHasDisliked(true);
      setHasLiked(false);
    }
  };

  const handleReadDescription = async () => {
    if (!video || isReadingDescription) return;
    setIsReadingDescription(true);

    try {
      const audioBase64 = await tts({
        text: `${video.title}. ${video.description}`,
        voice: "Kore",
      });

      const audioUrl = pcmToWav(audioBase64);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsReadingDescription(false);
      audio.play();
    } catch {
      setIsReadingDescription(false);
    }
  };

  function pcmToWav(base64Pcm: string): string {
    const pcm = Uint8Array.from(atob(base64Pcm), c => c.charCodeAt(0));
    const sampleRate = 24000;
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const w = (o: number, s: string) => s.split('').forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); view.setUint32(4, 36 + pcm.length, true);
    w(8, 'WAVE'); w(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); w(36, 'data');
    view.setUint32(40, pcm.length, true);
    const wav = new Uint8Array(44 + pcm.length);
    wav.set(new Uint8Array(header), 0);
    wav.set(pcm, 44);
    return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
  }

  if (video === undefined) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="aspect-video bg-zinc-800 rounded-xl mb-4" />
            <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-zinc-400">Video not found</p>
        <button onClick={onBack} className="mt-4 text-red-400 hover:text-red-300">
          ← Go back
        </button>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Video Section */}
          <div className="flex-1">
            {/* Video Player */}
            <div
              className="relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {video.thumbnailBase64 ? (
                <img
                  src={`data:image/png;base64,${video.thumbnailBase64}`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
              )}

              {/* Play Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-0' : 'bg-black/30'}`}>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Simulated Video Progress */}
              {isPlaying && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                  <div className="h-full bg-red-500 animate-progress" />
                </div>
              )}

              {/* Duration Badge */}
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                {video.duration}
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h1 className="text-lg md:text-xl font-bold text-white leading-tight">{video.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {video.channelName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{video.channelName}</p>
                    <p className="text-zinc-500 text-xs">{formatNumber(Math.floor(video.views / 100))} subscribers</p>
                  </div>
                </div>

                <button className="px-4 py-2 bg-white text-black font-medium rounded-full text-sm hover:bg-zinc-200 transition-colors">
                  Subscribe
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex bg-zinc-800 rounded-full overflow-hidden">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 transition-colors ${hasLiked ? 'bg-zinc-700' : 'hover:bg-zinc-700'}`}
                  >
                    <svg className={`w-5 h-5 ${hasLiked ? 'text-white' : 'text-zinc-400'}`} fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="text-white text-sm font-medium">{formatNumber(video.likes + (hasLiked ? 1 : 0))}</span>
                  </button>
                  <div className="w-px bg-zinc-700" />
                  <button
                    onClick={handleDislike}
                    className={`flex items-center gap-2 px-4 py-2 transition-colors ${hasDisliked ? 'bg-zinc-700' : 'hover:bg-zinc-700'}`}
                  >
                    <svg className={`w-5 h-5 transform rotate-180 ${hasDisliked ? 'text-white' : 'text-zinc-400'}`} fill={hasDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-white text-sm font-medium">Share</span>
                </button>

                <button
                  onClick={handleReadDescription}
                  disabled={isReadingDescription}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    isReadingDescription
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {isReadingDescription ? 'Reading...' : 'Listen'}
                  </span>
                </button>
              </div>

              {/* Description */}
              <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <span className="font-medium text-white">{formatNumber(video.views)} views</span>
                  <span>·</span>
                  <span>{video.uploadedAt}</span>
                </div>
                <p className={`text-zinc-300 text-sm ${!showFullDescription && 'line-clamp-2'}`}>
                  {video.description}
                </p>
                {video.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-zinc-400 hover:text-white text-sm font-medium mt-2"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Comments */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {video.comments.length} Comments
                </h2>
                <div className="space-y-4">
                  {video.comments.map((comment: { author: string; text: string; likes: number; timestamp: string }, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                        {comment.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">@{comment.author}</span>
                          <span className="text-zinc-500 text-xs">{comment.timestamp}</span>
                        </div>
                        <p className="text-zinc-300 text-sm mt-1">{comment.text}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="text-xs">{comment.likes}</span>
                          </button>
                          <button className="text-zinc-500 hover:text-white text-xs transition-colors">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos Placeholder */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <h3 className="text-white font-medium mb-4 hidden lg:block">Up next</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-2 opacity-50">
                  <div className="w-40 lg:w-28 aspect-video bg-zinc-800 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-zinc-800 rounded w-full mb-2" />
                    <div className="h-3 bg-zinc-800 rounded w-3/4 mb-1" />
                    <div className="h-2 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
