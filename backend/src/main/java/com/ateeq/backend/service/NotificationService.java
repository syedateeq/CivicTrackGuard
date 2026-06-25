package com.ateeq.backend.service;

import com.ateeq.backend.model.Notification;
import com.ateeq.backend.model.User;
import com.ateeq.backend.repository.NotificationRepository;
import com.ateeq.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.ateeq.backend.exception.ResourceNotFoundException;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public Notification createNotification(Long userId, String message) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        System.out.println("Notification for user = " + userId);

        Notification notification = Notification.builder()
                .message(message)
                .seen(false)
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();

        Notification saved = notificationRepository.save(notification);

        System.out.println("Notification saved with id = " + saved.getId());

        return saved;
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findByUserId(userId);
    }

    public Notification markAsSeen(Long id) {

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        notification.setSeen(true);

        return notificationRepository.save(notification);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndSeenFalse(userId);
    }
}