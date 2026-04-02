package com.example.study_flow_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EnableJpaAuditing
@EnableCaching
@SpringBootApplication
@EnableJpaRepositories(basePackages = {
		"com.example.study_flow_server.ai.repository",
		"com.example.study_flow_server.user.repository",
		"com.example.study_flow_server.chat.repository",
		"com.example.study_flow_server.comment.repository",
		"com.example.study_flow_server.post.repository",
		"com.example.study_flow_server.landmark.repository"
})
public class StudyFlowServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudyFlowServerApplication.class, args);
	}

}
