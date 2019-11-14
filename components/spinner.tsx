import { Spin, Icon } from 'antd'

const Spinner = () => (
  <div className="w-full h-full flex justify-center items-center">
    <Spin
      indicator={<Icon type="smile" theme="twoTone" spin style={{ fontSize: 48 }} />}
    />
  </div>
)

export default Spinner
