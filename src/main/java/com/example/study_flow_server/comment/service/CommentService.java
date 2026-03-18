package com.example.study_flow_server.comment.service;

import com.example.study_flow_server.comment.dto.CommentCreateDto;
import com.example.study_flow_server.comment.dto.CommentResponseDto;
import com.example.study_flow_server.comment.dto.CommentUpdateDto;
import com.example.study_flow_server.comment.repository.CommentRepository;
import com.example.study_flow_server.comment.domain.Comment;
import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.post.domain.Post;
import com.example.study_flow_server.post.repository.PostRepository;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentResponseDto createComment(Long postId, Long userId, CommentCreateDto createDto) {
        Post post = findPostById(postId);
        User user = findUserById(userId);
        Comment parentComment = findParentCommentIfPresent(createDto.parentId());

        Comment newComment = Comment.builder()
                .content(createDto.content())
                .post(post)
                .user(user)
                .parent(parentComment)
                .build();

        Comment savedComment = commentRepository.save(newComment);

        return CommentResponseDto.from(savedComment);
    }

    public List<CommentResponseDto> getCommentsByPost(Long postId) {
        return commentRepository.findAllByPostIdWithUserAndPost(postId).stream()
                .filter(this::isRootComment)
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponseDto updateComment(CommentUpdateDto updateDto, Long commentId, User user) {
        Comment existingComment = findCommentById(commentId);
        
        validateCommentAuthor(existingComment, user);

        existingComment.update(updateDto.content());

        return CommentResponseDto.from(existingComment);
    }

    @Transactional
    public void deleteComment(Long commentId, User user) {
        Comment commentToDelete = findCommentById(commentId);
        
        validateCommentAuthor(commentToDelete, user);

        commentRepository.delete(commentToDelete);
    }

    private Post findPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private Comment findParentCommentIfPresent(Long parentId) {
        if (parentId == null) {
            return null;
        }
        return commentRepository.findById(parentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));
    }

    private Comment findCommentById(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));
    }

    private boolean isRootComment(Comment comment) {
        return comment.getParent() == null;
    }

    private void validateCommentAuthor(Comment comment, User user) {
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
    }
}
