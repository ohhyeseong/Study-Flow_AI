package com.example.study_flow_server.user.dto;

public record UserUpdateDto(
        String nickname,
        String profileImageUrl
) {
}
