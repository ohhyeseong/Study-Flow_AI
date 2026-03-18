package com.example.study_flow_server.landmark.repository;

import org.springframework.stereotype.Repository;

public interface LandmarkProjection {
    String getName();
    String getDescription();
    Double getLatitude();
    Double getLongitude();
    Double getDistance();
}