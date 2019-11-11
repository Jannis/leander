import Organization from './nav/organization'
import { Suspense, useState, useEffect } from 'react'
import Repositories from './nav/repositories'
import Pages from './nav/pages'
import { Icon, Spin } from 'antd'

const Logo: React.FunctionComponent<{}> = props => {
  let [spin, setSpin] = useState(true)

  useEffect(() => {
    setTimeout(() => setSpin(false), 2000)
  })

  return (
    <div className="container flex flex-row items-center pt-4 pb-8">
      <Icon type="smile" theme="twoTone" spin={spin} className="text-3xl" />
      <h1 className="text-xl m-0 pl-2" style={{ color: '#1890ff' }}>
        Leander
      </h1>
    </div>
  )
}

const Nav: React.FunctionComponent<{}> = props => {
  return (
    <div className="flex flex-col flex-grow-0 p-8" style={{ minWidth: '14rem' }}>
      <Logo />
      <Suspense
        fallback={<Spin indicator={<Icon type="loading" className="text-2xl" spin />} />}
      >
        <>
          <Organization />
          <Repositories />
          <Pages />
        </>
      </Suspense>
    </div>
  )
}

export default Nav
