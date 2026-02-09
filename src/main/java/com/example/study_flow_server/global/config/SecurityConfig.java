package com.example.study_flow_server.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // CSRF 보호 비활성화 (테스트 용도)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/ai/**").permitAll() // AI 관련 API는 인증 없이 접근 허용
                        .anyRequest().authenticated() // 그 외의 요청은 인증 필요
                );

        return http.build();
    }
}
