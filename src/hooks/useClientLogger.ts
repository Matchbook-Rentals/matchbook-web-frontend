import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { 
  logClientDebug, 
  logClientInfo, 
  logClientWarn, 
  logClientError,
  logClientEvent,
  type ClientLogInput 
} from '@/app/actions/client-logs'

type DeviceType = 'ios' | 'android' | 'web'

/**
 * Hook for client-side logging, especially useful for mobile devices
 * Automatically includes the current pathname and detected device type
 */
export function useClientLogger() {
  const router = useRouter()
  const [deviceType, setDeviceType] = useState<DeviceType>('web')

  // Detect device type on mount - safe for SSR
  useEffect(() => {
    // Skip during SSR
    if (typeof navigator === 'undefined') return;
    
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios')
    } else if (/android/.test(userAgent)) {
      setDeviceType('android')
    } else {
      setDeviceType('web')
    }
  }, [])

  // Get current pathname - safely handles SSR
  const getCurrentPathname = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname
    }
    return undefined
  }, [])

  // Log methods with device and pathname automatically included
  const debug = useCallback(async (message: string, data?: any, metadata?: any) => {
    return await logClientDebug(message, data, {
      ...metadata,
      device: deviceType,
      pathname: getCurrentPathname(),
    })
  }, [deviceType, getCurrentPathname])

  const info = useCallback(async (message: string, data?: any, metadata?: any) => {
    return await logClientInfo(message, data, {
      ...metadata,
      device: deviceType,
      pathname: getCurrentPathname(),
    })
  }, [deviceType, getCurrentPathname])

  const warn = useCallback(async (message: string, data?: any, metadata?: any) => {
    return await logClientWarn(message, data, {
      ...metadata,
      device: deviceType,
      pathname: getCurrentPathname(),
    })
  }, [deviceType, getCurrentPathname])

  const error = useCallback(async (message: string, data?: any, metadata?: any) => {
    return await logClientError(message, data, {
      ...metadata,
      device: deviceType,
      pathname: getCurrentPathname(),
    })
  }, [deviceType, getCurrentPathname])

  // Raw log method for more control
  const log = useCallback(async (input: Omit<ClientLogInput, 'device' | 'pathname'>) => {
    return await logClientEvent({
      ...input,
      device: deviceType,
      pathname: getCurrentPathname(),
    })
  }, [deviceType, getCurrentPathname])

  return {
    debug,
    info,
    warn,
    error,
    log,
    deviceType,
  }
}