package com.example.study_flow_server.user.dto;

import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.domain.UserRole;

public record AdminUserResponseDto(
        Long id,
        String username,
        String nickname,
        String email,
        UserRole role,
        boolean isBanned
) {
    public static AdminUserResponseDto from(User user) {
        return new AdminUserResponseDto(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getEmail(),
                user.getRole(),
                user.isBanned()
        );
    }
}
