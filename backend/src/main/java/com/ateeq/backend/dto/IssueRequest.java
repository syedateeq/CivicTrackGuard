package com.ateeq.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IssueRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    private String department;
    private String address;
    private Double latitude;
    private Double longitude;
    private String imageUrl;

    // AI-generated fields (optional, passed from frontend preview)
    private String aiSummary;
    private String aiExplanation;
    private Integer trustScore;
}