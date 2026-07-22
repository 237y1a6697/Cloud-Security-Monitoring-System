package com.prashanth.dashboard.repository;

import java.util.List;

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
}
