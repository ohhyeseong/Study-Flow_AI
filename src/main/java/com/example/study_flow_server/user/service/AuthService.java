package com.example.study_flow_server.user.service;

import com.example.study_flow_server.jwt.*;
import com.example.study_flow_server.redis.RedisService;
import com.example.study_flow_server.user.dto.LoginRequestDto;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;
    private final RedisService redisService;
//
//    @Transactional
//    public TokenResponseDto login(LoginRequestDto loginRequestDto) {
//        String username = loginRequestDto.username();
//        String role = "USER"; // 실제로는 DB에서 조회한 Role을 사용해야 함
//
//        String accessToken = jwtUtil.createToken(username, role);
//        String refreshToken = jwtUtil.createRefreshToken(username);
//
//        // Redis에 Refresh Token 저장 (Key: username, Value: refreshToken, Duration: 7일)
//        redisService.setValues(username, refreshToken, jwtUtil.getRefreshTokenTimeToLive());
//
//        return TokenResponseDto.builder()
//                .grantType(JwtUtil.BEARER_PREFIX)
//                .accessToken(accessToken)
//                .refreshToken(refreshToken)
//                .accessTokenExpiresIn(60 * 60 * 1000L)
//                .build();
//    }



}