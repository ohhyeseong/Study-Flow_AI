package com.example.study_flow_server.post.dto;

import com.example.study_flow_server.post.domain.Post;
import com.example.study_flow_server.comment.dto.CommentResponseDto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record PostResponseDto(
        Long id,
        String title,
        String content,
        String authorName,
        LocalDateTime createdAt,
        List<CommentResponseDto> comments
) {
    public static PostResponseDto from(Post post) {
        return new PostResponseDto(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getUser() != null ? post.getUser().getNickname() : "알 수 없음",
                post.getCreatedAt(),
                post.getComments() != null ?
                        post.getComments().stream()
                                .filter(comment -> comment.getParent() == null)
                                .map(CommentResponseDto::from)
                                .collect(Collectors.toList()) : List.of()
        );
    }
}