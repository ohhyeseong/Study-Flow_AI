package com.example.study_flow_server.global;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sentry-test")
public class SentryTestController {

    @GetMapping
    public String throwError() {
        throw new RuntimeException("Sentry Backend Test Error! (Spring Boot)");
    }
}
