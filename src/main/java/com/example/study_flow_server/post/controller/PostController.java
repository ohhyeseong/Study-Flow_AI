package com.example.study_flow_server.post.controller;

import com.example.study_flow_server.global.exception.CustomException;
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

    @PutMapping("/{postId}")
    public ApiResponse<String> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody PostCreateDto postCreateDto,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        postService.updatePost(postId, postCreateDto, customUserDetails.getUsername());
        return ApiResponse.ok("게시글이 성공적으로 수정되었습니다.");
    }

    @DeleteMapping("/{postId}")
    public ApiResponse<String> deletePost(@PathVariable Long postId) {
        postService.deletePost(postId);
        return ApiResponse.ok("삭제성공");
    }

    @GetMapping("/{postId}")
    public ApiResponse<PostResponseDto> getPost(@PathVariable Long postId) {
        PostResponseDto response = postService.getPost(postId);
        return ApiResponse.ok(response);
    }

    @GetMapping("/list")
    public ApiResponse<List<PostResponseDto>> getAllPost() {
        List<PostResponseDto> responseDto = postService.getAllPosts();
        return ApiResponse.ok(responseDto);
    }
}
