"use client"

import { useState } from "react"
import LoginPage from "./login-page"
import RegisterPage from "./register-page"
import ForgotPasswordPage from "./forgot-password-page"
import HomePage from "./home-page"

export default function AuthNavigator() {
  const [currentPage, setCurrentPage] = useState("home")

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  switch (currentPage) {
    case "login":
      return <LoginPage onNavigate={handleNavigate} />
    case "register":
      return <RegisterPage onNavigate={handleNavigate} />
    case "forgot-password":
      return <ForgotPasswordPage onNavigate={handleNavigate} />
    case "home":
      return <HomePage onNavigate={handleNavigate} />
    default:
      return <LoginPage onNavigate={handleNavigate} />
  }
}
