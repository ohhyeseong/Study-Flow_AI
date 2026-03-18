package com.example.study_flow_server.post.service;

import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.post.domain.Post;
import com.example.study_flow_server.post.dto.PostCreateDto;
import com.example.study_flow_server.post.dto.PostResponseDto;
import com.example.study_flow_server.post.repository.PostRepository;
import com.example.study_flow_server.user.domain.User;
import com.example.study_flow_server.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public Long createPost(PostCreateDto dto, String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Post newPost = Post.builder()
                .title(dto.title())
                .content(dto.content())
                .user(author)
                .build();

        return postRepository.save(newPost).getId();
    }

    public Long updatePost(Long postId, PostCreateDto dto, String username) {
        Post existingPost = findPostById(postId);

        validateAuthor(existingPost, username);

        existingPost.update(dto.title(), dto.content());

        return postId;
    }

    public PostResponseDto deletePost(Long postId) {
        Post postToDelete = findPostById(postId);

        PostResponseDto response = PostResponseDto.from(postToDelete);
        postRepository.delete(postToDelete);
        
        return response;
    }

    @Transactional(readOnly = true)
    public PostResponseDto getPost(Long postId) {
        Post post = findPostById(postId);
        return PostResponseDto.from(post);
    }

    @Transactional(readOnly = true)
    public List<PostResponseDto> getAllPosts() {
        return postRepository.findAll().stream()
                .map(PostResponseDto::from)
                .collect(Collectors.toList());
    }

    private Post findPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다. id=" + postId));
    }

    private void validateAuthor(Post post, String username) {
        if (!post.getUser().getUsername().equals(username)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
    }
}
