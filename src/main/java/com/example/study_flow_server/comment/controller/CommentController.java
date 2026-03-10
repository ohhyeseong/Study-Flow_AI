package com.example.study_flow_server.comment.controller;

import com.example.study_flow_server.comment.dto.CommentCreateDto;
import com.example.study_flow_server.comment.dto.CommentResponseDto;
import com.example.study_flow_server.comment.dto.CommentUpdateDto;
import com.example.study_flow_server.comment.service.CommentService;
import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.global.security.CustomUserDetails;
import com.example.study_flow_server.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ApiResponse<CommentResponseDto> createComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CommentCreateDto createDto) {

        Long userId = userDetails.getUser().getId();
        CommentResponseDto response = commentService.createComment(postId, userId, createDto);
        return ApiResponse.ok(response);
    }

    @GetMapping("/list")
    public ApiResponse<List<CommentResponseDto>> getCommentsByPost(@PathVariable Long postId) {
        List<CommentResponseDto> responses = commentService.getCommentsByPost(postId);
        return ApiResponse.ok(responses);
    }

    @PatchMapping("/{commentId}")
    public ApiResponse<CommentResponseDto> updateComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateDto updateDto) {

        User user = userDetails.getUser();
        CommentResponseDto response = commentService.updateComment(updateDto,commentId,user);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/{commentId}")
    public ApiResponse<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        User user = userDetails.getUser();
        commentService.deleteComment(commentId,user);
        return ApiResponse.ok();
    }
}