package com.example.study_flow_server.user.service;

import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.dto.AdminUserResponseDto;
import com.example.study_flow_server.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;

    public List<AdminUserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(AdminUserResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserBanStatus(Long userId, boolean isBanned) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        user.updateBanned(isBanned);
    }
}
