package com.prashanth.dashboard.model;

import jakarta.persistence.*;

@Entity
@Table(name = "asset")
public class Asset {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String assetName;
  private String assetType;
  private String status;

  private int cpuUsage;
  private int memoryUsage;
  private int diskUsage;
  private int networkUsage;

  private double uptime;

  private String location;

  public Asset() {
  }

  public Asset(Long id, String assetName, String assetType, String status,
               int cpuUsage, int memoryUsage, int diskUsage,
               int networkUsage, double uptime, String location) {
    this.id = id;
    this.assetName = assetName;
    this.assetType = assetType;
    this.status = status;
    this.cpuUsage = cpuUsage;
    this.memoryUsage = memoryUsage;
    this.diskUsage = diskUsage;
    this.networkUsage = networkUsage;
    this.uptime = uptime;
    this.location = location;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getAssetName() {
    return assetName;
  }

  public void setAssetName(String assetName) {
    this.assetName = assetName;
  }

  public String getAssetType() {
    return assetType;
  }

  public void setAssetType(String assetType) {
    this.assetType = assetType;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public int getCpuUsage() {
    return cpuUsage;
  }

  public void setCpuUsage(int cpuUsage) {
    this.cpuUsage = cpuUsage;
  }

  public int getMemoryUsage() {
    return memoryUsage;
  }

  public void setMemoryUsage(int memoryUsage) {
    this.memoryUsage = memoryUsage;
  }

  public int getDiskUsage() {
    return diskUsage;
  }

  public void setDiskUsage(int diskUsage) {
    this.diskUsage = diskUsage;
  }

  public int getNetworkUsage() {
    return networkUsage;
  }

  public void setNetworkUsage(int networkUsage) {
    this.networkUsage = networkUsage;
  }

  public double getUptime() {
    return uptime;
  }

  public void setUptime(double uptime) {
    this.uptime = uptime;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }
}
