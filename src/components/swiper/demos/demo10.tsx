import { Space, Swiper } from 'antd-mobile'
import { DemoBlock, DemoDescription } from 'demos'
import React from 'react'

const outerColors = ['#fff1f0', '#f6ffed', '#e6f7ff']
const innerColors = ['#ace0ff', '#bcffbd', '#e4fabd', '#ffcfac']

export default () => {
  const InnerSwiper = () => (
    <Swiper loop={false} style={{ '--height': '160px' }}>
      {innerColors.map((color, index) => (
        <Swiper.Item key={index}>
          <div
            style={{
              height: 160,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: color,
            }}
          >
            内层 {index + 1}
          </div>
        </Swiper.Item>
      ))}
    </Swiper>
  )

  return (
    <>
      <DemoBlock title='同向嵌套（边缘放行给外层）'>
        <Space direction='vertical' block>
          <DemoDescription content='内层在中间时仅自身滑动；在最左继续右滑或最右继续左滑时，交给外层滑动。' />
          <Swiper allowNestedSwipe loop={false} style={{ '--height': '200px' }}>
            {outerColors.map((color, index) => (
              <Swiper.Item key={index}>
                <div
                  style={{
                    height: 200,
                    padding: 16,
                    boxSizing: 'border-box',
                    background: color,
                  }}
                >
                  <div style={{ marginBottom: 12 }}>外层 {index + 1}</div>
                  <InnerSwiper />
                </div>
              </Swiper.Item>
            ))}
          </Swiper>
        </Space>
      </DemoBlock>
    </>
  )
}
