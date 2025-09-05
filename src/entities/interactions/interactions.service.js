import Like from '../like/like.model.js';
import Content from '../content/content.model.js';
import Follow from '../follow/follow.model.js';
import User from '../auth/auth.model.js';
import Comment from '../comment/comment.model.js';


export const toggleLikeService = async (userId, contentId) => {
  const existingLike = await Like.findOne({ userId, contentId });

  if (existingLike) {
    // User has already liked, so unlike.
    await Like.findByIdAndDelete(existingLike._id);
    // Decrement the likes count on the content
    await Content.findByIdAndUpdate(contentId, { $inc: { likesCount: -1 } });
    return { liked: false };
  } else {
    // User has not liked yet, so create a new like.
    await Like.create({ userId, contentId });
    // Increment the likes count on the content
    await Content.findByIdAndUpdate(contentId, { $inc: { likesCount: 1 } });
    return { liked: true };
  }
};


export const toggleFollowService = async (followerId, followingId) => {
    if (followerId === followingId) {
        throw new Error('Users cannot follow themselves.');
    }

    const existingFollow = await Follow.findOne({ followerId, followingId });

    if (existingFollow) {
        // User already follows, so unfollow.
        await Follow.findByIdAndDelete(existingFollow._id);
        // We could add follower/following counts to the User model and decrement here
        return { following: false };
    } else {
        // User does not follow yet, so create a new follow relationship.
        await Follow.create({ followerId, followingId });
        // We could add follower/following counts to the User model and increment here
        return { following: true };
    }
};

export const addCommentService = async (userId, contentId, text, parentId = null) => {
    const comment = await Comment.create({ userId, contentId, text, parentId });
    // Increment comments count on the content
    await Content.findByIdAndUpdate(contentId, { $inc: { commentsCount: 1 } });
    return comment;
};


export const getCommentsService = async (contentId) => {
    // This could be enhanced to support nested comment fetching
    const comments = await Comment.find({ contentId }).populate('userId', 'name username profileImage');
    return comments;
};


export const updateCommentService = async (userId, commentId, text) => {
    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
        throw new Error('Comment not found or user not authorized to edit.');
    }
    comment.text = text;
    await comment.save();
    return comment;
};


export const deleteCommentService = async (userId, commentId) => {
    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
        throw new Error('Comment not found or user not authorized to delete.');
    }
    await Comment.findByIdAndDelete(commentId);
    // Decrement comments count on the content
    await Content.findByIdAndUpdate(comment.contentId, { $inc: { commentsCount: -1 } });
};
