package com.prashanth.dashboard.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletResponse;

@RestController
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletResponse response) {
        response.setContentType("application/json");
        int status = response.getStatus();
        if (status == 404) {
            return "{\"error\": \"404 Not Found — The requested resource does not exist on the Spring Boot backend.\"}";
        }
        return "{\"error\": \"HTTP " + status + " — The backend request failed API dispatch.\"}";
    }
}
