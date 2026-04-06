package com.example.study_flow_server.user.controller;

import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.user.dto.AdminUserResponseDto;
import com.example.study_flow_server.user.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ApiResponse<List<AdminUserResponseDto>> getAllUsers() {
        return ApiResponse.ok(adminService.getAllUsers());
    }

    @PostMapping("/users/{userId}/ban")
    public ApiResponse<String> banUser(@PathVariable Long userId) {
        adminService.updateUserBanStatus(userId, true);
        return ApiResponse.ok("해당 유저가 정지되었습니다.");
    }

    @PostMapping("/users/{userId}/unban")
    public ApiResponse<String> unbanUser(@PathVariable Long userId) {
        adminService.updateUserBanStatus(userId, false);
        return ApiResponse.ok("해당 유저의 정지가 해제되었습니다.");
    }
}
