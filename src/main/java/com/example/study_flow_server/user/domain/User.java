package com.example.study_flow_server.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Table(name ="users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id ;

    @Column(nullable = false , length = 20 , unique = true)
    private String username;

    @Column(nullable = false , length = 20 , unique = true)
    private String nickname;

    @Column(nullable = false , length = 30 , unique = true)
    private String email;

    @Column(nullable = false , unique = true)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Builder
    public User(Long id,String username , String nickname , String email , String password , UserRole role){
        this.id = id;
        this.username = username;
        this.nickname = nickname;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public void updateNickname(String newNickname){
        this.nickname = newNickname;
    }

}
