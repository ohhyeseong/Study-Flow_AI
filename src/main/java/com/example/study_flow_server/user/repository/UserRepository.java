package com.example.study_flow_server.user.repository;




import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.study_flow_server.user.domain.User;

import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username) ;
    boolean existsByUsername(String username);
    Optional<User> findByNickname (String nickname) ;

}