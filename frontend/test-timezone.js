// Test script to verify IST timezone formatting
const formatDateIST = (dateString, options = {}) => {
  if (!dateString) return 'N/A'
  
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }
  
  const mergedOptions = { ...defaultOptions, ...options }
  
  try {
    return new Date(dateString).toLocaleString('en-IN', mergedOptions)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

const formatDateOnlyIST = (dateString) => {
  return formatDateIST(dateString, {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
}

// Test with current date
const now = new Date().toISOString()
console.log('Current time UTC:', now)
console.log('Current time IST (with time):', formatDateIST(now))
console.log('Current time IST (date only):', formatDateOnlyIST(now))

// Test with a specific date from the reports
const testDate = '2025-07-29T09:23:35Z'
console.log('Test date UTC:', testDate)
console.log('Test date IST (with time):', formatDateIST(testDate))
console.log('Test date IST (date only):', formatDateOnlyIST(testDate))
