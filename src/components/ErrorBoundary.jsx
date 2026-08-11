
import React from 'react'

// 兜底组件：万一某个模块渲染时出错，显示一个友好提示 + 刷新按钮，
// 而不是让整个 App 变成一片空白（之前冻干库存那次崩溃就是因为没有这个）
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '未知错误' }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] 捕获到渲染错误:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-cream px-6">
          <div className="pixel-corners bg-white border-2 border-ink shadow-pixel p-5 max-w-sm w-full text-center">
            <p className="text-3xl mb-2">🛠️</p>
            <p className="font-display text-base mb-1">这个页面出了点小问题</p>
            <p className="text-xs text-stone2-darker mb-4">
              不用担心，你的数据都还在本地，没有丢失。点下面按钮刷新一下，通常就能恢复正常。
            </p>
            <button
              onClick={this.handleReload}
              className="pixel-corners-sm border-2 border-ink bg-pink px-4 py-2 font-display shadow-pixel-sm active:translate-x-[1px] active:translate-y-[1px]"
            >
              刷新页面
            </button>
            <p className="text-[10px] text-stone2-darker mt-4 break-all">{this.state.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
