package com.example.study_flow_server.post.repository;

import com.example.study_flow_server.post.domain.Post;
import com.example.study_flow_server.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByUser(User user);

    List<Post> findByTitleContaining(String keyword);
}
