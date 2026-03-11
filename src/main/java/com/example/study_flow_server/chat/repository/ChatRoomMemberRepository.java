package com.example.study_flow_server.chat.repository;

import com.example.study_flow_server.chat.domain.ChatRoom;
import com.example.study_flow_server.chat.domain.ChatRoomMember;
import com.example.study_flow_server.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {
    Optional<ChatRoomMember> findByChatRoomAndUser(ChatRoom chatRoom, User user);
    List<ChatRoomMember> findAllByChatRoom(ChatRoom chatRoom);
}