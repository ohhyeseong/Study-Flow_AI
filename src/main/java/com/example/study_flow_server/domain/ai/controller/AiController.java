package com.example.study_flow_server.domain.ai.controller;

import com.example.study_flow_server.domain.ai.dto.AiHistoryResponseDto;
import com.example.study_flow_server.domain.ai.dto.AiResponseDto;
import com.example.study_flow_server.domain.ai.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<AiResponseDto> analyzeImage(
            @RequestPart("file")MultipartFile file,
            @RequestPart("prompt") String prompt
            ){
        return aiService.analyzeImage(file,prompt);
    }

    @GetMapping("/history")
    public List<AiHistoryResponseDto> getHistoryList() {
        return aiService.getHistoryList();
    }
}
