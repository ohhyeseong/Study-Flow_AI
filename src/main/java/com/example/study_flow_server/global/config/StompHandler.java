package com.example.study_flow_server.global.config;

import com.example.study_flow_server.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StompHandler implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    // WebSocket을 통해 들어온 요청이 처리되기 전에 실행된다.
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // WebSocket 연결 요청(CONNECT)일 경우에만 토큰 검증
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // 헤더에서 'Authorization' 토큰을 가져온다.
            String jwtToken = accessor.getFirstNativeHeader("Authorization");
            log.info("STOMP CONNECT - Authorization 헤더: {}", jwtToken);

            if (jwtToken != null && jwtUtil.validateToken(jwtToken)) {
                // 토큰이 유효하면, 토큰으로부터 Authentication 객체를 생성한다.
                Authentication authentication = jwtUtil.getAuthentication(jwtToken);
                // SecurityContext에 인증 정보를 설정한다.
                accessor.setUser(authentication);
                log.info("STOMP 사용자 인증 성공: {}", authentication.getName());
            } else {
                log.warn("STOMP 연결 시 유효한 토큰이 없습니다.");
                // 유효한 토큰이 없는 경우, 연결을 거부하거나 인증되지 않은 사용자로 처리할 수 있다.
                // 여기서는 별도 처리 없이 넘어가지만, 필요 시 예외를 던져 연결을 끊을 수 있다.
            }
        }
        return message;
    }
}
