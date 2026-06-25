package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CategoryStatsResponse {
    private String category;
    private Long count;
}