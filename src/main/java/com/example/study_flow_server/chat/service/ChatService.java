package com.example.study_flow_server.chat.service;

import com.example.study_flow_server.chat.domain.ChatMessage;
import com.example.study_flow_server.chat.domain.ChatRoom;
import com.example.study_flow_server.chat.domain.ChatRoomMember;
import com.example.study_flow_server.chat.dto.ChatCreateDto;
import com.example.study_flow_server.chat.dto.ChatResponseDto;
import com.example.study_flow_server.chat.dto.ChatRoomDto;
import com.example.study_flow_server.chat.repository.ChatRepository;
import com.example.study_flow_server.chat.repository.ChatRoomMemberRepository;
import com.example.study_flow_server.chat.repository.ChatRoomRepository;
import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    @Transactional
    public ChatRoomDto createRoom(String title, Long userId) {
        User creator = findUserById(userId);

        ChatRoom chatRoom = ChatRoom.builder()
                .title(title)
                .creator(creator)
                .build();

        chatRoomRepository.save(chatRoom);

        joinRoom(chatRoom, creator);

        return ChatRoomDto.from(chatRoom, 1L);
    }

    @Transactional
    public void enterRoom(Long roomId, Long userId) {
        ChatRoom chatRoom = findChatRoomById(roomId);
        User user = findUserById(userId);

        if (isUserAlreadyInRoom(chatRoom, user)) {
            return;
        }

        joinRoom(chatRoom, user);
    }

    @Transactional
    public ChatResponseDto saveMessage(Long userId, ChatCreateDto chatCreateDto) {
        User sender = findUserById(userId);
        ChatRoom chatRoom = findChatRoomById(chatCreateDto.roomId());

        ChatMessage chatMessage = ChatMessage.builder()
                .content(chatCreateDto.content())
                .chatRoom(chatRoom)
                .sender(sender)
                .build();

        chatRepository.save(chatMessage);

        return ChatResponseDto.from(chatMessage);
    }

    @Transactional
    public void exitRoom(Long roomId, Long userId) {
        ChatRoom chatRoom = findChatRoomById(roomId);
        User user = findUserById(userId);

        chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user)
                .ifPresent(chatRoomMemberRepository::delete);

    }

    public List<ChatResponseDto> getChatMessages(Long roomId) {
        return chatRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(ChatResponseDto::from)
                .collect(Collectors.toList());
    }

    public List<ChatRoomDto> getAllRooms() {
        return chatRoomRepository.findAll().stream()
                .map(room -> {
                    Long count = chatRoomMemberRepository.countByChatRoom(room);
                    return ChatRoomDto.from(room, count);
                })
                .collect(Collectors.toList());
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private ChatRoom findChatRoomById(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.CHATROOM_NOT_FOUND));
    }

    private boolean isUserAlreadyInRoom(ChatRoom chatRoom, User user) {
        return chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user).isPresent();
    }

    private void joinRoom(ChatRoom chatRoom, User user) {
        ChatRoomMember member = ChatRoomMember.builder()
                .chatRoom(chatRoom)
                .user(user)
                .build();
        chatRoomMemberRepository.save(member);
    }
}
