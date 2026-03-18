package com.example.study_flow_server.global.config;

import com.example.study_flow_server.global.security.CustomUserDetailsService;
import com.example.study_flow_server.jwt.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StompHandler implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService; // 💡 CustomUserDetailsService 사용!

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String jwtToken = accessor.getFirstNativeHeader("Authorization");
            
            // "Bearer " 문자열이 포함되어 온다면 제거하는 로직 추가
            if (jwtToken != null && jwtToken.startsWith("Bearer ")) {
                jwtToken = jwtToken.substring(7);
            }

            log.info("STOMP CONNECT - Authorization 헤더: {}", jwtToken);

            if (jwtToken != null && jwtUtil.validateToken(jwtToken)) {
                Claims claims = jwtUtil.getUserInfoFromToken(jwtToken);
                String username = claims.getSubject();
                
                // 💡 여기서도 CustomUserDetails를 로드해서 넘겨줍니다!
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                
                accessor.setUser(authentication);
                log.info("STOMP 사용자 인증 성공: {}", username);
            } else {
                log.warn("STOMP 연결 시 유효한 토큰이 없습니다.");
            }
        }
        return message;
    }
}
