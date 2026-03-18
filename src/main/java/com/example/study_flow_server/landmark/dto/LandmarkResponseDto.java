package com.example.study_flow_server.landmark.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class LandmarkResponseDto {
    private Long id;
    private String name;
    private String description;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double distance;
}