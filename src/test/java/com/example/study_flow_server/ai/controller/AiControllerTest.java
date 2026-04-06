package com.example.study_flow_server.ai.controller;

import com.example.study_flow_server.ai.dto.QuizSubmitRequest;
import com.example.study_flow_server.ai.service.AiService;
import com.example.study_flow_server.ai.service.QuizService;
import com.example.study_flow_server.ai.util.WithMockCustomUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AiService aiService;

    @MockitoBean
    private QuizService quizService;

    @Test
    @DisplayName("퀴즈 제출 API - 성공")
    @WithMockCustomUser
    void submitAnswer_Success() throws Exception {
        QuizSubmitRequest request = new QuizSubmitRequest(1L, "2");
        String requestJson = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/ai/quiz/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isOk())
                .andDo(print());
    }

    @Test
    @DisplayName("퀴즈 제출 API - 실패 (quizId가 null)")
    @WithMockCustomUser
    void submitAnswer_Fail_NullQuizId() throws Exception {
        QuizSubmitRequest request = new QuizSubmitRequest(null, "2");
        String requestJson = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/ai/quiz/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isBadRequest())
                .andDo(print());
    }
}