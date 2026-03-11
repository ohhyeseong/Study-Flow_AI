package com.example.study_flow_server.user.controller;

import com.example.study_flow_server.global.security.CustomUserDetails;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.dto.UserCreateDto;
import com.example.study_flow_server.user.dto.UserResponseDto;
import com.example.study_flow_server.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/find")
    public ResponseEntity<UserResponseDto> getMyInfo(@AuthenticationPrincipal CustomUserDetails customUserDetails) {

        User user = customUserDetails.getUser();

        UserResponseDto responseDto = new UserResponseDto(
                user.getId(),
                null,
                user.getUsername(),
                user.getNickname(),
                user.getEmail()
        );

        return ResponseEntity.ok(responseDto);
    }

    //닉네임 변경
    @PatchMapping("/nickname")
    public ResponseEntity<User> updateNickname(@RequestBody UserCreateDto userCreateDto) {

        // 서비스 호출하여 닉네임 변경 실행
        User updatedUser = userService.updateNickname(userCreateDto);

        // 변경된 사용자 정보와 함께 200 OK 응답 반환
        return ResponseEntity.ok(updatedUser);
    }
}

