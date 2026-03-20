Feature: NRL Email OTP Signup/Login

  As a user
  I want to signup or login using email OTP
  So that I can access my NRL account

  Scenario: Signup using email OTP
    Given I open NRL login page
    When I signup with email
    Then I fetch OTP and complete signup