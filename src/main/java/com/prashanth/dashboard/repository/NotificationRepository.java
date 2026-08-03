package com.prashanth.dashboard.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.prashanth.dashboard.model.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByOrderByCreatedAtDesc();
    long countByReadFalse();
}