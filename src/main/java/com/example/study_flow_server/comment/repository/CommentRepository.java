package com.example.study_flow_server.comment.repository;

import com.example.study_flow_server.comment.domain.Comment;
import com.example.study_flow_server.post.domain.Post;
import com.example.study_flow_server.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 1. 특정 유저가 작성한 모든 댓글 조회
    List<Comment> findAllByUser(User user);

    // 2. 특정 게시글에 달린 모든 댓글 조회 (가장 많이 사용됨)
    List<Comment> findAllByPost(Post post);

    // JPQL 쿼리를 사용하여 N+1 문제를 해결.
    // c.parent IS NULL 조건으로 최상위 댓글만 조회함.
    // LEFT JOIN FETCH를 사용하여 자식 댓글과 각 댓글의 작성자 정보를 한 번에 가져온다.
    @Query("SELECT c FROM Comment c " +
            "LEFT JOIN FETCH c.children ch " +
            "LEFT JOIN FETCH c.user u " +
            "WHERE c.post.id = :postId AND c.parent IS NULL " +
            "ORDER BY c.createdAt ASC")
    List<Comment> findAllByPostIdWithUserAndPost(@Param("postId") Long postId);

    // 3. 내용(content)에 특정 단어가 포함된 댓글 검색
    // Comment 엔티티에는 title이 없으므로 content로 검색해야 합니다.
    List<Comment> findByContentContaining(String keyword);
}