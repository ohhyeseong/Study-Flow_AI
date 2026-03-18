package com.example.study_flow_server.user.controller;

import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.global.security.CustomUserDetails;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.dto.UserCreateDto;
import com.example.study_flow_server.user.dto.UserResponseDto;
import com.example.study_flow_server.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponseDto> getMyInfo(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        User user = customUserDetails.getUser();

        UserResponseDto responseDto = new UserResponseDto(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getEmail(),
                user.getRole()
        );

        return ApiResponse.ok(responseDto);
    }

    @PatchMapping("/nickname")
    public ApiResponse<User> updateNickname(@RequestBody UserCreateDto userCreateDto) {
        User updatedUser = userService.updateNickname(userCreateDto);

        return ApiResponse.ok(updatedUser);
    }
}
