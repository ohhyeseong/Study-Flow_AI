package com.example.study_flow_server.post.controller;

import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.global.security.CustomUserDetails;
import com.example.study_flow_server.post.dto.PostCreateDto;
import com.example.study_flow_server.post.dto.PostResponseDto;
import com.example.study_flow_server.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    @PostMapping("/create")
    public ApiResponse<String> createPost(
            @Valid @RequestBody PostCreateDto postCreateDto,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        postService.createPost(postCreateDto, customUserDetails.getUsername());
        return ApiResponse.ok("게시글이 성공적으로 등록되었습니다.");
    }

    @PutMapping("/{postId:\\d+}")
    public ApiResponse<String> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody PostCreateDto postCreateDto,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        postService.updatePost(postId, postCreateDto, customUserDetails.getUsername());
        return ApiResponse.ok("게시글이 성공적으로 수정되었습니다.");
    }

    @DeleteMapping("/{postId:\\d+}")
    public ApiResponse<String> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        postService.deletePost(postId, customUserDetails.getUser());
        return ApiResponse.ok("삭제성공");
    }

    @GetMapping("/{postId:\\d+}")
    public ApiResponse<PostResponseDto> getPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        String username = customUserDetails != null ? customUserDetails.getUsername() : null;
        PostResponseDto response = postService.getPost(postId, username);
        return ApiResponse.ok(response);
    }

    @GetMapping("/list")
    public ApiResponse<List<PostResponseDto>> getAllPost(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        List<PostResponseDto> responseDto = postService.getAllPosts(username);
        return ApiResponse.ok(responseDto);
    }

    @GetMapping("/my")
    public ApiResponse<List<PostResponseDto>> getMyPosts(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<PostResponseDto> responseDto = postService.getMyPosts(customUserDetails.getUsername());
        return ApiResponse.ok(responseDto);
    }

    @PostMapping("/{postId:\\d+}/like")
    public ApiResponse<Boolean> toggleLike(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        boolean isLiked = postService.toggleLike(postId, customUserDetails.getUsername());
        return ApiResponse.ok(isLiked);
    }

    @GetMapping("/liked")
    public ApiResponse<List<PostResponseDto>> getLikedPosts(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<PostResponseDto> responseDto = postService.getLikedPosts(customUserDetails.getUsername());
        return ApiResponse.ok(responseDto);
    }
}
