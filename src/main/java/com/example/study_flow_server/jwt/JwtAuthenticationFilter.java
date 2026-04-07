package com.example.study_flow_server.jwt;

import com.example.study_flow_server.global.security.CustomUserDetailsService;
import com.example.study_flow_server.redis.RedisService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;
import io.jsonwebtoken.Claims;

import java.io.IOException;
import java.util.Arrays;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final RedisService redisService;
    private final CustomUserDetailsService userDetailsService;

    private static final String[] EXCLUDED_PATHS = {
            "/api/auth/",
            "/api/users/signup",
            "/api/v1/landmarks",
            "/ws",
            "/ws-chat"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = jwtUtil.resolveToken(request);

        if (token != null) {
            String isLogout = redisService.getValues("blacklist:" + token);

            if (isLogout == null && jwtUtil.validateToken(token)) {
                Claims claims = jwtUtil.getUserInfoFromToken(token);
                String username = claims.getSubject();

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 사용자 정보 재조회
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if (!userDetails.isAccountNonLocked()) {
                        log.warn("정지된 사용자 접속 시도: {}", username);
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"success\":false,\"code\":\"FORBIDDEN\",\"message\":\"BANNED_USER\"}");
                        return;
                    }

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("인증 성공: 사용자 {}, 권한 {}", username, userDetails.getAuthorities());
                }
            } else if (isLogout != null) {
                log.info("로그아웃된 토큰입니다.");
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return Arrays.stream(EXCLUDED_PATHS).anyMatch(path::startsWith);
    }
}
