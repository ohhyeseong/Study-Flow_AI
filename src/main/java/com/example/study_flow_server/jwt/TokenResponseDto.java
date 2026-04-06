package com.example.study_flow_server.jwt;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TokenResponseDto {
    private String grantType;
    private String accessToken;
    private String refreshToken;
    private String role;
    private Long accessTokenExpiresIn;
}