package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AiAnalysisResponse {
    private String category;
    private String severity;
    private String department;
    private String summary;
    private String explanation;
    private Integer trustScore;
    private String recommendedAction;
}
