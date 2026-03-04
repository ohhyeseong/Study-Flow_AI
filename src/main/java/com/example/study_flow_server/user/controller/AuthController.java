package com.example.study_flow_server.user.controller;

import com.example.study_flow_server.jwt.TokenResponseDto;
import com.example.study_flow_server.user.dto.LoginRequestDto;
import com.example.study_flow_server.user.dto.UserCreateDto;
import com.example.study_flow_server.user.service.AuthService;
import com.example.study_flow_server.user.service.EmailService; // EmailService 주입 필요
import com.example.study_flow_server.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final EmailService emailService; // 이메일 서비스 추가

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<String> register(@Valid @RequestBody UserCreateDto userCreateDto) {
        userService.register(userCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다.");
    }

    // 1. 로그인
    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {
        TokenResponseDto tokenResponseDto = userService.login(loginRequestDto);
        return ResponseEntity.ok(tokenResponseDto);
    }

    // 2. 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String accessToken) {
        String token = accessToken.substring(7);
        userService.logout(token);
        return ResponseEntity.ok("로그아웃 성공");
    }


    // 3. 토큰 재발급
    @PostMapping("/reissue")
    public ResponseEntity<TokenResponseDto> reissue(@RequestHeader("Authorization") String refreshToken) {
        String token = refreshToken.substring(7);
        TokenResponseDto tokenResponseDto = userService.reissue(token);
        return ResponseEntity.ok(tokenResponseDto);
    }

    // 4. 이메일 인증번호 발송
    // 사용자가 이메일을 입력하고 '인증번호 받기'를 눌렀을 때 호출
    @PostMapping("/email-send")
    public ResponseEntity<String> sendEmail(@RequestParam String email) {
        emailService.sendVerificationCode(email);
        return ResponseEntity.ok("인증번호가 해당 이메일로 발송되었습니다.");
    }

    // 5. 이메일 인증번호 확인
    // 사용자가 번호를 입력하고 '확인'을 눌렀을 때 호출
    @PostMapping("/email-verify")
    public ResponseEntity<String> verifyEmail(@RequestParam String email, @RequestParam String code) {
        boolean isVerified = emailService.verifyCode(email, code);

        if (isVerified) {
            return ResponseEntity.ok("이메일 인증에 성공하였습니다.");
        } else {
            // 400 Bad Request와 함께 실패 메시지 반환
            return ResponseEntity.badRequest().body("인증번호가 일치하지 않거나 만료되었습니다.");
        }
    }
}