"use client"

import { useState } from "react"
import { authenticateUser, createUser } from "../lib/users-data"

const AuthForms = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const switchForm = () => {
    setIsLogin(!isLogin)
    setError("")
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const user = await authenticateUser(email, password)
      if (user) {
        // Store user in localStorage or context
        localStorage.setItem("currentUser", JSON.stringify(user))
        onSuccess?.(user)
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await createUser({
        firstName,
        lastName,
        email,
        password,
        phone,
        role: "customer", // Default role
        location: {
          city: "Unknown",
          state: "Unknown",
          country: "USA",
          coordinates: { lat: 0, lng: 0 },
        },
      })

      if (result.success) {
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        onSuccess?.(result.user)
      } else {
        setError(Object.values(result.errors).join(", "))
      }
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2>{isLogin ? "Login" : "Register"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isLogin ? (
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Register"}
          </button>
        </form>
      )}
      <button onClick={switchForm}>{isLogin ? "Need an account? Register" : "Already have an account? Login"}</button>
    </div>
  )
}

export default AuthForms
