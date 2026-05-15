import { useEffect, useState } from 'react'
import { Coordinate } from '../types/forecast'
import { ModelWeights, WARMSTART_WEIGHTS } from '../fusion/engine'
import { LearnResult, updateWeightsAsync, weightsFor } from '../fusion/learner'

interface State {
  weights: ModelWeights
  isLearning: boolean
  lastLearned: LearnResult | null
}

export function useLearnedWeights(coord: Coordinate | null): State {
  const [state, setState] = useState<State>({
    weights: coord ? weightsFor(coord) : WARMSTART_WEIGHTS,
    isLearning: false,
    lastLearned: null,
  })

  useEffect(() => {
    if (!coord) return
    setState({
      weights: weightsFor(coord),
      isLearning: true,
      lastLearned: null,
    })
    updateWeightsAsync(coord)
      .then((result) => {
        if (!result) {
          setState((s) => ({ ...s, isLearning: false }))
          return
        }
        setState({
          weights: result.weights,
          isLearning: false,
          lastLearned: result,
        })
      })
      .catch(() => {
        setState((s) => ({ ...s, isLearning: false }))
      })
  }, [coord?.latitude, coord?.longitude])

  return state
}
