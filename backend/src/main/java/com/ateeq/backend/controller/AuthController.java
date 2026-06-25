package com.ateeq.backend.controller;

import com.ateeq.backend.dto.AuthResponse;
import com.ateeq.backend.dto.LoginRequest;
import com.ateeq.backend.dto.RegisterRequest;
import com.ateeq.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /**
     * Returns the currently logged-in user's profile.
     * Frontend calls this after login to get role, userId, name, points.
     */
    @GetMapping("/me")
    public AuthResponse getMe(@AuthenticationPrincipal UserDetails userDetails) {
        return authService.getMe(userDetails.getUsername());
    }
}