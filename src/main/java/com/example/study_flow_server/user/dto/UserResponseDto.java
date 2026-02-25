package com.example.study_flow_server.user.dto;

import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.domain.UserRole;

public record UserResponseDto(
        Long id,
        String password,
        String username,
        String nickname,
        String email

) {


}
