"use client"

import React from 'react'
import { Button } from '../elements/button'
import { useHello } from '@/hooks/example/example'
import { redirect } from 'next/navigation'

const Example = () => {
  const { data, isLoading, error } = useHello()

  return (
    <div className="flex flex-col items-center gap-4">
      {isLoading && <p>Loading...</p>}
      
      {error && <p className="text-red-500">Error: {error.message}</p>}
      
      {data && (
        <div className="text-center">
          <p className="mb-4">{data.message}</p>
          <Button 
            className="mt-4"
            onClick={() => redirect('/users')}
          >
            Kliknij mnie!
          </Button>
        </div>
      )}
    </div>
  )
}

export default Example