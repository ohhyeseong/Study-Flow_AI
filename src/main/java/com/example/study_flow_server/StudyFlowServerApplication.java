package com.example.study_flow_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EnableJpaAuditing
@SpringBootApplication
@EnableJpaRepositories(basePackages = {
		"com.example.study_flow_server.ai.repository",
		"com.example.study_flow_server.user.repository"
})
public class StudyFlowServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudyFlowServerApplication.class, args);
	}

}
