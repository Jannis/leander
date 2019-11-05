import React, { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useReactQueryConfig } from 'react-query'
import { useConfig } from '../hooks/config'

const Page = dynamic(() => import('../components/page'), { ssr: false })

useReactQueryConfig({
  suspense: true,
})

export default () => {
  let router = useRouter()
  useEffect(() => {
    router.push('/overview')
  })
  return <div />
}
