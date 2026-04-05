import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  videos: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_created", ["createdAt"]),

  watchHistory: defineTable({
    userId: v.id("users"),
    videoId: v.id("videos"),
    watchedAt: v.number(),
  }).index("by_user", ["userId"]),
});
