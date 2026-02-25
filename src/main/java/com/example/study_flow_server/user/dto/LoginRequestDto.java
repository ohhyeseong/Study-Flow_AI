package com.example.study_flow_server.user.dto;

public record LoginRequestDto(
        String username,
        String password
) {
}