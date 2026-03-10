package com.example.study_flow_server.chat.controller;

import com.example.study_flow_server.chat.dto.ChatCreateDto;
import com.example.study_flow_server.chat.dto.ChatResponseDto;
import com.example.study_flow_server.chat.dto.ChatRoomDto;
import com.example.study_flow_server.chat.service.ChatService;
import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.global.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // 채팅방 생성
    @PostMapping("/api/chat/rooms")
    public ApiResponse<ChatRoomDto> createRoom(
                                                @RequestBody String title,
                                                @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUser().getId();
        ChatRoomDto room = chatService.createRoom(title, userId);
        return ApiResponse.ok(room);
    }

    // 채팅방 조회
    @GetMapping("/api/chat/rooms")
    public ApiResponse<List<ChatRoomDto>> getAllRooms() {
        List<ChatRoomDto> allRooms = chatService.getAllRooms();
        return ApiResponse.ok(allRooms);
    }

    // 채팅방 입장
    @PostMapping("/api/chat/rooms/{roomId}/enter")
    public ApiResponse<Void> enterRoom(
                                        @PathVariable Long roomId,
                                        @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUser().getId();
        chatService.enterRoom(roomId, userId);
        return ApiResponse.ok();
    }


    // --- WebSocket (메시지 전송) ---

    /**
     * 클라이언트가 /pub/chat/message 로 메시지를 보내면 호출됩니다.
     */
    @MessageMapping("/chat/message")
    public void message(@AuthenticationPrincipal CustomUserDetails userDetails,ChatCreateDto message) {
        log.info("STOMP 메시지 수신: {}", message);

        // 1. 서비스 호출해서 DB에 저장
        Long userId = userDetails.getUser().getId();
        ChatResponseDto responseDto = chatService.saveMessage(userId, message);

        // 2. /sub/chat/room/{roomId} 를 구독 중인 사람들에게 메시지 전달
        messagingTemplate.convertAndSend("/sub/chat/room/" + responseDto.roomId(), responseDto);
    }
}