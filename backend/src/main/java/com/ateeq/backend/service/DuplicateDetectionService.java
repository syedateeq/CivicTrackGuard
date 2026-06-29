package com.ateeq.backend.service;

import com.ateeq.backend.dto.DuplicateCheckRequest;
import com.ateeq.backend.dto.DuplicateCheckResponse;
import com.ateeq.backend.dto.DuplicateCheckResponse.DuplicateCandidate;
import com.ateeq.backend.model.Issue;
import com.ateeq.backend.repository.IssueRepository;
import com.ateeq.backend.service.GeminiService.CandidateSummary;
import com.ateeq.backend.service.GeminiService.SimilarityResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DuplicateDetectionService {

    private final IssueRepository issueRepository;
    private final GeminiService geminiService;

    // Configuration constants
    private static final int MAX_CANDIDATES = 20;
    private static final int MAX_RESULTS = 5;
    private static final int LOOKBACK_DAYS = 90;
    private static final double GEO_RADIUS_KM = 2.0;
    private static final int MIN_CONFIDENCE = 40;

    /**
     * Check for potential duplicate issues before creating a new one.
     * Uses category + geo-proximity pre-filtering, then Gemini AI for semantic scoring.
     * Falls back to keyword-based similarity if AI is unavailable.
     * Never throws — returns empty result on any failure.
     */
    public DuplicateCheckResponse checkDuplicates(DuplicateCheckRequest request) {
        try {
            // 1. Fetch candidate issues from DB
            List<Issue> candidates = fetchCandidates(request);
            if (candidates.isEmpty()) {
                return DuplicateCheckResponse.builder()
                        .duplicatesFound(false)
                        .candidates(List.of())
                        .build();
            }

            // 2. Geo-filter if location is available
            Map<Long, Double> distanceMap = new HashMap<>();
            if (request.getLatitude() != null && request.getLongitude() != null) {
                candidates = geoFilter(candidates, request.getLatitude(), request.getLongitude(), distanceMap);
                if (candidates.isEmpty()) {
                    return DuplicateCheckResponse.builder()
                            .duplicatesFound(false)
                            .candidates(List.of())
                            .build();
                }
            }

            // 3. Build summaries for AI
            List<CandidateSummary> summaries = candidates.stream()
                    .map(issue -> new CandidateSummary(
                            issue.getId(),
                            issue.getTitle(),
                            issue.getDescription(),
                            issue.getAddress(),
                            issue.getCategory()
                    ))
                    .toList();

            // 4. Get AI similarity scores
            List<SimilarityResult> aiResults = geminiService.checkDuplicates(
                    request.getDescription(),
                    request.getCategory(),
                    request.getAddress(),
                    summaries
            );

            // 5. If AI returned nothing, try keyword fallback
            if (aiResults.isEmpty()) {
                aiResults = keywordFallback(request.getDescription(), summaries);
            }

            // 6. Build response
            List<DuplicateCandidate> duplicateCandidates = buildResponse(aiResults, candidates, distanceMap);

            return DuplicateCheckResponse.builder()
                    .duplicatesFound(!duplicateCandidates.isEmpty())
                    .candidates(duplicateCandidates)
                    .build();

        } catch (Exception e) {
            log.error("Duplicate detection failed (non-blocking): {}", e.getMessage());
            return DuplicateCheckResponse.builder()
                    .duplicatesFound(false)
                    .candidates(List.of())
                    .build();
        }
    }

    /**
     * Fetch candidate issues: first by same category, then broaden if too few results.
     */
    private List<Issue> fetchCandidates(DuplicateCheckRequest request) {
        LocalDateTime since = LocalDateTime.now().minusDays(LOOKBACK_DAYS);
        PageRequest pageRequest = PageRequest.of(0, MAX_CANDIDATES);

        List<Issue> candidates = new ArrayList<>();

        // Primary: same category
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            candidates = issueRepository.findCandidatesForDuplicateCheck(
                    request.getCategory(), since, pageRequest);
        }

        // Fallback: if too few candidates, broaden to all active issues
        if (candidates.size() < 3) {
            List<Issue> broader = issueRepository.findRecentActiveIssues(since, pageRequest);
            // Merge, avoiding duplicates
            Set<Long> existingIds = candidates.stream().map(Issue::getId).collect(Collectors.toSet());
            for (Issue issue : broader) {
                if (!existingIds.contains(issue.getId())) {
                    candidates.add(issue);
                }
                if (candidates.size() >= MAX_CANDIDATES) break;
            }
        }

        return candidates;
    }

    /**
     * Filter candidates by geographic proximity using the Haversine formula.
     * Populates distanceMap with the distance (in meters) for each candidate.
     */
    private List<Issue> geoFilter(List<Issue> candidates, double newLat, double newLng,
                                   Map<Long, Double> distanceMap) {
        List<Issue> filtered = new ArrayList<>();
        for (Issue issue : candidates) {
            if (issue.getLatitude() != null && issue.getLongitude() != null) {
                double distance = haversineMeters(newLat, newLng, issue.getLatitude(), issue.getLongitude());
                distanceMap.put(issue.getId(), distance);
                if (distance <= GEO_RADIUS_KM * 1000) {
                    filtered.add(issue);
                }
            } else {
                // No location on existing issue — still include it (AI will judge)
                filtered.add(issue);
            }
        }
        return filtered;
    }

    /**
     * Haversine formula: distance between two lat/lng points in meters.
     */
    private double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6_371_000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Keyword-based fallback similarity when Gemini is unavailable.
     * Uses Jaccard similarity on tokenized words.
     */
    private List<SimilarityResult> keywordFallback(String newDescription, List<CandidateSummary> candidates) {
        Set<String> newTokens = tokenize(newDescription);
        if (newTokens.isEmpty()) return List.of();

        List<SimilarityResult> results = new ArrayList<>();
        for (CandidateSummary candidate : candidates) {
            Set<String> candidateTokens = tokenize(
                    (candidate.title != null ? candidate.title : "") + " " +
                    (candidate.description != null ? candidate.description : "")
            );
            if (candidateTokens.isEmpty()) continue;

            // Jaccard similarity
            Set<String> intersection = new HashSet<>(newTokens);
            intersection.retainAll(candidateTokens);
            Set<String> union = new HashSet<>(newTokens);
            union.addAll(candidateTokens);

            double jaccard = (double) intersection.size() / union.size();
            int score = (int) Math.round(jaccard * 100);

            if (score >= MIN_CONFIDENCE) {
                SimilarityResult result = new SimilarityResult();
                result.issueId = candidate.id;
                result.similarityScore = score;
                result.matchReason = "Matched by keyword similarity (AI unavailable). Common terms: " +
                        intersection.stream().limit(5).collect(Collectors.joining(", "));
                results.add(result);
            }
        }

        results.sort((a, b) -> Integer.compare(b.similarityScore, a.similarityScore));
        return results.stream().limit(MAX_RESULTS).toList();
    }

    /**
     * Tokenize text into lowercase words, filtering out stop words and very short tokens.
     */
    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) return Set.of();
        Set<String> stopWords = Set.of("the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
                "to", "for", "of", "and", "or", "it", "this", "that", "has", "have", "been",
                "near", "from", "with", "there", "not", "very", "been", "also", "just");
        return Arrays.stream(text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+"))
                .filter(w -> w.length() > 2 && !stopWords.contains(w))
                .collect(Collectors.toSet());
    }

    /**
     * Build the final response by merging AI scores with issue details and distances.
     */
    private List<DuplicateCandidate> buildResponse(List<SimilarityResult> aiResults,
                                                    List<Issue> candidates,
                                                    Map<Long, Double> distanceMap) {
        Map<Long, Issue> issueMap = candidates.stream()
                .collect(Collectors.toMap(Issue::getId, i -> i, (a, b) -> a));

        List<DuplicateCandidate> result = new ArrayList<>();
        for (SimilarityResult sr : aiResults) {
            if (sr.similarityScore < MIN_CONFIDENCE) continue;

            Issue issue = issueMap.get(sr.issueId);
            if (issue == null) continue;

            result.add(DuplicateCandidate.builder()
                    .issueId(issue.getId())
                    .title(issue.getTitle())
                    .description(issue.getDescription() != null && issue.getDescription().length() > 200
                            ? issue.getDescription().substring(0, 200) + "..."
                            : issue.getDescription())
                    .category(issue.getCategory())
                    .status(issue.getStatus() != null ? issue.getStatus().name() : "PENDING")
                    .severity(issue.getSeverity() != null ? issue.getSeverity().name() : "LOW")
                    .address(issue.getAddress())
                    .imageUrl(issue.getImageUrl())
                    .createdAt(issue.getCreatedAt())
                    .upvoteCount(issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0L)
                    .distance(distanceMap.getOrDefault(issue.getId(), null))
                    .confidenceScore(sr.similarityScore)
                    .matchReason(sr.matchReason)
                    .build());

            if (result.size() >= MAX_RESULTS) break;
        }

        return result;
    }
}
