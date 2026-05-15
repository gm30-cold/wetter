import { useCallback, useEffect, useState } from 'react'
import { Coordinate } from '../types/forecast'
import { reverseGeocode } from '../api/openMeteo'

interface LocationState {
  coord: Coordinate | null
  placeName: string | null
  error: string | null
  loading: boolean
}

const STORAGE_KEY = 'wf:last-location'

export function useLocation() {
  const [state, setState] = useState<LocationState>(() => {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        return {
          coord: { latitude: parsed.latitude, longitude: parsed.longitude },
          placeName: parsed.name ?? null,
          error: null,
          loading: false,
        }
      } catch {
        // ignore
      }
    }
    return { coord: null, placeName: null, error: null, loading: false }
  })

  const setLocation = useCallback(
    (coord: Coordinate, name?: string | null) => {
      setState({ coord, placeName: name ?? null, error: null, loading: false })
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...coord, name: name ?? null })
      )
      if (!name) {
        reverseGeocode(coord).then((resolved) => {
          if (resolved) {
            setState((s) => ({ ...s, placeName: resolved }))
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ ...coord, name: resolved })
            )
          }
        })
      }
    },
    []
  )

  const requestGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'Geolocation wird nicht unterstützt.' }))
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      (err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error:
            err.code === 1
              ? 'Standort wurde blockiert. Erlaube ihn in den Browser-Einstellungen.'
              : 'Standort konnte nicht ermittelt werden.',
        }))
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 30 }
    )
  }, [setLocation])

  useEffect(() => {
    if (!state.coord) {
      requestGeolocation()
    }
  }, [])

  return { ...state, setLocation, requestGeolocation }
}
