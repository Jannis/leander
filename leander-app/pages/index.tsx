import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useCookies } from 'react-cookie'

import '../styles/index.css'

export default () => {
  let router = useRouter()
  let [cookies] = useCookies(['leander'])

  useEffect(() => {
    if (!cookies['leander']) {
      router.push(`/github/login?returnTo=${window.location.href}`)
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
