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
import com.example.study_flow_server.user.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final EmailService emailService;

    @Transactional
    public ChatRoomDto createRoom(String title, Long userId, boolean isPrivate) {
        User creator = findUserById(userId);
        String roomCode = isPrivate
                ? String.format("%06d", java.util.concurrent.ThreadLocalRandom.current().nextInt(1000000))
                : null;
        ChatRoom chatRoom = ChatRoom.builder().title(title).creator(creator).isPrivate(isPrivate).roomCode(roomCode)
                .build();
        chatRoomRepository.save(chatRoom);
        joinRoom(chatRoom, creator);
        return ChatRoomDto.from(chatRoom, 1L);
    }

    @Transactional
    public ChatResponseDto enterRoom(Long roomId, Long userId, String roomCode) {
        ChatRoom chatRoom = findChatRoomById(roomId);
        User user = findUserById(userId);

        if (isUserAlreadyInRoom(chatRoom, user))
            return null;

        if (chatRoom.isPrivate()) {
            if (roomCode == null || !roomCode.equals(chatRoom.getRoomCode())) {
                throw new CustomException(ErrorCode.FORBIDDEN);
            }
        }
        joinRoom(chatRoom, user);

        return new ChatResponseDto(0L, user.getUsername() + "님이 입장하셨습니다.", null, null, roomId, LocalDateTime.now());
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
    public ChatResponseDto exitRoom(Long roomId, Long userId) {
        ChatRoom chatRoom = findChatRoomById(roomId);
        User user = findUserById(userId);
        chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user).ifPresent(chatRoomMemberRepository::delete);

        return new ChatResponseDto(0L, user.getUsername() + "님이 나갔습니다.", null, null, roomId, LocalDateTime.now());
    }

    public List<ChatResponseDto> getChatMessages(Long roomId) {
        return chatRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId).stream()
                .map(ChatResponseDto::from).collect(Collectors.toList());
    }

    public String getRoomCode(Long roomId, Long userId) {
        ChatRoom chatRoom = findChatRoomById(roomId);
        if (!chatRoom.isPrivate()) return null;
        
        User user = findUserById(userId);
        if (!isUserAlreadyInRoom(chatRoom, user)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        return chatRoom.getRoomCode();
    }

    public List<ChatRoomDto> getAllRooms() {
        return chatRoomRepository.findAll().stream()
                .map(room -> ChatRoomDto.from(room, chatRoomMemberRepository.countByChatRoom(room)))
                .collect(Collectors.toList());
    }

    public void sendRoomInvite(Long roomId, String targetEmail) {
        ChatRoom chatRoom = findChatRoomById(roomId);
        if (!chatRoom.isPrivate() || chatRoom.getRoomCode() == null) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }
        emailService.sendStudyInvite(targetEmail, roomId, chatRoom.getTitle(), chatRoom.getRoomCode());
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private ChatRoom findChatRoomById(Long roomId) {
        return chatRoomRepository.findById(roomId).orElseThrow(() -> new CustomException(ErrorCode.CHATROOM_NOT_FOUND));
    }

    private boolean isUserAlreadyInRoom(ChatRoom chatRoom, User user) {
        return chatRoomMemberRepository.findByChatRoomAndUser(chatRoom, user).isPresent();
    }

    private void joinRoom(ChatRoom chatRoom, User user) {
        ChatRoomMember member = ChatRoomMember.builder().chatRoom(chatRoom).user(user).build();
        chatRoomMemberRepository.save(member);
    }
}