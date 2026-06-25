package com.ateeq.backend.dto;

import lombok.Data;

@Data
public class UpdateStatusRequest {
    private String status;
    private String department;
}