package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolutionPlanResponse {
    private String department;
    private String priority;
    private String estimatedTime;
    private String estimatedCost;
    private String workers;
    private List<String> equipment;
    private List<String> materials;
    private List<String> safety;
    private List<String> steps;
    private String citizenImpact;
    private Integer confidence;
    private String reasoning;
}
