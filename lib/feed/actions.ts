"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import type { Post, CreatePostInput, FeedFilter, PostLike, PostComment } from "./types";

// ==================== FEED POSTS ====================

export async function getFeedPosts(filter: FeedFilter = { sortBy: 'latest' }, page: number = 1, limit: number = 20): Promise<{ posts: Post[]; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, full_name, role, player_profile:player_profiles(primary_position, verification_level))
    `)
    .eq("is_published", true);
  
  // Apply filters
  if (filter.contentType && filter.contentType !== 'all') {
    query = query.eq("content_type", filter.contentType);
  }
  
  if (filter.position) {
    query = query.eq("position_tag", filter.position);
  }
  
  // Sort
  if (filter.sortBy === 'latest') {
    query = query.order("created_at", { ascending: false });
  } else if (filter.sortBy === 'popular') {
    query = query.order("likes_count", { ascending: false });
  }
  
  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);
  
  const { data: posts, error } = await query;
  
  if (error) {
    console.error("Error fetching feed posts:", error);
    return { posts: [], error: error.message };
  }
  
  // If user is logged in, check which posts they liked
  if (user && posts) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", posts.map(p => p.id));
    
    const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
    
    posts.forEach(post => {
      post.is_liked_by_user = likedPostIds.has(post.id);
    });
  }
  
  return { posts: posts || [], error: null };
}

export async function getFollowingFeed(page: number = 1, limit: number = 20): Promise<{ posts: Post[]; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { posts: [], error: "Not authenticated" };
  }
  
  // Get IDs of users the current user follows
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);
  
  const followingIds = following?.map(f => f.following_id) || [];
  
  if (followingIds.length === 0) {
    return { posts: [], error: null };
  }
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, full_name, role, player_profile:player_profiles(primary_position, verification_level))
    `)
    .eq("is_published", true)
    .in("author_id", followingIds)
    .order("created_at", { ascending: false })
    .range(from, to);
  
  if (error) {
    return { posts: [], error: error.message };
  }
  
  // Mark all as liked since we know user is following
  posts?.forEach(post => {
    post.is_liked_by_user = false; // Will be updated below
  });
  
  const { data: likes } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", user.id)
    .in("post_id", posts?.map(p => p.id) || []);
  
  const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
  posts?.forEach(post => {
    post.is_liked_by_user = likedPostIds.has(post.id);
  });
  
  return { posts: posts || [], error: null };
}

export async function getUserPosts(userId: string, page: number = 1, limit: number = 20): Promise<{ posts: Post[]; error: string | null }> {
  const supabase = await createClient();
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, full_name, role, player_profile:player_profiles(primary_position, verification_level))
    `)
    .eq("author_id", userId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to);
  
  if (error) {
    return { posts: [], error: error.message };
  }
  
  return { posts: posts || [], error: null };
}

// ==================== POST CRUD ====================

export async function createPost(post: CreatePostInput): Promise<{ success: boolean; post: Post | null; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[Server createPost] User:", user?.id);
  
  if (!user) {
    return { success: false, post: null, error: "Not authenticated" };
  }
  
  const insertData = {
    author_id: user.id,
    content_type: post.content_type,
    caption: post.caption,
    media_url: post.media_url, // Now accepts null for videos
    thumbnail_url: post.thumbnail_url,
    media_type: post.media_type,
    position_tag: post.position_tag,
    club_history_tag: post.club_history_tag,
    match_tag: post.match_tag,
    training_tag: post.training_tag,
  };
  
  console.log("[Server createPost] Inserting:", insertData);
  
  const { data, error } = await supabase
    .from("posts")
    .insert(insertData)
    .select(`
      *,
      author:profiles(id, full_name, role, player_profile:player_profiles(primary_position, verification_level))
    `)
    .single();
  
  console.log("[Server createPost] Result:", { data, error });
  
  if (error) {
    console.error("[Server createPost] Error:", error);
    return { success: false, post: null, error: error.message };
  }
  
  revalidatePath("/feed");
  revalidatePath("/profile");
  
  return { success: true, post: data, error: null };
}

export async function deletePost(postId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  
  // Verify ownership
  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();
  
  if (!post || post.author_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }
  
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath("/feed");
  revalidatePath("/profile");
  
  return { success: true, error: null };
}

// ==================== LIKES ====================

export async function likePost(postId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[likePost] User:", user?.id, "Post:", postId);
  
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  
  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: user.id });
  
  if (error) {
    console.log("[likePost] Error:", error);
    // Likely already liked, ignore
    if (error.code === "23505") {
      return { success: true, error: null };
    }
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

export async function unlikePost(postId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

// ==================== COMMENTS ====================

export async function getPostComments(postId: string): Promise<{ comments: PostComment[]; error: string | null }> {
  const supabase = await createClient();
  
  const { data: comments, error } = await supabase
    .from("post_comments")
    .select(`
      *,
      author:profiles(id, full_name, role)
    `)
    .eq("post_id", postId)
    .is("parent_comment_id", null)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("[getPostComments] Error:", error);
    return { comments: [], error: error.message };
  }
  
  return { comments: comments || [], error: null };
}

export async function addComment(postId: string, content: string, parentCommentId?: string): Promise<{ success: boolean; comment: PostComment | null; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[addComment] User:", user?.id, "Post:", postId, "Content:", content);
  
  if (!user) {
    return { success: false, comment: null, error: "Not authenticated" };
  }
  
  const insertData = {
    post_id: postId,
    author_id: user.id,
    content,
    parent_comment_id: parentCommentId || null,
  };
  
  console.log("[addComment] Inserting:", insertData);
  
  const { data, error } = await supabase
    .from("post_comments")
    .insert(insertData)
    .select(`
      *,
      author:profiles(id, full_name, role)
    `)
    .single();
  
  if (error) {
    console.error("[addComment] Error:", error);
    return { success: false, comment: null, error: error.message };
  }
  
  console.log("[addComment] Success:", data);
  return { success: true, comment: data, error: null };
}

// ==================== COMMENT LIKES ====================

export async function likeComment(commentId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[likeComment] User:", user?.id, "Comment:", commentId);
  
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  
  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: user.id });
  
  if (error) {
    console.log("[likeComment] Error:", error);
    // Likely already liked, ignore
    if (error.code === "23505") {
      return { success: true, error: null };
    }
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

export async function unlikeComment(commentId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  
  const { error } = await supabase
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", user.id);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}
