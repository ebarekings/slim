import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Col,
  Descriptions,
  Dropdown,
  Input,
  Layout,
  Menu,
  Modal,
  Row,
  Space,
  Badge,
  Collapse
} from 'antd'
import {
  ApiOutlined,
  CheckOutlined,
  InfoOutlined,
  StopOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { detect } from 'detect-browser'

import Button from './Button'
import { RouteComponentProps, withRouter } from '../utils/router'
import NotificationMiddleware, {NotificationMiddlewareEvents} from '../services/NotificationMiddleware'

interface HeaderProps extends RouteComponentProps {
  app: {
    name: string
    version: string
    homepage: string
    uid: string
    organization?: string
  }
  user?: {
    name: string
    email: string
  }
  showWorklistButton: boolean
  onServerSelection: ({ url }: { url: string }) => void
  onUserLogout?: () => void
  showServerSelectionButton: boolean
}

interface HeaderState {
  selectedServerUrl?: string
  isServerSelectionModalVisible: boolean
  isServerSelectionDisabled: boolean
  errorObj: Error[]
  errorCategory: string[]
}

/**
 * React component for the application header.
 */
class Header extends React.Component<HeaderProps, HeaderState> {
  constructor (props: HeaderProps) {
    super(props)
    this.state = {
      isServerSelectionModalVisible: false,
      isServerSelectionDisabled: true,
      errorObj: [],
      errorCategory: []
    }

    const onErrorHandler = ({
      category,
      error
    }: {
      category: string
      error: Error
    }) => {
      this.setState({
        errorObj: [...this.state.errorObj, error],
        errorCategory: [...this.state.errorCategory, category]
      })
    }

    NotificationMiddleware.subscribe (
      NotificationMiddlewareEvents.OnError, onErrorHandler)
  }

  handleInfoButtonClick = (): void => {
    const browser = detect()
    const environment: {
      browser: {
        name?: string
        version?: string
      }
      os: {
        name?: string
      }
    } = {
      browser: {},
      os: {}
    }
    if (browser != null) {
      environment.browser = {
        name: browser.name != null ? browser.name : undefined,
        version: browser.version != null ? browser.version : undefined
      }
      environment.os = {
        name: browser.os != null ? browser.os : undefined
      }
    }

    Modal.info({
      title: 'About',
      width: 600,
      content: (
        <>
          <Descriptions title='Application' column={1}>
            <Descriptions.Item label='Name'>
              {this.props.app.name}
            </Descriptions.Item>
            <Descriptions.Item label='Version'>
              {this.props.app.version}
            </Descriptions.Item>
            <Descriptions.Item label='Homepage'>
              {this.props.app.homepage}
            </Descriptions.Item>
          </Descriptions>
          <Descriptions title='Browser' column={1}>
            <Descriptions.Item label='Name'>
              {environment.browser.name}
            </Descriptions.Item>
            <Descriptions.Item label='Version'>
              {environment.browser.version}
            </Descriptions.Item>
          </Descriptions>
          <Descriptions title='Operating System' column={1}>
            <Descriptions.Item label='Name'>
              {environment.os.name}
            </Descriptions.Item>
          </Descriptions>
        </>
      ),
      onOk (): void {}
    })
  }

  handleDebugButtonClick = (): void => {
    let errorMsgs: {
      Server: string[]
      Parsing: string[]
      Viewer: string[]
    } = {
      Server: [],
      Parsing: [],
      Viewer: []
    }

    type ObjectKey = keyof typeof errorMsgs
    const errorNum = this.state.errorObj.length

    if (errorNum > 0) {
      for (let i = 0; i < errorNum; i++) {
        const category = this.state.errorCategory[i] as ObjectKey
        errorMsgs[category].push(this.state.errorObj[i].message)
      }
    }

    const { Panel } = Collapse

    const showErrorCount = (errcount: number) => (
      <Badge count={errcount}></Badge>
    )

    Modal.info({
      title: 'Debug Information\n (Check console for more info.)',
      width: 800,
      content: (
        <Collapse>
          <Panel
            header='Server Error'
            key='servererror'
            extra={showErrorCount(errorMsgs.Server.length)}
          >
            {
              <ol>
                {errorMsgs.Server.map(e => (
                  <li>{e}</li>
                ))}
              </ol>
            }
          </Panel>
          <Panel
            header='Data Parsing error'
            key='parsingerror'
            extra={showErrorCount(errorMsgs.Parsing.length)}
          >
            {
              <ol>
                {errorMsgs.Parsing.map(e => (
                  <li>{e}</li>
                ))}
              </ol>
            }
          </Panel>
          <Panel
            header='Viewer error'
            key='viewererror'
            extra={showErrorCount(errorMsgs.Viewer.length)}
          >
            <ol>
              {errorMsgs.Viewer.map(e => (
                <li>{e}</li>
              ))}
            </ol>
          </Panel>
        </Collapse>
      ),
      onOk(): void {}
    })
  }

  handleServerSelectionButtonClick = (): void => {
    this.setState({ isServerSelectionModalVisible: true })
  }

  render (): React.ReactNode {
    let user = null
    if (this.props.user !== undefined) {
      const userMenuItems = []
      if (this.props.onUserLogout !== undefined) {
        userMenuItems.push(
          {
            label: 'Logout',
            key: 'user-logout',
            onClick: () => {
              if (this.props.onUserLogout !== undefined) {
                this.props.onUserLogout()
              }
            }
          }
        )
      }
      const userMenu = <Menu items={userMenuItems} />
      user = (
        <Dropdown overlay={userMenu} trigger={['click']}>
          <Button
            icon={UserOutlined}
            onClick={e => e.preventDefault()}
            label={`${this.props.user.name} (${this.props.user.email})`}
          />
        </Dropdown>
      )
    }

    let worklistButton
    if (this.props.showWorklistButton) {
      worklistButton = (
        <NavLink to='/'>
          <Button icon={UnorderedListOutlined} tooltip='Go to worklist' />
        </NavLink>
      )
    }

    const infoButton = (
      <Button
        icon={InfoOutlined}
        tooltip='Get app info'
        onClick={this.handleInfoButtonClick}
      />
    )

    const debugButton = (
      <Badge count={this.state.errorObj.length}>
        <Button
          icon={SettingOutlined}
          tooltip='Debug info'
          onClick={this.handleDebugButtonClick}
        />
      </Badge>
    )

    let serverSelectionButton
    if (this.props.showServerSelectionButton) {
      serverSelectionButton = (
        <Button
          icon={ApiOutlined}
          tooltip='Select server'
          onClick={this.handleServerSelectionButtonClick}
        />
      )
    }

    const handleServerSelectionInput = (
      event: React.FormEvent<HTMLInputElement>
    ): void => {
      const value = event.currentTarget.value
      let isDisabled = true
      if (value != null) {
        try {
          const url = new URL(value)
          if (url.protocol.startsWith('http') && url.pathname.length > 0) {
            isDisabled = false
          }
        } catch (TypeError) {}
      }
      this.setState({
        selectedServerUrl: value,
        isServerSelectionDisabled: isDisabled
      })
    }

    const handleServerSelectionCancellation = (event: any): void => {
      this.setState({
        selectedServerUrl: undefined,
        isServerSelectionModalVisible: false,
        isServerSelectionDisabled: true
      })
    }

    const handleServerSelection = (event: any): void => {
      const url = this.state.selectedServerUrl
      let closeModal = false
      if (url != null && url !== '') {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          this.props.onServerSelection({ url })
          closeModal = true
        }
      }
      this.setState({
        selectedServerUrl: undefined,
        isServerSelectionModalVisible: !closeModal,
        isServerSelectionDisabled: true
      })
    }

    const logoUrl = process.env.PUBLIC_URL + '/logo.svg'

    return (
      <>
        <Layout.Header style={{ width: '100%', padding: '0 14px' }}>
          <Row>
            <Col>
              <Space align='center' direction='horizontal'>
                <img
                  src={logoUrl}
                  alt=''
                  style={{ height: '64px', margin: '-14px' }}
                />
              </Space>
            </Col>
            <Col flex='auto' />
            <Col>
              <Space direction='horizontal'>
                {worklistButton}
                {infoButton}
                {debugButton}
                {serverSelectionButton}
                {user}
              </Space>
            </Col>
          </Row>
        </Layout.Header>

        <Modal
          visible={this.state.isServerSelectionModalVisible}
          title='Select DICOMweb server'
          onOk={handleServerSelection}
          onCancel={handleServerSelectionCancellation}
        >
          <Input
            placeholder='Enter base URL of DICOMweb Study Service'
            onChange={handleServerSelectionInput}
            onPressEnter={handleServerSelection}
            addonAfter={
              this.state.isServerSelectionDisabled
                ? <StopOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                : <CheckOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
            }
          />
        </Modal>
      </>
    )
  }
}

export default withRouter(Header)
