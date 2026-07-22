package com.prashanth.dashboard.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.prashanth.dashboard.model.Asset;

public interface AssetRepository extends JpaRepository<Asset, Long> {

  // Search by asset name
  List<Asset> findByAssetNameContainingIgnoreCase(String assetName);

  // Filter by status
  List<Asset> findByStatus(String status);

  // Count by status
  long countByStatus(String status);

  // Total count
  long count();

  // Find by IP address
  Optional<Asset> findByIpAddress(String ipAddress);

  // Check if IP address exists (excluding a specific asset ID for updates)
  boolean existsByIpAddressAndIdNot(String ipAddress, Long id);

  // Check if IP address exists
  boolean existsByIpAddress(String ipAddress);
}
