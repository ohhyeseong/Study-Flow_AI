package com.example.study_flow_server.post.repository;

import com.example.study_flow_server.post.domain.Post;
import com.example.study_flow_server.post.domain.PostLike;
import com.example.study_flow_server.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByUserAndPost(User user, Post post);
    List<PostLike> findAllByUser(User user);
    int countByPost(Post post);
    boolean existsByUserAndPost(User user, Post post);
}
