package com.prashanth.dashboard.service;

import com.prashanth.dashboard.model.Notification;
import com.prashanth.dashboard.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotifications() {
        return notificationRepository.findTop50ByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countByReadFalse();
    }

    @Transactional
    public Notification markAsRead(long id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        notification.setUpdatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Transactional
    public List<Notification> markAllAsRead() {
        List<Notification> notifications = notificationRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        notifications.forEach(notification -> {
            notification.setRead(true);
            notification.setUpdatedAt(now);
        });
        return notificationRepository.saveAll(notifications);
    }

    @Transactional
    public Notification save(Notification notification) {
        notification.setUpdatedAt(LocalDateTime.now());
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(LocalDateTime.now());
        }
        return notificationRepository.save(notification);
    }
}