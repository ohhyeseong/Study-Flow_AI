package com.example.study_flow_server.landmark.service;

import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.landmark.domain.Landmark;
import com.example.study_flow_server.landmark.dto.LandmarkResponseDto;
import com.example.study_flow_server.landmark.repository.LandmarkRepository;
import com.example.study_flow_server.landmark.repository.LandmarkProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LandmarkService {

    private final LandmarkRepository landmarkRepository;

    public List<LandmarkResponseDto> getNearbyLandmarks(Double lat, Double lon) {
        List<LandmarkProjection> projections = landmarkRepository.findNearbyLandmarks(lat, lon);

        return projections.stream()
                .map(this::mapProjectionToDto)
                .collect(Collectors.toList());
    }

    public List<LandmarkResponseDto> getAllLandmarks() {
        List<Landmark> landmarks = landmarkRepository.findAll();

        return landmarks.stream()
                .map(this::mapEntityToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void registerLandmark(LandmarkResponseDto dto) {
        Landmark landmark = Landmark.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .address(dto.getAddress())
                .build();

        landmarkRepository.save(landmark);
    }

    public LandmarkResponseDto getLandmarkDetail(Long landmarkId) {
        Landmark landmark = landmarkRepository.findById(landmarkId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));

        return mapEntityToDto(landmark);
    }

    private LandmarkResponseDto mapProjectionToDto(LandmarkProjection projection) {
        return new LandmarkResponseDto(
                null,
                projection.getName(),
                projection.getDescription(),
                projection.getLatitude(),
                projection.getLongitude(),
                null,
                projection.getDistance()
        );
    }

    private LandmarkResponseDto mapEntityToDto(Landmark landmark) {
        return new LandmarkResponseDto(
                landmark.getId(),
                landmark.getName(),
                landmark.getDescription(),
                landmark.getLatitude(),
                landmark.getLongitude(),
                landmark.getAddress(),
                0.0
        );
    }
}
