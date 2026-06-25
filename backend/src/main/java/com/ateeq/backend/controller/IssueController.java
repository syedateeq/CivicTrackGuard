package com.ateeq.backend.controller;

import com.ateeq.backend.dto.IssueRequest;
import com.ateeq.backend.dto.IssueResponse;
import com.ateeq.backend.dto.UpdateStatusRequest;
import com.ateeq.backend.service.CloudinaryService;
import com.ateeq.backend.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;
    private final CloudinaryService cloudinaryService;

    @PostMapping
    public IssueResponse createIssue(@Valid @RequestBody IssueRequest request) {
        return issueService.createIssue(request);
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String imageUrl = cloudinaryService.uploadImage(file);
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }

    @GetMapping
    public List<IssueResponse> getAllIssues() {
        return issueService.getAllIssues();
    }

    @GetMapping("/me")
    public List<IssueResponse> getMyIssues() {
        return issueService.getIssuesByCurrentUser();
    }

    @GetMapping("/{id}")
    public IssueResponse getIssueById(@PathVariable Long id) {
        return issueService.getIssueById(id);
    }

    @PutMapping("/{id}/status")
    public IssueResponse updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        return issueService.updateStatus(id, request.getStatus(), request.getDepartment());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteIssue(@PathVariable Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.ok(Map.of("message", "Issue deleted successfully"));
    }

    @GetMapping("/status/{status}")
    public List<IssueResponse> getIssuesByStatus(@PathVariable String status) {
        return issueService.getIssuesByStatus(status);
    }

    @GetMapping("/category/{category}")
    public List<IssueResponse> getIssuesByCategory(@PathVariable String category) {
        return issueService.getIssuesByCategory(category);
    }

    @GetMapping("/page")
    public Page<IssueResponse> getIssuesPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        return issueService.getIssuesPaginated(page, size);
    }

    @GetMapping("/search")
    public Page<IssueResponse> searchIssues(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        return issueService.searchIssues(keyword, page, size);
    }
}