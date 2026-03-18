package com.example.study_flow_server.user.service;

import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.jwt.JwtUtil;
import com.example.study_flow_server.jwt.TokenResponseDto;
import com.example.study_flow_server.redis.RedisService;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.domain.UserRole;
import com.example.study_flow_server.user.dto.LoginRequestDto;
import com.example.study_flow_server.user.dto.UserCreateDto;
import com.example.study_flow_server.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RedisService redisService;

    private static final String REDIS_DONE_PREFIX = "DONE:";
    private static final String REDIS_AUTH_PREFIX = "AUTH:";
    private static final String REDIS_BLACKLIST_PREFIX = "blacklist:";
    private static final long ACCESS_TOKEN_EXPIRATION_MS = 60 * 60 * 1000L;

    public User register(UserCreateDto userCreateDto) {
        validateUsernameNotExists(userCreateDto.username());
        validateEmailVerification(userCreateDto.email());

        User user = createUserEntity(userCreateDto);
        clearVerificationDataFromRedis(userCreateDto.email());

        return userRepository.save(user);
    }

    @Transactional
    public TokenResponseDto login(LoginRequestDto loginRequestDto) {
        User user = getUserByUsername(loginRequestDto.username());
        validatePassword(loginRequestDto.password(), user.getPassword());

        return generateAndStoreTokens(user.getUsername());
    }

    @Transactional
    public TokenResponseDto reissue(String refreshToken) {
        validateTokenString(refreshToken, "Refresh Token이 유효하지 않습니다.");

        String username = getUsernameFromToken(refreshToken);
        validateStoredRefreshToken(username, refreshToken);

        return createReissuedTokenResponse(username, refreshToken);
    }

    @Transactional
    public void logout(String accessToken) {
        validateTokenString(accessToken, "유효하지 않은 토큰입니다.");

        Claims claims = jwtUtil.getUserInfoFromToken(accessToken);
        String username = claims.getSubject();
        
        deleteStoredRefreshToken(username);
        addTokenToBlacklist(accessToken, claims);
    }

    public User updateNickname(UserCreateDto userCreateDto) {
        User user = getUserByUsername(userCreateDto.username());
        user.updateNickname(userCreateDto.nickname());
        return user;
    }

    private void validateUsernameNotExists(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("아이디가 이미 존재합니다.");
        }
    }

    private void validateEmailVerification(String email) {
        String isVerified = redisService.getValues(REDIS_DONE_PREFIX + email);
        if (!"true".equals(isVerified)) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }
    }

    private User createUserEntity(UserCreateDto userCreateDto) {
        return User.builder()
                .username(userCreateDto.username())
                .password(passwordEncoder.encode(userCreateDto.password()))
                .nickname(userCreateDto.nickname())
                .email(userCreateDto.email())
                .role(UserRole.USER)
                .build();
    }

    private void clearVerificationDataFromRedis(String email) {
        redisService.deleteValues(REDIS_DONE_PREFIX + email);
        redisService.deleteValues(REDIS_AUTH_PREFIX + email);
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private void validatePassword(String rawPassword, String encodedPassword) {
        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
            throw new CustomException(ErrorCode.PASSWORD_IS_INCORRECT);
        }
    }

    private TokenResponseDto generateAndStoreTokens(String username) {
        String accessToken = jwtUtil.createToken(username, UserRole.USER.name());
        String refreshToken = jwtUtil.createRefreshToken(username);

        redisService.setValues(username, refreshToken, jwtUtil.getRefreshTokenTimeToLive());

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(ACCESS_TOKEN_EXPIRATION_MS)
                .build();
    }

    private void validateTokenString(String token, String errorMessage) {
        if (!jwtUtil.validateToken(token)) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private String getUsernameFromToken(String token) {
        Claims claims = jwtUtil.getUserInfoFromToken(token);
        return claims.getSubject();
    }

    private void validateStoredRefreshToken(String username, String providedRefreshToken) {
        String storedRefreshToken = redisService.getValues(username);
        if (storedRefreshToken == null || !storedRefreshToken.equals(providedRefreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 일치하지 않거나 만료되었습니다.");
        }
    }

    private TokenResponseDto createReissuedTokenResponse(String username, String refreshToken) {
        String newAccessToken = jwtUtil.createToken(username, UserRole.USER.name());

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(ACCESS_TOKEN_EXPIRATION_MS)
                .build();
    }

    private void deleteStoredRefreshToken(String username) {
        if (redisService.getValues(username) != null) {
            redisService.deleteValues(username);
        }
    }

    private void addTokenToBlacklist(String accessToken, Claims claims) {
        long expirationRemainingTime = claims.getExpiration().getTime() - System.currentTimeMillis();
        if (expirationRemainingTime > 0) {
            redisService.setBlackList(REDIS_BLACKLIST_PREFIX + accessToken, "logout", Duration.ofMillis(expirationRemainingTime));
        }
    }
}
