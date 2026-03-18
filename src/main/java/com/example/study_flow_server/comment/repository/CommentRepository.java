package com.example.study_flow_server.comment.repository;

import com.example.study_flow_server.comment.domain.Comment;
import com.example.study_flow_server.post.domain.Post;
import com.example.study_flow_server.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findAllByUser(User user);

    List<Comment> findAllByPost(Post post);

    @Query("SELECT c FROM Comment c " +
            "LEFT JOIN FETCH c.children ch " +
            "LEFT JOIN FETCH c.user u " +
            "WHERE c.post.id = :postId AND c.parent IS NULL " +
            "ORDER BY c.createdAt ASC")
    List<Comment> findAllByPostIdWithUserAndPost(@Param("postId") Long postId);

    List<Comment> findByContentContaining(String keyword);
}