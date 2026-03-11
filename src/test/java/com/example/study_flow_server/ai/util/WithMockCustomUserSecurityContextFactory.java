package com.example.study_flow_server.ai.util;

import com.example.study_flow_server.global.security.CustomUserDetails;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.domain.UserRole;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

public class WithMockCustomUserSecurityContextFactory implements WithSecurityContextFactory<WithMockCustomUser> {
    @Override
    public SecurityContext createSecurityContext(WithMockCustomUser customUser) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();

        User user = User.builder()
                .id(customUser.id())
                .username(customUser.username())
                .role(UserRole.valueOf(customUser.role()))
                .build();

        CustomUserDetails principal = new CustomUserDetails(user);
        var auth = new UsernamePasswordAuthenticationToken(principal, "password", principal.getAuthorities());
        context.setAuthentication(auth);
        return context;
    }
}
