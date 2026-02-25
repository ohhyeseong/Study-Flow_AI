package com.example.study_flow_server.user.dto;



public record UserResponseDto(
        Long id,
        String password,
        String username,
        String nickname,
        String email

) {


}
