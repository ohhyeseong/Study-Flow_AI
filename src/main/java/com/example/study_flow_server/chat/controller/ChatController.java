package com.example.study_flow_server.chat.controller;

import com.example.study_flow_server.chat.dto.ChatCreateDto;
import com.example.study_flow_server.chat.dto.ChatResponseDto;
import com.example.study_flow_server.chat.dto.ChatRoomCreateDto;
import com.example.study_flow_server.chat.dto.ChatRoomDto;
import com.example.study_flow_server.chat.service.ChatService;
import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/rooms")
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ApiResponse<ChatRoomDto> createRoom(
            @Valid @RequestBody ChatRoomCreateDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUser().getId();

        ChatRoomDto room = chatService.createRoom(dto.title(), userId);
        return ApiResponse.ok(room);
    }

    @GetMapping
    public ApiResponse<List<ChatRoomDto>> getAllRooms() {
        List<ChatRoomDto> allRooms = chatService.getAllRooms();
        return ApiResponse.ok(allRooms);
    }

    @PostMapping("/{roomId}/enter")
    public ApiResponse<Void> enterRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUser().getId();
        chatService.enterRoom(roomId, userId);


        List<ChatRoomDto> rooms = chatService.getAllRooms();
        messagingTemplate.convertAndSend("/sub/chat/rooms", rooms);

        return ApiResponse.ok();
    }

    @GetMapping("/{roomId}/messages")
    public ApiResponse<List<ChatResponseDto>> getAllChats(@PathVariable Long roomId) {
        List<ChatResponseDto> messages = chatService.getChatMessages(roomId);
        return ApiResponse.ok(messages);
    }

    @MessageMapping("/chat/message")
    public void processMessage(Principal principal, ChatCreateDto message) {
        if (principal == null) {
            log.error("Principal 객체가 null입니다. 인증 인터셉터를 확인하세요.");
            return;
        }

        // 2. 인증 객체 변환
        UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) principal;
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();

        if (userDetails.getUser() == null) {
            log.error("User 객체가 null입니다.");
            return;
        }

        Long userId = userDetails.getUser().getId();
        log.info("메시지 저장 시도 - 유저: {}, 내용: {}", userDetails.getUsername(), message.content());

        ChatResponseDto responseDto = chatService.saveMessage(userId, message);
        messagingTemplate.convertAndSend("/sub/chat/room/" + responseDto.roomId(), responseDto);
    }

    @PostMapping("/{roomId}/exit")
    public ApiResponse<Void> exitRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUser().getId();
        chatService.exitRoom(roomId, userId);

        List<ChatRoomDto> rooms = chatService.getAllRooms();
        messagingTemplate.convertAndSend("/sub/chat/rooms", rooms);

        return ApiResponse.ok();
    }
}
