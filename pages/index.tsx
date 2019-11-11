import React, { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useConfig } from '../hooks/config'

import '../styles/index.css'
import { useCookies } from 'react-cookie'

export default () => {
  let router = useRouter()
  let [cookies] = useCookies(['leander-access-token'])

  useEffect(() => {
    if (!cookies['leander-access-token']) {
      router.push(`/login?returnTo=${window.location.href}`)
      return
    }

    if (window.location.search) {
      router.push(`/issues${window.location.search}`)
      return
    }
  }, [])

  if (!router.query.config) {
    return <div className="text-red-500">No `?config=` provided.</div>
  } else {
    return <div />
  }
}
