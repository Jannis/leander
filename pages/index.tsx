import React, { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useConfig } from '../hooks/config'

import '../styles/index.css'

const Page = dynamic(() => import('../components/page'), { ssr: false })

export default () => {
  let router = useRouter()
  useEffect(() => {
    if (router.query.config) {
      router.push(`/issues?config=${router.query.config}`)
    } else {
      router.push('/issues')
    }
  })
  return <div />
}
