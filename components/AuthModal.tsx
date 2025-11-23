import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { resendEmailConfirmation } from '../services/auth'
import { toastError, toastSuccess } from '../services/utils'

export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { authLogin, authRegister } = useApp()
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await authLogin(email, password)
        onClose()
      } else if (mode === 'register') {
        await authRegister(email, password, username)
        setMessage('验证邮件已发送，请前往邮箱完成验证后再登录。')
        toastSuccess('验证邮件已发送')
        setMode('verify')
      }
    } catch {
      if (mode === 'login') {
        toastError('登录失败，请检查邮箱和密码')
      } else {
        toastError('注册失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{mode === 'login' ? '登录' : mode === 'register' ? '注册' : '邮箱验证'}</h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        {mode !== 'verify' && (
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('login')} className={`px-3 py-1 rounded ${mode==='login'?'bg-blue-50 text-primary':'bg-gray-100 text-gray-600'}`}>登录</button>
            <button onClick={() => setMode('register')} className={`px-3 py-1 rounded ${mode==='register'?'bg-blue-50 text-primary':'bg-gray-100 text-gray-600'}`}>注册</button>
          </div>
        )}
        {mode === 'verify' ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{message || '验证邮件已发送。请前往邮箱点击验证链接完成注册。'}</p>
            <div className="flex gap-2">
              <button onClick={async()=>{ setLoading(true); try { await resendEmailConfirmation(email); toastSuccess('验证邮件已重新发送') } catch { toastError('邮件发送失败，请稍后重试') } finally { setLoading(false) } }} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded">重新发送邮件</button>
              <button onClick={async()=>{ setLoading(true); try { await authLogin(email, password); onClose() } catch { toastError('登录失败，请检查邮箱和密码') } finally { setLoading(false) } }} className="flex-1 px-3 py-2 bg-primary text-white rounded">我已完成验证</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="用户名" className="w-full px-3 py-2 border rounded" required />
            )}
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱" className="w-full px-3 py-2 border rounded" required />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码" className="w-full px-3 py-2 border rounded" required />
            <button type="submit" disabled={loading} className="w-full px-3 py-2 bg-primary text-white rounded">{loading ? '提交中…' : '提交'}</button>
          </form>
        )}
      </div>
    </div>
  )
}