package com.example.study_flow_server.user.controller;

import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.global.security.CustomUserDetails;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.dto.UserResponseDto;
import com.example.study_flow_server.user.dto.UserUpdateDto;
import com.example.study_flow_server.user.service.S3Service;
import com.example.study_flow_server.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final S3Service s3Service;

    @GetMapping("/me")
    public ApiResponse<UserResponseDto> getMyInfo(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        User user = customUserDetails.getUser();
        return ApiResponse.ok(UserResponseDto.from(user));
    }

    @PutMapping("/me")
    public ApiResponse<UserResponseDto> updateMyInfo(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestBody UserUpdateDto userUpdateDto) {

        User updatedUser = userService.updateMyInfo(customUserDetails.getUser().getUsername(), userUpdateDto);
        return ApiResponse.ok(UserResponseDto.from(updatedUser));
    }

    @PostMapping("/me/profile-image")
    public ApiResponse<UserResponseDto> uploadProfileImage(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestPart("file") MultipartFile file) {

        String imageUrl = s3Service.uploadFile(file);
        User updatedUser = userService.updateMyProfileImage(customUserDetails.getUser().getUsername(), imageUrl);
        return ApiResponse.ok(UserResponseDto.from(updatedUser));
    }
}
