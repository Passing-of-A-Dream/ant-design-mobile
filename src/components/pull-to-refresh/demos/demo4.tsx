import React, { useRef, useState } from 'react'
import { PullToRefresh, List, Button } from 'antd-mobile'
import type { PullToRefreshRef } from '..'
import { lorem } from 'demos'

function getNextData() {
  const ret: string[] = []
  for (let i = 0; i < 18; i++) {
    ret.unshift(lorem.generateWords(1))
  }
  return ret
}

export default () => {
  const [data, setData] = useState(() => getNextData())
  const ref = useRef<PullToRefreshRef>(null)

  return (
    <>
      <Button
        style={{ margin: '8px 16px' }}
        onClick={() => ref.current?.startRefresh()}
      >
        外部触发刷新
      </Button>
      <PullToRefresh
        ref={ref}
        onRefresh={() => {
          return new Promise<void>(() => {
            // Never resolve — manually call completeRefresh() when done.
            // This is useful when onRefresh cannot return a Promise
            // (e.g. rtk-query, callbacks, event-driven data sources).
            setTimeout(() => {
              setData(prev => [...getNextData(), ...prev])
              ref.current?.completeRefresh()
            }, 2000)
          })
        }}
      >
        <List style={{ minHeight: '100vh' }}>
          {data.map((item, index) => (
            <List.Item key={index}>{item}</List.Item>
          ))}
        </List>
      </PullToRefresh>
    </>
  )
}
