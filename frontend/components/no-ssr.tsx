"use client"

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

const NoSSR = ({ children, fallback = null }: NoSSRProps) => {
  return <>{children}</>
}

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
})
