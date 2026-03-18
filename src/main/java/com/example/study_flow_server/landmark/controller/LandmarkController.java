package com.example.study_flow_server.landmark.controller;

import com.example.study_flow_server.global.response.ApiResponse;
import com.example.study_flow_server.landmark.dto.LandmarkResponseDto;
import com.example.study_flow_server.landmark.service.LandmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/landmarks")
@RequiredArgsConstructor
public class LandmarkController {
    private final LandmarkService landmarkService;

    @GetMapping("/nearby")
    public ApiResponse<List<LandmarkResponseDto>> getNearby(
            @RequestParam Double lat,
            @RequestParam Double lon) {
        List<LandmarkResponseDto> nearbyLandmarks = landmarkService.getNearbyLandmarks(lat, lon);
        return ApiResponse.ok(nearbyLandmarks);
    }
    
    @GetMapping
    public ApiResponse<List<LandmarkResponseDto>> getAllLandmarks() {
        List<LandmarkResponseDto> allLandmarks = landmarkService.getAllLandmarks();
        return ApiResponse.ok(allLandmarks);
    }

    @PostMapping("/register")
    public ApiResponse<String> registerLandmark(@RequestBody LandmarkResponseDto landmarkDto) {
        landmarkService.registerLandmark(landmarkDto);
        return ApiResponse.ok("랜드마크 등록 성공!");
    }
    
    @GetMapping("/{landmarkId}")
    public ApiResponse<LandmarkResponseDto> getDetail(@PathVariable Long landmarkId) {
        LandmarkResponseDto landmarkDetail = landmarkService.getLandmarkDetail(landmarkId);
        return ApiResponse.ok(landmarkDetail);
    }
}