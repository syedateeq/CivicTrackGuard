package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AiIntakeResponse {
    private String title;
    private String category;
    private String severity;
    private String department;
    private String summary;
    private String priority;
    private List<String> tags;
    private String suggestedResolution;
    private String estimatedResolutionTime;
    private Integer confidenceScore;
    private String reasoning;
}
