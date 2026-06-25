package com.ateeq.backend.controller;

import com.ateeq.backend.dto.CommentRequest;
import com.ateeq.backend.dto.CommentResponse;
import com.ateeq.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public CommentResponse addComment(@RequestBody CommentRequest request) {
        return commentService.addComment(request);
    }

    @GetMapping("/issue/{issueId}")
    public List<CommentResponse> getCommentsByIssue(@PathVariable Long issueId) {
        return commentService.getCommentsByIssue(issueId);
    }
}