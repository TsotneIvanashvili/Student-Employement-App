import { Component } from 'react'

// თუ რომელიმე ეკრანი მოულოდნელად გაფუჭდა, თეთრი გვერდის ნაცვლად გასაგებ შეტყობინებას ვაჩვენებთ
export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.error(error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="text-[20px] font-semibold">რაღაც გაფუჭდა</p>
          <p className="mt-1 text-[15px] text-muted">გვერდის თავიდან ჩატვირთვა, როგორც წესი, შველის.</p>
          <button onClick={() => window.location.assign('/')} className="mt-5 rounded-2xl bg-brand px-6 py-3 text-[15px] font-semibold text-on-brand">თავიდან ჩატვირთვა</button>
        </div>
      </div>
    )
  }
}
