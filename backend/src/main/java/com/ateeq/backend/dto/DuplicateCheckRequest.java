package com.ateeq.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DuplicateCheckRequest {

    private String description;
    private String category;
    private Double latitude;
    private Double longitude;
    private String address;
    private String imageUrl;
    private String title;
}
