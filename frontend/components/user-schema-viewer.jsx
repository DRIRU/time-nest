"use client"

import { useState } from "react"
import { users, getServiceProviders, getCustomers, getUserStats } from "../lib/users-data"

export default function UserSchemaViewer() {
  const [selectedUser, setSelectedUser] = useState(users[0])
  const [viewMode, setViewMode] = useState("visual") // visual or json
  const stats = getUserStats()

  const serviceProviders = getServiceProviders()
  const customers = getCustomers()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Data Schema Explorer</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setViewMode("visual")}
          className={`px-4 py-2 rounded ${viewMode === "visual" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Visual View
        </button>
        <button
          onClick={() => setViewMode("json")}
          className={`px-4 py-2 rounded ${viewMode === "json" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          JSON View
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">User List</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-2 rounded cursor-pointer flex items-center gap-2 ${selectedUser.id === user.id ? "bg-blue-100 border-l-4 border-blue-600" : "hover:bg-gray-100"}`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-xs text-gray-500">
                    {user.role === "service_provider" ? "Provider" : "Customer"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 p-3 rounded-lg">
            <h3 className="font-semibold mb-2">User Statistics</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <span className="font-medium">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Providers:</span>
                <span className="font-medium">{stats.serviceProviders}</span>
              </div>
              <div className="flex justify-between">
                <span>Customers:</span>
                <span className="font-medium">{stats.customers}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Users:</span>
                <span className="font-medium">
                  {stats.verifiedUsers} ({stats.verificationRate})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          {viewMode === "visual" ? (
            <div className="bg-white rounded-lg shadow">
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{selectedUser.fullName}</h2>
                  <p className="text-gray-500 text-sm">
                    {selectedUser.email} • {selectedUser.role === "service_provider" ? "Service Provider" : "Customer"}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs ${selectedUser.isVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                >
                  {selectedUser.isVerified ? "Verified" : "Unverified"}
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">ID:</span>
                      <span className="w-2/3">{selectedUser.id}</span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Full Name:</span>
                      <span className="w-2/3">{selectedUser.fullName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Email:</span>
                      <span className="w-2/3">{selectedUser.email}</span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Phone:</span>
                      <span className="w-2/3">{selectedUser.phone}</span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Join Date:</span>
                      <span className="w-2/3">{selectedUser.joinDate}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-700 mt-6 mb-2">Location</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">City:</span>
                      <span className="w-2/3">{selectedUser.location.city}</span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">State:</span>
                      <span className="w-2/3">{selectedUser.location.state}</span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Country:</span>
                      <span className="w-2/3">{selectedUser.location.country}</span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Coordinates:</span>
                      <span className="w-2/3">
                        {selectedUser.location.coordinates.lat}, {selectedUser.location.coordinates.lng}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Profile</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Bio:</span>
                      <span className="w-2/3">{selectedUser.profile.bio}</span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Rating:</span>
                      <span className="w-2/3 flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        {selectedUser.profile.rating} ({selectedUser.profile.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Response Time:</span>
                      <span className="w-2/3">{selectedUser.profile.responseTime}</span>
                    </div>
                    {selectedUser.role === "service_provider" && (
                      <div className="flex">
                        <span className="w-1/3 text-gray-500">Completed Jobs:</span>
                        <span className="w-2/3">{selectedUser.profile.completedJobs}</span>
                      </div>
                    )}
                    {selectedUser.role === "customer" && selectedUser.profile.requestsPosted && (
                      <div className="flex">
                        <span className="w-1/3 text-gray-500">Requests Posted:</span>
                        <span className="w-2/3">{selectedUser.profile.requestsPosted}</span>
                      </div>
                    )}
                    <div className="flex">
                      <span className="w-1/3 text-gray-500">Languages:</span>
                      <span className="w-2/3">{selectedUser.profile.languages.join(", ")}</span>
                    </div>
                  </div>

                  {selectedUser.role === "service_provider" && selectedUser.profile.skills.length > 0 && (
                    <>
                      <h3 className="font-semibold text-gray-700 mt-6 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.profile.skills.map((skill) => (
                          <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <h3 className="font-semibold text-gray-700 mt-6 mb-2">Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600">Notifications</h4>
                      <div className="flex gap-3 mt-1">
                        <span
                          className={`px-2 py-1 rounded text-xs ${selectedUser.preferences.notifications.email ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          Email {selectedUser.preferences.notifications.email ? "✓" : "✗"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${selectedUser.preferences.notifications.sms ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          SMS {selectedUser.preferences.notifications.sms ? "✓" : "✗"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${selectedUser.preferences.notifications.push ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          Push {selectedUser.preferences.notifications.push ? "✓" : "✗"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-600">Privacy</h4>
                      <div className="flex gap-3 mt-1">
                        <span
                          className={`px-2 py-1 rounded text-xs ${selectedUser.preferences.privacy.showPhone ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          Show Phone {selectedUser.preferences.privacy.showPhone ? "✓" : "✗"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${selectedUser.preferences.privacy.showEmail ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          Show Email {selectedUser.preferences.privacy.showEmail ? "✓" : "✗"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${selectedUser.preferences.privacy.showLocation ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          Show Location {selectedUser.preferences.privacy.showLocation ? "✓" : "✗"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-auto max-h-[600px]">
              <pre className="text-sm">{JSON.stringify(selectedUser, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
