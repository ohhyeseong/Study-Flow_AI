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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
        ChatRoomDto room = chatService.createRoom(dto.title(), userId, dto.isPrivate());
        broadcastRoomList();
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
            @RequestParam(required = false) String roomCode,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        ChatResponseDto notice = chatService.enterRoom(roomId, userId, roomCode);
        if (notice != null) {
            messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, notice);
        }
        broadcastRoomList();
        return ApiResponse.ok();
    }

    @GetMapping("/{roomId}/messages")
    public ApiResponse<List<ChatResponseDto>> getAllChats(@PathVariable Long roomId) {
        List<ChatResponseDto> messages = chatService.getChatMessages(roomId);
        return ApiResponse.ok(messages);
    }

    @GetMapping("/{roomId}/code")
    public ApiResponse<java.util.Map<String, String>> getRoomCode(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String code = chatService.getRoomCode(roomId, userDetails.getUser().getId());
        return ApiResponse.ok(java.util.Map.of("code", code));
    }

    @MessageMapping("/chat/message")
    public void processMessage(Principal principal, ChatCreateDto message) {
        if (principal == null) return;
        UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) principal;
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        ChatResponseDto responseDto = chatService.saveMessage(userDetails.getUser().getId(), message);
        messagingTemplate.convertAndSend("/sub/chat/room/" + responseDto.roomId(), responseDto);
    }

    @PostMapping("/{roomId}/exit")
    public ApiResponse<Void> exitRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        ChatResponseDto notice = chatService.exitRoom(roomId, userId);
        if (notice != null) {
            messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, notice);
        }
        broadcastRoomList();
        return ApiResponse.ok();
    }

    @PostMapping("/{roomId}/invite")
    public ApiResponse<Void> inviteUser(
            @PathVariable Long roomId,
            @RequestBody java.util.Map<String, String> request) {
        String targetEmail = request.get("email");
        if (targetEmail != null && !targetEmail.trim().isEmpty()) {
            chatService.sendRoomInvite(roomId, targetEmail);
        }
        return ApiResponse.ok();
    }

    private void broadcastRoomList() {
        List<ChatRoomDto> rooms = chatService.getAllRooms();
        messagingTemplate.convertAndSend("/sub/chat/rooms", rooms);
    }
}