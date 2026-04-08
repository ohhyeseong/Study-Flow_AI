package com.example.study_flow_server.user.controller;

import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.jwt.TokenResponseDto;
import com.example.study_flow_server.user.dto.LoginRequestDto;
import com.example.study_flow_server.user.dto.UserCreateDto;
import com.example.study_flow_server.user.service.EmailService;
import com.example.study_flow_server.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final EmailService emailService;

    @PostMapping("/signup")
    public ApiResponse<String> register(@Valid @RequestBody UserCreateDto userCreateDto) {
        userService.register(userCreateDto);
        return ApiResponse.ok("회원가입이 완료되었습니다.");
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {
        TokenResponseDto tokenResponseDto = userService.login(loginRequestDto);
        return ApiResponse.ok(tokenResponseDto);
    }

    @PostMapping("/logout")
    public ApiResponse<String> logout(@RequestHeader("Authorization") String accessToken) {
        String token = accessToken.substring(7);
        userService.logout(token);
        return ApiResponse.ok("로그아웃 성공");
    }

    @PostMapping("/reissue")
    public ApiResponse<TokenResponseDto> reissue(@RequestHeader("Authorization") String refreshToken) {
        String token = refreshToken.substring(7);
        TokenResponseDto tokenResponseDto = userService.reissue(token);
        return ApiResponse.ok(tokenResponseDto);
    }

    @PostMapping("/email-send")
    public ApiResponse<String> sendEmail(@RequestParam String email) {
        emailService.sendVerificationCode(email);
        return ApiResponse.ok("인증번호가 해당 이메일로 발송되었습니다.");
    }

    @PostMapping("/email-verify")
    public ApiResponse<String> verifyEmail(@RequestParam String email, @RequestParam String code) {
        boolean isVerified = emailService.verifyCode(email, code);

        if (isVerified) {
            return ApiResponse.ok("이메일 인증에 성공하였습니다.");
        } else {
            throw new CustomException(ErrorCode.INVALID_CODE);
        }
    }
}
