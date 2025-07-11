export const users = [
  {
    id: "user1",
    email: "john.doe@email.com",
    password: "hashed_password_123",
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe",
    phone: "+1 (555) 123-4567",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "service_provider",
    isVerified: true,
    joinDate: "2023-01-15",
    location: {
      city: "New York",
      state: "NY",
      country: "USA",
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
    profile: {
      bio: "Professional plumber with 10+ years of experience.",
      skills: ["Plumbing", "Pipe Repair", "Drain Cleaning"],
      rating: 4.8,
      reviewCount: 127,
      completedJobs: 245,
      responseTime: "< 1 hour",
      languages: ["English", "Spanish"],
    },
    services: ["svc1", "svc3"],
    preferences: {
      notifications: { email: true, sms: true, push: true },
      privacy: { showPhone: true, showEmail: false, showLocation: true },
    },
  },
  {
    id: "user2",
    email: "sarah.smith@email.com",
    password: "hashed_password_456",
    firstName: "Sarah",
    lastName: "Smith",
    fullName: "Sarah Smith",
    phone: "+1 (555) 234-5678",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "service_provider",
    isVerified: true,
    joinDate: "2023-02-20",
    location: {
      city: "Los Angeles",
      state: "CA",
      country: "USA",
      coordinates: { lat: 34.0522, lng: -118.2437 },
    },
    profile: {
      bio: "Certified electrician specializing in residential and commercial installations.",
      skills: ["Electrical", "Wiring", "Lighting", "Repairs"],
      rating: 4.9,
      reviewCount: 89,
      completedJobs: 156,
      responseTime: "< 30 minutes",
      languages: ["English"],
    },
    services: ["svc2", "svc5"],
    preferences: {
      notifications: { email: true, sms: false, push: true },
      privacy: { showPhone: false, showEmail: true, showLocation: true },
    },
  },
  {
    id: "user3",
    email: "mike.johnson@email.com",
    password: "hashed_password_789",
    firstName: "Mike",
    lastName: "Johnson",
    fullName: "Mike Johnson",
    phone: "+1 (555) 345-6789",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "customer",
    isVerified: true,
    joinDate: "2023-06-10",
    location: {
      city: "Chicago",
      state: "IL",
      country: "USA",
      coordinates: { lat: 41.8781, lng: -87.6298 },
    },
    profile: {
      bio: "Homeowner looking for reliable service providers.",
      skills: [],
      rating: 4.7,
      reviewCount: 23,
      requestsPosted: 15,
      responseTime: "< 2 hours",
      languages: ["English"],
    },
    services: [],
    preferences: {
      notifications: { email: true, sms: true, push: false },
      privacy: { showPhone: false, showEmail: false, showLocation: true },
    },
  },
  {
    id: "user4",
    email: "emily.wilson@email.com",
    password: "hashed_password_101",
    firstName: "Emily",
    lastName: "Wilson",
    fullName: "Emily Wilson",
    phone: "+1 (555) 456-7890",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "customer",
    isVerified: false,
    joinDate: "2023-08-05",
    location: {
      city: "Houston",
      state: "TX",
      country: "USA",
      coordinates: { lat: 29.7604, lng: -95.3698 },
    },
    profile: {
      bio: "Looking for home renovation services.",
      skills: [],
      rating: 4.5,
      reviewCount: 8,
      requestsPosted: 6,
      responseTime: "< 3 hours",
      languages: ["English", "French"],
    },
    services: [],
    preferences: {
      notifications: { email: true, sms: false, push: false },
      privacy: { showPhone: false, showEmail: true, showLocation: false },
    },
  },
  {
    id: "user5",
    email: "david.brown@email.com",
    password: "hashed_password_202",
    firstName: "David",
    lastName: "Brown",
    fullName: "David Brown",
    phone: "+1 (555) 567-8901",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "service_provider",
    isVerified: true,
    joinDate: "2023-03-12",
    location: {
      city: "Miami",
      state: "FL",
      country: "USA",
      coordinates: { lat: 25.7617, lng: -80.1918 },
    },
    profile: {
      bio: "Professional landscaper with expertise in garden design and maintenance.",
      skills: ["Landscaping", "Garden Design", "Lawn Care", "Irrigation"],
      rating: 4.6,
      reviewCount: 74,
      completedJobs: 112,
      responseTime: "< 1 hour",
      languages: ["English", "Spanish"],
    },
    services: ["svc4", "svc7"],
    preferences: {
      notifications: { email: true, sms: true, push: true },
      privacy: { showPhone: true, showEmail: false, showLocation: true },
    },
  },
]

export function getUserById(id) {
  return users.find((user) => user.id === id)
}

export function getUserByEmail(email) {
  return users.find((user) => user.email === email)
}

export function getServiceProviders() {
  return users.filter((user) => user.role === "service_provider")
}

export function getCustomers() {
  return users.filter((user) => user.role === "customer")
}

export function getVerifiedUsers() {
  return users.filter((user) => user.isVerified)
}

export function getUserStats() {
  const totalUsers = users.length
  const serviceProviders = getServiceProviders().length
  const customers = getCustomers().length
  const verifiedUsers = getVerifiedUsers().length
  const verificationRate = `${Math.round((verifiedUsers / totalUsers) * 100)}%`

  return {
    totalUsers,
    serviceProviders,
    customers,
    verifiedUsers,
    verificationRate,
  }
}

export function authenticateUser(email, password) {
  // In a real app, you would hash the password and compare with stored hash
  const user = getUserByEmail(email)
  if (user && user.password === password) {
    // Don't return the password in the response
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  return null
}

export function searchUsers(query) {
  query = query.toLowerCase()
  return users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.location.city.toLowerCase().includes(query) ||
      (user.role === "service_provider" && user.profile.skills.some((skill) => skill.toLowerCase().includes(query))),
  )
}

export function getUsersByLocation(city, state) {
  return users.filter(
    (user) =>
      user.location.city.toLowerCase() === city.toLowerCase() &&
      user.location.state.toLowerCase() === state.toLowerCase(),
  )
}

export function getUsersBySkill(skill) {
  return users.filter(
    (user) =>
      user.role === "service_provider" && user.profile.skills.some((s) => s.toLowerCase() === skill.toLowerCase()),
  )
}

export function getTopRatedProviders(limit = 5) {
  return getServiceProviders()
    .sort((a, b) => b.profile.rating - a.profile.rating)
    .slice(0, limit)
}

export function validateUserRegistration(userData) {
  const errors = {}

  if (!userData.email) {
    errors.email = "Email is required"
  } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
    errors.email = "Email is invalid"
  } else if (getUserByEmail(userData.email)) {
    errors.email = "Email is already in use"
  }

  if (!userData.password) {
    errors.password = "Password is required"
  } else if (userData.password.length < 8) {
    errors.password = "Password must be at least 8 characters"
  }

  if (!userData.firstName) {
    errors.firstName = "First name is required"
  }

  if (!userData.lastName) {
    errors.lastName = "Last name is required"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function createUser(userData) {
  const validation = validateUserRegistration(userData)

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
    }
  }

  const newUser = {
    id: `user${users.length + 1}`,
    fullName: `${userData.firstName} ${userData.lastName}`,
    avatar: `/placeholder.svg?height=40&width=40&query=${userData.firstName[0]}${userData.lastName[0]}`,
    isVerified: false,
    joinDate: new Date().toISOString().split("T")[0],
    location: userData.location || {
      city: "",
      state: "",
      country: "USA",
      coordinates: { lat: 0, lng: 0 },
    },
    profile: {
      bio: "",
      skills: [],
      rating: 0,
      reviewCount: 0,
      completedJobs: 0,
      responseTime: "N/A",
      languages: ["English"],
    },
    services: [],
    preferences: {
      notifications: { email: true, sms: false, push: false },
      privacy: { showPhone: false, showEmail: false, showLocation: true },
    },
    ...userData,
  }

  users.push(newUser)

  // Don't return the password in the response
  const { password, ...userWithoutPassword } = newUser

  return {
    success: true,
    user: userWithoutPassword,
  }
}

