package com.prashanth.dashboard;

import com.prashanth.dashboard.controller.ComplianceController;
import com.prashanth.dashboard.controller.InfrastructureController;
import com.prashanth.dashboard.controller.VulnerabilityController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DashboardApplicationTests {

    @Autowired
    private InfrastructureController infrastructureController;

    @Autowired
    private ComplianceController complianceController;

    @Autowired
    private VulnerabilityController vulnerabilityController;

    @Test
    void contextLoads() {
        assertNotNull(infrastructureController);
        assertNotNull(complianceController);
        assertNotNull(vulnerabilityController);
    }

    @Test
    void testInfrastructureTelemetry() {
        Map<String, Object> telemetry = infrastructureController.getTelemetry();
        assertNotNull(telemetry);
        assertTrue(telemetry.containsKey("cpuCount"));
        assertTrue(telemetry.containsKey("memoryPoolInfo"));
        assertEquals("OK", telemetry.get("vaultHsmStatus"));
    }

    @Test
    void testComplianceStandards() {
        List<Map<String, Object>> standards = complianceController.getStandards();
        assertNotNull(standards);
        assertFalse(standards.isEmpty());
        assertEquals("ISO/IEC 27001:2022", standards.get(0).get("name"));
    }
}
