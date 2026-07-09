package com.prashanth.dashboard.repository;

import com.prashanth.dashboard.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

  // Search by asset name
  List<Asset> findByAssetNameContainingIgnoreCase(String assetName);

  // Filter by status
  List<Asset> findByStatus(String status);

  // Count by status
  long countByStatus(String status);
}
