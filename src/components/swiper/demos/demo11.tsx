import { Card, DotLoading, Space, Swiper } from 'antd-mobile'
import { DemoBlock, DemoDescription } from 'demos'
import React, { useMemo, useState } from 'react'

const outerColors = ['#fff1f0', '#f6ffed', '#e6f7ff']
const innerColors = ['#ace0ff', '#bcffbd', '#e4fabd', '#ffcfac']

export default () => {
  const [outerIndex, setOuterIndex] = useState(0)
  const [innerIndexList, setInnerIndexList] = useState<number[]>(
    new Array(outerColors.length).fill(0)
  )

  const currentInnerIndex = innerIndexList[outerIndex] ?? 0

  const statusText = useMemo(() => {
    const atInnerLeft = currentInnerIndex === 0
    const atInnerRight = currentInnerIndex === innerColors.length - 1

    if (atInnerLeft) {
      return '内层已到最左：继续右滑应放行给外层'
    }
    if (atInnerRight) {
      return '内层已到最右：继续左滑应放行给外层'
    }
    return '内层在中间：应优先滑动内层'
  }, [currentInnerIndex])

  return (
    <DemoBlock title='同向嵌套边界验证（可视化索引）'>
      <Space direction='vertical' block>
        <DemoDescription content='操作建议：先把内层滑到左右边界，再继续同方向滑动；观察外层索引是否变化。' />

        <Card>
          <Space direction='vertical' block>
            <div>
              外层 index: <b>{outerIndex}</b> / {outerColors.length - 1}
            </div>
            <div>
              当前页内层 index: <b>{currentInnerIndex}</b> /{' '}
              {innerColors.length - 1}
            </div>
            <div style={{ color: '#666' }}>
              <DotLoading /> {statusText}
            </div>
          </Space>
        </Card>

        <Swiper
          allowNestedSwipe
          loop={false}
          style={{ '--height': '220px' }}
          onIndexChange={setOuterIndex}
        >
          {outerColors.map((outerColor, outerI) => (
            <Swiper.Item key={outerI}>
              <div
                style={{
                  height: 220,
                  padding: 12,
                  boxSizing: 'border-box',
                  background: outerColor,
                }}
              >
                <div style={{ marginBottom: 10 }}>外层页面 {outerI + 1}</div>
                <Swiper
                  loop={false}
                  style={{ '--height': '160px' }}
                  onIndexChange={idx => {
                    setInnerIndexList(prev => {
                      const next = [...prev]
                      next[outerI] = idx
                      return next
                    })
                  }}
                >
                  {innerColors.map((innerColor, innerI) => (
                    <Swiper.Item key={innerI}>
                      <div
                        style={{
                          height: 160,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          background: innerColor,
                        }}
                      >
                        内层 {innerI + 1}
                      </div>
                    </Swiper.Item>
                  ))}
                </Swiper>
              </div>
            </Swiper.Item>
          ))}
        </Swiper>
      </Space>
    </DemoBlock>
  )
}
