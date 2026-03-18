package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.QuizSubmitRequest;
import com.example.study_flow_server.ai.entity.Quiz;
import com.example.study_flow_server.ai.entity.QuizResult;
import com.example.study_flow_server.ai.entity.SolveStatus;
import com.example.study_flow_server.ai.repository.QuizRepository;
import com.example.study_flow_server.ai.repository.QuizResultRepository;
import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizResultRepository quizResultRepository;

    @Transactional
    public boolean submitAnswer(User user, QuizSubmitRequest request) {
        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new CustomException(ErrorCode.QUIZ_NOT_FOUND));

        boolean isCorrect = quiz.getAnswer().equals(request.userAnswer());

        QuizResult result = QuizResult.builder()
                .user(user)
                .quiz(quiz)
                .userAnswer(request.userAnswer())
                .status(isCorrect ? SolveStatus.CORRECT : SolveStatus.WRONG)
                .build();

        quizResultRepository.save(result);

        return isCorrect;
    }
}
