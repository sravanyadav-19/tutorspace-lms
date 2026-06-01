import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import styles from './ErrorBoundary.module.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) this.props.onReset()
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <AlertTriangle size={32} className={styles.icon} />
            </div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              An unexpected error occurred. Try refreshing the page or going back to the dashboard.
            </p>
            {this.state.error && (
              <pre className={styles.errorDetail}>
                {this.state.error.message || 'Unknown error'}
              </pre>
            )}
            <div className={styles.actions}>
              <button className={styles.resetBtn} onClick={this.handleReset}>
                <RefreshCw size={16} style={{ marginRight: '6px' }} />
                Try Again
              </button>
              <button className={styles.reloadBtn} onClick={this.handleReload}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary