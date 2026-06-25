package com.ateeq.backend.dto;

import lombok.Data;

@Data
public class CommentRequest {

    private String text;
    private Long userId;
    private Long issueId;
}