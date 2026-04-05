import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface HomePageProps {
  onWatchVideo: (videoId: Id<"videos">) => void;
}

export function HomePage({ onWatchVideo }: HomePageProps) {
  const videos = useQuery(api.videos.list);

  if (videos === undefined) {
    return (
      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <VideoSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">No videos yet</h2>
        <p className="text-zinc-400 text-center max-w-md">
          Click the <span className="text-red-400 font-semibold">Create</span> button to generate your first AI-powered video!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-red-500 rounded-full"></span>
        Recommended
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {videos.map((video: { _id: Id<"videos">; title: string; channelName: string; thumbnailBase64?: string; views: number; uploadedAt: string; duration: string }) => (
          <VideoCard
            key={video._id}
            video={video}
            onClick={() => onWatchVideo(video._id)}
          />
        ))}
      </div>
    </div>
  );
}

interface VideoCardProps {
  video: {
    _id: Id<"videos">;
    title: string;
    channelName: string;
    thumbnailBase64?: string;
    views: number;
    uploadedAt: string;
    duration: string;
  };
  onClick: () => void;
}

function VideoCard({ video, onClick }: VideoCardProps) {
  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <button
      onClick={onClick}
      className="group text-left w-full focus:outline-none focus:ring-2 focus:ring-red-500 rounded-xl"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 mb-3">
        {video.thumbnailBase64 ? (
          <img
            src={`data:image/png;base64,${video.thumbnailBase64}`}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
          {video.duration}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
          {video.channelName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium line-clamp-2 text-sm md:text-base leading-snug group-hover:text-red-400 transition-colors">
            {video.title}
          </h3>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">{video.channelName}</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            {formatViews(video.views)} views · {video.uploadedAt}
          </p>
        </div>
      </div>
    </button>
  );
}

function VideoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video rounded-xl bg-zinc-800 mb-3" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
          <div className="h-3 bg-zinc-800 rounded w-3/4 mb-1" />
          <div className="h-3 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
