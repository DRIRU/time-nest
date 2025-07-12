// Test file to verify Next.js 15 searchParams handling
// This demonstrates the correct way to handle searchParams in Next.js 15

// ❌ WRONG - This will cause the error
// export default async function BadPage({ searchParams }) {
//   const query = searchParams.get('q') // Direct access without await
//   return <div>{query}</div>
// }

// ✅ CORRECT - This is the proper way in Next.js 15
export default async function GoodPage({ searchParams }) {
  const params = await searchParams // Await the searchParams
  const query = params.q || '' // Now safely access properties
  return <div>{query}</div>
}

// For client components using useSearchParams hook:
// ✅ CORRECT - This is still the proper way
// 'use client'
// import { useSearchParams } from 'next/navigation'
// 
// export default function ClientComponent() {
//   const searchParams = useSearchParams()
//   const query = searchParams.get('q') || ''
//   return <div>{query}</div>
// }

// The key difference:
// - Server components: await searchParams before using
// - Client components: use useSearchParams hook (no await needed)

export { GoodPage }
