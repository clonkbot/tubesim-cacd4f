import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_created")
      .order("desc")
      .take(50);
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("videos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("videos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    thumbnailBase64: v.optional(v.string()),
    channelName: v.string(),
    channelAvatar: v.optional(v.string()),
    views: v.number(),
    likes: v.number(),
    dislikes: v.number(),
    comments: v.array(v.object({
      author: v.string(),
      text: v.string(),
      likes: v.number(),
      timestamp: v.string(),
    })),
    duration: v.string(),
    uploadedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("videos", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const addToHistory = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    await ctx.db.insert("watchHistory", {
      userId,
      videoId: args.videoId,
      watchedAt: Date.now(),
    });
  },
});

export const incrementViews = mutation({
  args: { id: v.id("videos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.id);
    if (!video) return;
    await ctx.db.patch(args.id, { views: video.views + 1 });
  },
});

export const likeVideo = mutation({
  args: { id: v.id("videos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.id);
    if (!video) return;
    await ctx.db.patch(args.id, { likes: video.likes + 1 });
  },
});

export const dislikeVideo = mutation({
  args: { id: v.id("videos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.id);
    if (!video) return;
    await ctx.db.patch(args.id, { dislikes: video.dislikes + 1 });
  },
});

export const remove = mutation({
  args: { id: v.id("videos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const video = await ctx.db.get(args.id);
    if (!video || video.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});
