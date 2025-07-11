"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Shield,
  Clock,
  Star,
  MoreVertical,
  Download,
  RefreshCw,
  UserPlus
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAllUsers, getUserStats, getAllUsersAdmin, getUserStatsAdmin, deleteUserAdmin } from "@/lib/users-data"
import LocationAutocomplete from "@/components/location-autocomplete"

export default function UserManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [adminUser, setAdminUser] = useState(null)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    serviceProviders: 0,
    customers: 0,
    verifiedUsers: 0,
    verificationRate: "0%"
  })
  
  // Add user form state
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [addUserForm, setAddUserForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    gender: "",
    age: "",
    location: ""
  })
  
  // Delete user state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState("unknown") // "connected", "disconnected", "unknown"

  useEffect(() => {
    // Check admin authentication
    const adminAuth = localStorage.getItem("adminAuth")
    const adminUserData = localStorage.getItem("adminUser")
    
    if (!adminAuth || adminAuth !== "true") {
      router.push("/admin/login")
      return
    }

    if (adminUserData) {
      setAdminUser(JSON.parse(adminUserData))
    }
  }, [router])

  useEffect(() => {
    if (adminUser) {
      loadUsers()
    }
  }, [adminUser]) // Only load initially when admin user is set

  useEffect(() => {
    if (adminUser && (searchTerm || statusFilter !== "all")) {
      // Use debounced search for better performance
      const debounceTimer = setTimeout(() => {
        searchUsers()
      }, 300)
      
      return () => clearTimeout(debounceTimer)
    } else if (adminUser && searchTerm === "" && statusFilter === "all") {
      // Reset to show all users when search is cleared
      loadUsers()
    }
  }, [adminUser, searchTerm, statusFilter])

  useEffect(() => {
    filterAndSortUsers()
  }, [users, sortBy])

  // Check for query parameter to open add user modal
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'add') {
      setShowAddUserModal(true)
      // Clean up the URL parameter
      const url = new URL(window.location)
      url.searchParams.delete('action')
      router.replace(url.pathname + url.search)
    }
  }, [searchParams, router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      if (!adminUser?.accessToken) {
        console.log("No admin token available, using demo data")
        const allUsers = getAllUsers()
        const userStats = getUserStats()
        setUsers(allUsers)
        setStats(userStats)
        return
      }
      
      console.log("Loading users with admin token...")
      
      // Test backend connectivity first
      try {
        const testResponse = await fetch('http://localhost:8000/api/v1/users/admin/users/stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminUser.accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!testResponse.ok) {
          throw new Error(`Backend returned ${testResponse.status}: ${testResponse.statusText}`)
        }
        
        setBackendStatus("connected")
      } catch (connectError) {
        console.error("Backend connectivity test failed:", connectError)
        setBackendStatus("disconnected")
        throw new Error("Backend server is not accessible")
      }
      
      // Load all users initially without search/filter
      const searchParams = {
        search: "",
        status: "all",
        skip: 0,
        limit: 1000
      }
      
      const [allUsers, userStats] = await Promise.all([
        getAllUsersAdmin(adminUser.accessToken, searchParams),
        getUserStatsAdmin(adminUser.accessToken)
      ])
      
      console.log("Successfully loaded users from backend:", allUsers.length)
      setUsers(allUsers)
      setStats(userStats)
    } catch (error) {
      console.error("Error loading users, falling back to demo data:", error)
      
      // Show a user-friendly message about backend availability
      if (error.message.includes("Backend server is not accessible") || error.message.includes("Failed to fetch")) {
        console.warn("Backend server appears to be offline. Using demo data for now.")
        setBackendStatus("disconnected")
      } else {
        setBackendStatus("unknown")
      }
      
      // Fallback to demo data
      const allUsers = getAllUsers()
      const userStats = getUserStats()
      setUsers(allUsers)
      setStats(userStats)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    try {
      setSearchLoading(true)
      
      if (!adminUser?.accessToken) {
        // If no admin token, use demo data with client-side filtering
        const allUsers = getAllUsers()
        let filtered = allUsers
        
        if (searchTerm) {
          filtered = filtered.filter(user => 
            getUserDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.phone || user.phone_number || '').includes(searchTerm) ||
            (user.location || '').toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        
        if (statusFilter !== "all") {
          filtered = filtered.filter(user => {
            const isVerified = user.isVerified || user.phone_number
            switch (statusFilter) {
              case "verified":
                return isVerified
              case "unverified":
                return !isVerified
              case "active":
                return user.status === "Active" || !user.status
              case "inactive":
                return user.status === "Inactive" || user.status === "Suspended"
              default:
                return true
            }
          })
        }
        
        setUsers(filtered)
        return
      }
      
      // Search/filter users without reloading stats
      const searchParams = {
        search: searchTerm,
        status: statusFilter,
        skip: 0,
        limit: 1000
      }
      
      const searchResults = await getAllUsersAdmin(adminUser.accessToken, searchParams)
      setUsers(searchResults)
    } catch (error) {
      console.error("Error searching users:", error)
      // Fallback to demo data filtering
      const allUsers = getAllUsers()
      let filtered = allUsers
      
      if (searchTerm) {
        filtered = filtered.filter(user => 
          getUserDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phone || user.phone_number || '').includes(searchTerm) ||
          (user.location || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (statusFilter !== "all") {
        filtered = filtered.filter(user => {
          const isVerified = user.isVerified || user.phone_number
          switch (statusFilter) {
            case "verified":
              return isVerified
            case "unverified":
              return !isVerified
            case "active":
              return user.status === "Active" || !user.status
            case "inactive":
              return user.status === "Inactive" || user.status === "Suspended"
            default:
              return true
          }
        })
      }
      
      setUsers(filtered)
    } finally {
      setSearchLoading(false)
    }
  }

  const filterAndSortUsers = () => {
    let filtered = [...users]

    // Since search and filters are now handled by backend, we only need to handle sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date_joined || b.joinDate) - new Date(a.date_joined || a.joinDate)
        case "oldest":
          return new Date(a.date_joined || a.joinDate) - new Date(b.date_joined || b.joinDate)
        case "name":
          const nameA = getUserDisplayName(a)
          const nameB = getUserDisplayName(b)
          return nameA.localeCompare(nameB)
        case "email":
          return a.email.localeCompare(b.email)
        case "rating":
          return (b.profile?.rating || 0) - (a.profile?.rating || 0)
        default:
          return 0
      }
    })

    setFilteredUsers(filtered)
  }

  const handleUserAction = async (action, userId) => {
    if (action === 'delete') {
      const user = users.find(u => (u.id || u.user_id) === userId)
      setUserToDelete(user)
      setShowDeleteModal(true)
      return
    }
    
    // Placeholder for other user actions
    console.log(`${action} user ${userId}`)
    // Here you would call the appropriate API endpoint
  }

  const handleDeleteUser = async () => {
    if (!userToDelete || !adminUser?.accessToken) return

    setDeleteLoading(true)
    try {
      await deleteUserAdmin(adminUser.accessToken, userToDelete.id || userToDelete.user_id)
      
      // Remove user from local state
      setUsers(prev => prev.filter(u => (u.id || u.user_id) !== (userToDelete.id || userToDelete.user_id)))
      
      // Show success message
      alert(`User ${getUserDisplayName(userToDelete)} has been deleted successfully.`)
      
      // Close modal and reset state
      setShowDeleteModal(false)
      setUserToDelete(null)
      
      // Refresh user list to get updated stats
      loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      alert(`Failed to delete user: ${error.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddUserFormChange = (field, value) => {
    setAddUserForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetAddUserForm = () => {
    setAddUserForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone_number: "",
      gender: "",
      age: "",
      location: ""
    })
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setAddUserLoading(true)

    try {
      // Validate form
      if (!addUserForm.first_name || !addUserForm.last_name || !addUserForm.email || !addUserForm.password) {
        alert("Please fill in all required fields")
        return
      }

      // Call API to create user
      const response = await fetch('http://localhost:8000/api/v1/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: addUserForm.first_name,
          last_name: addUserForm.last_name,
          email: addUserForm.email,
          password: addUserForm.password,
          phone_number: addUserForm.phone_number || null,
          gender: addUserForm.gender || null,
          age: addUserForm.age ? parseInt(addUserForm.age) : null,
          location: addUserForm.location || null
        })
      })

      if (response.ok) {
        alert("User created successfully!")
        setShowAddUserModal(false)
        resetAddUserForm()
        // Refresh the user list
        loadUsers()
      } else {
        const errorData = await response.json()
        alert(`Error creating user: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Error creating user: " + error.message)
    } finally {
      setAddUserLoading(false)
    }
  }

  const getUserStatusBadge = (user) => {
    if (!user) return <Badge variant="outline">Unknown</Badge>
    
    const isVerified = user.isVerified || user.phone_number // Backend users with phone are considered verified
    if (isVerified) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>
    }
    return <Badge variant="outline">Unverified</Badge>
  }

  const getUserDisplayName = (user) => {
    // Handle null/undefined user
    if (!user) return 'Unknown User'
    
    // Handle backend format (first_name, last_name) or demo format (fullName)
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim()
    }
    return user.fullName || 'Unknown User'
  }

  const getUserJoinDate = (user) => {
    if (!user) return new Date().toISOString()
    return user.joinDate || user.date_joined || new Date().toISOString()
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case "service_provider":
        return <Badge className="bg-blue-100 text-blue-800">Provider</Badge>
      case "customer":
        return <Badge className="bg-purple-100 text-purple-800">Customer</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/admin")} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
                {backendStatus === "disconnected" && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                    Demo Mode
                  </Badge>
                )}
                {backendStatus === "connected" && (
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    Live Data
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowAddUserModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                if (searchTerm || statusFilter !== "all") {
                  searchUsers()
                } else {
                  loadUsers()
                }
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.total_users}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.verified_users}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.verification_rate}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verification Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="email">Email A-Z</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Users ({filteredUsers.length})
              {searchLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="relative">
                {searchLoading && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                    </div>
                  </div>
                )}
                <table className="w-full">
                  <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2">User</th>
                    <th className="text-left py-3 px-2">Contact</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Rating</th>
                    <th className="text-left py-3 px-2">Joined</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id || user.user_id || user.email} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={getUserDisplayName(user)} />
                            <AvatarFallback>
                              {getUserDisplayName(user).split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getUserDisplayName(user)}</p>
                            <p className="text-sm text-gray-500">ID: {user.id || user.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          {(user.phone || user.phone_number) && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone || user.phone_number}
                            </div>
                          )}
                          {(user.location?.city || user.location) && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {user.location?.city ? `${user.location.city}, ${user.location.state}` : user.location}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {getUserStatusBadge(user)}
                      </td>
                      <td className="py-3 px-2">
                        {user.profile?.rating ? (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{user.profile.rating}</span>
                            <span className="text-sm text-gray-500 ml-1">
                              ({user.profile.reviewCount})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No rating</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(getUserJoinDate(user))}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                                <DialogDescription>
                                  Complete information about {getUserDisplayName(selectedUser)}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-6">
                                  <div className="flex items-center space-x-4">
                                    <Avatar className="h-16 w-16">
                                      <AvatarImage src={selectedUser.avatar} alt={getUserDisplayName(selectedUser)} />
                                      <AvatarFallback className="text-lg">
                                        {getUserDisplayName(selectedUser).split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-lg font-semibold">{getUserDisplayName(selectedUser)}</h3>
                                      <div className="flex items-center space-x-2 mt-1">
                                        {getUserStatusBadge(selectedUser)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Contact Information</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center">
                                          <Mail className="h-4 w-4 mr-2" />
                                          {selectedUser.email}
                                        </div>
                                        {(selectedUser.phone || selectedUser.phone_number) && (
                                          <div className="flex items-center">
                                            <Phone className="h-4 w-4 mr-2" />
                                            {selectedUser.phone || selectedUser.phone_number}
                                          </div>
                                        )}
                                        {(selectedUser.location?.city || selectedUser.location) && (
                                          <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            {selectedUser.location?.city ? `${selectedUser.location.city}, ${selectedUser.location.state}` : selectedUser.location}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-2">Account Information</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center">
                                          <Calendar className="h-4 w-4 mr-2" />
                                          Joined: {formatDate(getUserJoinDate(selectedUser))}
                                        </div>
                                        {selectedUser.profile?.rating && (
                                          <div className="flex items-center">
                                            <Star className="h-4 w-4 mr-2" />
                                            Rating: {selectedUser.profile.rating} ({selectedUser.profile.reviewCount} reviews)
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {selectedUser.profile?.bio && (
                                    <div>
                                      <h4 className="font-medium mb-2">Bio</h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {selectedUser.profile.bio}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {selectedUser.profile?.skills && selectedUser.profile.skills.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-2">Skills</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedUser.profile.skills.map((skill, index) => (
                                          <Badge key={index} variant="secondary">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUserAction('edit', user.id || user.user_id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction('verify', user.id || user.user_id)}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                {(user.isVerified || user.phone_number) ? 'Unverify' : 'Verify'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction('suspend', user.id || user.user_id)}>
                                <UserX className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('delete', user.id || user.user_id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with the required information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={addUserForm.first_name}
                  onChange={(e) => handleAddUserFormChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={addUserForm.last_name}
                  onChange={(e) => handleAddUserFormChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={addUserForm.email}
                onChange={(e) => handleAddUserFormChange('email', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={addUserForm.password}
                onChange={(e) => handleAddUserFormChange('password', e.target.value)}
                required
                minLength={8}
              />
            </div>
            
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={addUserForm.phone_number}
                onChange={(e) => handleAddUserFormChange('phone_number', e.target.value)}
                placeholder="e.g., +1234567890"
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <LocationAutocomplete
                name="location"
                value={addUserForm.location}
                onChange={(value) => handleAddUserFormChange('location', value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={addUserForm.gender} onValueChange={(value) => handleAddUserFormChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={addUserForm.age}
                  onChange={(e) => handleAddUserFormChange('age', e.target.value)}
                  min="13"
                  max="120"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddUserModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addUserLoading}>
                {addUserLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="py-4">
              <div className="flex items-center space-x-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userToDelete.avatar} alt={getUserDisplayName(userToDelete)} />
                  <AvatarFallback>
                    {getUserDisplayName(userToDelete).split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getUserDisplayName(userToDelete)}</p>
                  <p className="text-sm text-gray-500">{userToDelete.email}</p>
                  <p className="text-sm text-gray-500">ID: {userToDelete.id || userToDelete.user_id}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                This will permanently delete the user account and all associated data. The user will no longer be able to access their account.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
