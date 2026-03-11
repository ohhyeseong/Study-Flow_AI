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
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Comment parent = null;
        if (createDto.parentId() != null) {
            parent = commentRepository.findById(createDto.parentId())
                    .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));
        }

        Comment comment = Comment.builder()
                .content(createDto.content())
                .post(post)
                .user(user)
                .parent(parent)
                .build();

        Comment response = commentRepository.save(comment);

        return CommentResponseDto.from(response);
    }

    public List<CommentResponseDto> getCommentsByPost(Long postId) {
        return commentRepository.findAllByPostIdWithUserAndPost(postId).stream()
                .filter(comment -> comment.getParent() == null)
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponseDto updateComment(CommentUpdateDto dto,
                                            Long commentId,
                                            User user) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        if(!comment.getUser().getId().equals(user.getId())){
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        comment.update(dto.content());

        return CommentResponseDto.from(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        commentRepository.delete(comment);
    }

}