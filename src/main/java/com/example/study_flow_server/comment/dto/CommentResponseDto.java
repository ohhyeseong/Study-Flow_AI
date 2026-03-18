package com.example.study_flow_server.comment.dto;

import com.example.study_flow_server.comment.domain.Comment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record CommentResponseDto(
        Long id,
        String content,
        String authorName,
        LocalDateTime createdAt,
        List<CommentResponseDto> children
) {
    public static CommentResponseDto from(Comment comment) {
        return new CommentResponseDto(
                comment.getId(),
                comment.getContent(),
                comment.getUser().getUsername(),
                comment.getCreatedAt(),
                comment.getChildren().stream()
                        .map(CommentResponseDto::from)
                        .collect(Collectors.toList())
        );
    }
}