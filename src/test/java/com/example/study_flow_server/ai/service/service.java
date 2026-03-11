package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.QuizSubmitRequest;
import com.example.study_flow_server.ai.entity.Quiz;
import com.example.study_flow_server.ai.entity.QuizResult;
import com.example.study_flow_server.ai.repository.QuizRepository;
import com.example.study_flow_server.ai.repository.QuizResultRepository;
import com.example.study_flow_server.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class) // JUnit5에서 Mockito를 사용하기 위한 설정
class QuizServiceTest {

    @InjectMocks // 테스트 대상 클래스. @Mock으로 생성된 객체들이 여기에 주입된다.
    private QuizService quizService;

    @Mock // 가짜(Mock) 객체로 만들 의존성
    private QuizRepository quizRepository;

    @Mock // 가짜(Mock) 객체로 만들 의존성
    private QuizResultRepository quizResultRepository;

    @Test
    @DisplayName("퀴즈 정답 제출 - 정답인 경우")
    void submitAnswer_Correct() {
        // given - 테스트를 위한 준비 과정
        Long quizId = 1L;
        String correctAnswer = "2";
        User user = User.builder().id(1L).username("testuser").build();
        QuizSubmitRequest request = new QuizSubmitRequest(quizId, correctAnswer);

        Quiz quiz = Quiz.builder()
                .id(quizId)
                .question("1+1은?")
                .answer(correctAnswer)
                .build();

        // quizRepository.findById(quizId)가 호출되면, 위에서 만든 quiz 객체를 포함한 Optional을 반환하도록 설정
        given(quizRepository.findById(quizId)).willReturn(Optional.of(quiz));

        // when - 실제 테스트 대상 메소드 호출
        boolean isCorrect = quizService.submitAnswer(user, request);

        // then - 결과 검증
        assertThat(isCorrect).isTrue(); // 반환값이 true인지 확인

        // quizResultRepository.save()가 한 번 호출되었는지 검증
        verify(quizResultRepository).save(any(QuizResult.class));
    }

    @Test
    @DisplayName("퀴즈 정답 제출 - 오답인 경우")
    void submitAnswer_Wrong() {
        // given - 테스트를 위한 준비 과정
        Long quizId = 1L;
        String correctAnswer = "2";
        String wrongAnswer = "3";
        User user = User.builder().id(1L).username("testuser").build();
        QuizSubmitRequest request = new QuizSubmitRequest(quizId, wrongAnswer);

        Quiz quiz = Quiz.builder()
                .id(quizId)
                .question("1+1은?")
                .answer(correctAnswer)
                .build();

        // quizRepository.findById(quizId)가 호출되면, 위에서 만든 quiz 객체를 포함한 Optional을 반환하도록 설정
        given(quizRepository.findById(quizId)).willReturn(Optional.of(quiz));

        // when - 실제 테스트 대상 메소드 호출
        boolean isCorrect = quizService.submitAnswer(user, request);

        // then - 결과 검증
        assertThat(isCorrect).isFalse(); // 반환값이 false인지 확인

        // quizResultRepository.save()가 한 번 호출되었는지 검증
        verify(quizResultRepository).save(any(QuizResult.class));
    }
}
    