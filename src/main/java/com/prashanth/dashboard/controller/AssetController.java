package com.prashanth.dashboard.controller;

import com.prashanth.dashboard.model.Asset;
import com.prashanth.dashboard.repository.AssetRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.prashanth.dashboard.aop.Auditable;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

  private final AssetRepository assetRepository;

  public AssetController(AssetRepository assetRepository) {
    this.assetRepository = assetRepository;
  }

  // Test API
  @GetMapping("/test")
  public String test() {
    return "Asset Controller Working!";
  }

  // Get all assets
  @GetMapping
  @PreAuthorize("hasAuthority('ASSET_VIEW')")
  public List<Asset> getAllAssets() {
    return assetRepository.findAll();
  }

  // Get asset by ID
  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('ASSET_VIEW')")
  public Optional<Asset> getAssetById(@PathVariable Long id) {
    return assetRepository.findById(id);
  }

  // Create a new asset
  @PostMapping
  @PreAuthorize("hasAuthority('ASSET_CREATE')")
  @Auditable(action = "Create Asset")
  public Asset createAsset(@RequestBody Asset asset) {
    return assetRepository.save(asset);
  }

  // Update an existing asset
  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('ASSET_EDIT')")
  @Auditable(action = "Edit Asset")
  public Asset updateAsset(@PathVariable Long id,
                           @RequestBody Asset updatedAsset) {

    return assetRepository.findById(id)
      .map(asset -> {

        asset.setAssetName(updatedAsset.getAssetName());
        asset.setAssetType(updatedAsset.getAssetType());
        asset.setStatus(updatedAsset.getStatus());

        asset.setCpuUsage(updatedAsset.getCpuUsage());
        asset.setMemoryUsage(updatedAsset.getMemoryUsage());
        asset.setDiskUsage(updatedAsset.getDiskUsage());
        asset.setNetworkUsage(updatedAsset.getNetworkUsage());

        asset.setUptime(updatedAsset.getUptime());
        asset.setLocation(updatedAsset.getLocation());

        return assetRepository.save(asset);

      })
      .orElseThrow(() -> new RuntimeException("Asset not found"));
  }

  // Delete an asset
  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('ASSET_DELETE')")
  @Auditable(action = "Delete Asset")
  public String deleteAsset(@PathVariable Long id) {
    assetRepository.deleteById(id);
    return "Asset deleted successfully!";
  }
  @GetMapping("/search")
  @PreAuthorize("hasAuthority('ASSET_VIEW')")
  public List<Asset> searchAssets(@RequestParam String keyword) {

    return assetRepository.findByAssetNameContainingIgnoreCase(keyword);

  }
  @GetMapping("/status/{status}")
  @PreAuthorize("hasAuthority('ASSET_VIEW')")
  public List<Asset> getAssetsByStatus(@PathVariable String status) {

    return assetRepository.findByStatus(status);

  }
}
