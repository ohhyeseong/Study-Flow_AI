package com.example.study_flow_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import io.github.cdimascio.dotenv.Dotenv;

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

		Dotenv dotenv = Dotenv.configure().load();
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		SpringApplication.run(StudyFlowServerApplication.class, args);
	}

}
