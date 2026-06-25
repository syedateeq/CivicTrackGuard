package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SeverityStatsResponse {
    private String severity;
    private Long count;
}