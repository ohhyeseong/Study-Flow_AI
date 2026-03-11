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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest // 스프링 부트 통합 테스트 설정
@AutoConfigureMockMvc // MockMvc 자동 설정
class AiControllerTest {

    @Autowired
    private MockMvc mockMvc; // HTTP 요청을 시뮬레이션하는 객체

    @Autowired
    private ObjectMapper objectMapper; // 객체를 JSON 문자열로 변환하기 위한 객체

    @MockBean // 컨트롤러가 의존하는 서비스들을 가짜(Mock) 객체로 대체
    private AiService aiService;

    @MockBean
    private QuizService quizService;

    @Test
    @DisplayName("퀴즈 제출 API - 성공")
    @WithMockCustomUser// 스프링 시큐리티 인증을 통과한 가짜 사용자로 테스트 실행
    void submitAnswer_Success() throws Exception {
        // given - 테스트를 위한 준비 과정
        QuizSubmitRequest request = new QuizSubmitRequest(1L, "2");
        String requestJson = objectMapper.writeValueAsString(request);

        // when & then - 실제 요청 및 결과 검증
        mockMvc.perform(post("/api/ai/quiz/submit") // POST /api/ai/quiz/submit 요청
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk()) // 응답 상태가 200 OK인지 확인
                .andDo(print()); // 요청/응답 전체 내용 출력
    }

    @Test
    @DisplayName("퀴즈 제출 API - 실패 (quizId가 null)")
    @WithMockCustomUser
    void submitAnswer_Fail_NullQuizId() throws Exception {
        // given - 유효하지 않은 요청 데이터 준비
        QuizSubmitRequest request = new QuizSubmitRequest(null, "2"); // quizId가 null
        String requestJson = objectMapper.writeValueAsString(request);

        // when & then - 실제 요청 및 결과 검증
        mockMvc.perform(post("/api/ai/quiz/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest()) // 응답 상태가 400 Bad Request인지 확인
                .andDo(print());
    }
}