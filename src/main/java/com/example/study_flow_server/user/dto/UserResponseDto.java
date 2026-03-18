package com.example.study_flow_server.user.dto;

import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.domain.UserRole;

public record UserResponseDto(
        Long id,
        String username,
        String nickname,
        String email,
        UserRole role
) {
    public static UserResponseDto from(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getEmail(),
                user.getRole()
        );
    }
}
