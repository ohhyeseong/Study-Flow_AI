package com.example.study_flow_server.user.service;

import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.jwt.JwtUtil;
import com.example.study_flow_server.jwt.TokenResponseDto;
import com.example.study_flow_server.redis.RedisService; // RedisService 임포트
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.domain.UserRole;
import com.example.study_flow_server.user.dto.LoginRequestDto;
import com.example.study_flow_server.user.dto.UserCreateDto;
import com.example.study_flow_server.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletResponse;
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
    private final RedisService redisService; // 인증 상태 확인을 위한 Redis 주입

    // 회원가입
    public User register(UserCreateDto userCreateDto) {
        // 1. 아이디 중복 확인
        if (userRepository.existsByUsername(userCreateDto.username())) {
            throw new IllegalArgumentException("아이디가 이미 존재합니다.");
        }

        // 2.  이메일 인증 완료 여부 검증
        // EmailService.verifyCode 성공 시 저장한 "DONE:{email}" 키를 조회합니다.
        String isVerified = redisService.getValues("DONE:" + userCreateDto.email());
        if (!"true".equals(isVerified)) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        // 3. 사용자 객체 생성
        User user = User.builder()
                .username(userCreateDto.username())
                .password(passwordEncoder.encode(userCreateDto.password()))
                .nickname(userCreateDto.nickname())
                .email(userCreateDto.email())
                .role(UserRole.USER)
                .build();



        // 4. 가입 완료 후 Redis의 인증 성공 티켓 삭제 (재사용 방지)
        redisService.deleteValues("DONE:" + userCreateDto.email());
        redisService.deleteValues("AUTH:" + userCreateDto.email());

        return userRepository.save(user);



    }

    // 로그인
    @Transactional
    public TokenResponseDto login(LoginRequestDto loginRequestDto) {
        String username = loginRequestDto.username();
        String role = "USER"; // 실제로는 DB에서 조회한 Role을 사용해야 함

        // 1. 사용자 확인
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 2. 비밀번호 확인
        if (!passwordEncoder.matches(loginRequestDto.password(), user.getPassword())) {
            throw new CustomException(ErrorCode.PASSWORD_IS_INCORRECT);
        }

        String accessToken = jwtUtil.createToken(username, role);
        String refreshToken = jwtUtil.createRefreshToken(username);

        // Redis에 Refresh Token 저장 (Key: username, Value: refreshToken, Duration: 7일)
        redisService.setValues(username, refreshToken, jwtUtil.getRefreshTokenTimeToLive());

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(60 * 60 * 1000L)
                .build();
    }

    // 토큰 재발급
    @Transactional
    public TokenResponseDto reissue(String refreshToken) {
        // 1. Refresh Token 검증
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 유효하지 않습니다.");
        }

        // 2. 토큰에서 사용자 정보 추출
        Claims claims = jwtUtil.getUserInfoFromToken(refreshToken);
        String username = claims.getSubject();

        // 3. Redis에 저장된 Refresh Token 가져오기
        String storedRefreshToken = redisService.getValues(username);

        // 4. Redis에 저장된 토큰과 일치하는지 확인
        if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
            throw new IllegalArgumentException("Refresh Token이 일치하지 않거나 만료되었습니다.");
        }

        // 5. 새로운 Access Token 생성
        String role = "USER"; // 실제로는 DB에서 조회하거나 Claims에서 가져와야 함
        String newAccessToken = jwtUtil.createToken(username, role);

        // Refresh Token Rotation (선택 사항): 보안을 위해 Refresh Token도 새로 발급할 수 있음
        // 여기서는 Access Token만 재발급하는 것으로 구현

        return TokenResponseDto.builder()
                .grantType(JwtUtil.BEARER_PREFIX)
                .accessToken(newAccessToken)
                .refreshToken(refreshToken) // 기존 Refresh Token 반환
                .accessTokenExpiresIn(60 * 60 * 1000L)
                .build();
    }

    // 로그아웃
    @Transactional
    public void logout(String accessToken) {
        // 1. 토큰 검증
        if (!jwtUtil.validateToken(accessToken)) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }

        // 2. 토큰에서 사용자 정보 및 만료 시간 추출
        Claims claims = jwtUtil.getUserInfoFromToken(accessToken);
        String username = claims.getSubject();
        long expiration = claims.getExpiration().getTime() - System.currentTimeMillis();

        // 3. Redis에서 해당 유저의 RefreshToken 삭제
        if (redisService.getValues(username) != null) {
            redisService.deleteValues(username);
        }

        // 4. AccessToken 블랙리스트 등록 (남은 시간만큼만 유지)
        if (expiration > 0) {
            redisService.setBlackList("blacklist:" + accessToken, "logout", Duration.ofMillis(expiration));
        }
    }

    // 닉네임 변경
    public User updateNickname(UserCreateDto userCreateDto) {
        User user = userRepository.findByUsername(userCreateDto.username())
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));

        user.updateNickname(userCreateDto.nickname());
        return user;
    }

}