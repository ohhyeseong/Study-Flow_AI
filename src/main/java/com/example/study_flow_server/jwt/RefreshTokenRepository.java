package com.example.study_flow_server.jwt;

import org.springframework.data.repository.CrudRepository;
import java.util.Optional;

public interface RefreshTokenRepository extends CrudRepository<RefreshToken, String> {

    Optional<RefreshToken> findByRefreshToken(String refreshToken);
}