export function updateUser(userId, updateData) {
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return {
      success: false,
      error: "User not found",
    }
  }

  // Don't allow updating the ID
  const { id, ...dataToUpdate } = updateData

  // Update the user
  users[userIndex] = {
    ...users[userIndex],
    ...dataToUpdate,
    // If first or last name is updated, update fullName
    fullName:
      dataToUpdate.firstName || dataToUpdate.lastName
        ? `${dataToUpdate.firstName || users[userIndex].firstName} ${dataToUpdate.lastName || users[userIndex].lastName}`
        : users[userIndex].fullName,
  }

  // Don't return the password in the response
  const { password, ...userWithoutPassword } = users[userIndex]

  return {
    success: true,
    user: userWithoutPassword,
  }
}

export function deleteUser(userId) {
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return {
      success: false,
      error: "User not found",
    }
  }

  users.splice(userIndex, 1)

  return {
    success: true,
  }
}

// Calls the backend's get_user_profile endpoint and returns the user profile data
export async function fetchUserProfile(userId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = currentUser?.accessToken;
  try {
    const response = await fetch(`http://localhost:8000/api/v1/users/profile`,  { 
      method: "GET",
      headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
      },
    },)
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

// Update user profile by calling the backend's update_user_profile endpoint
export async function updateUserProfile(profileData) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = currentUser?.accessToken;
  
  try {
    const response = await fetch(`http://localhost:8000/api/v1/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update user profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message };
  }
}

export function getAllUsers() {
  return users
}

// Admin functions for user management
export async function getAllUsersAdmin(token, searchParams = {}) {
  try {
    const { search, role, status, skip = 0, limit = 100 } = searchParams;
    
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) queryParams.append('search', search);
    if (role && role !== 'all') queryParams.append('role', role);
    if (status && status !== 'all') queryParams.append('status', status);
    
    const response = await fetch(`http://localhost:8000/api/v1/users/admin/users?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return demo data as fallback
    return users;
  }
}

export async function getUserStatsAdmin(token) {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/users/admin/users/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user stats: ${response.statusText}`);
    }
    
    const data = await response.json();
    // console.log("User stats:", data);
    return data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Return demo stats as fallback
    return getUserStats();
  }
}

export async function deleteUserAdmin(token, userId) {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/users/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to delete user')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}