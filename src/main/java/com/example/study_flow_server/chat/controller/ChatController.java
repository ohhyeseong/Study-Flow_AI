package com.example.study_flow_server.chat.controller;

import com.example.study_flow_server.chat.dto.ChatCreateDto;
import com.example.study_flow_server.chat.dto.ChatResponseDto;
import com.example.study_flow_server.chat.dto.ChatRoomDto;
import com.example.study_flow_server.chat.service.ChatService;
import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.global.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
            @RequestBody String title,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUser().getId();
        ChatRoomDto room = chatService.createRoom(title, userId);
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
        return ApiResponse.ok();
    }

    @MessageMapping("/chat/message")
    public void processMessage(@AuthenticationPrincipal CustomUserDetails userDetails, ChatCreateDto message) {
        log.info("STOMP 메시지 수신: {}", message);

        Long userId = userDetails.getUser().getId();
        ChatResponseDto responseDto = chatService.saveMessage(userId, message);

        messagingTemplate.convertAndSend("/sub/chat/room/" + responseDto.roomId(), responseDto);
    }
}
