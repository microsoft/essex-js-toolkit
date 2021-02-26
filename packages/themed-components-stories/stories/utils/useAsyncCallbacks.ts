import { useMemo, useCallback } from 'react'
import { LocalEntity, NeighborLocalEntity, JoinData } from './types'
import {
	ILoadParams,
	INeighborCommunityDetail,
	CommunityId,
} from '@essex-js-toolkit/hierarchy-browser'

interface AsyncProps {
	nodes: LocalEntity[]
	edges: NeighborLocalEntity[]
	loadState?: boolean
	searchForChildren: (selection: string) => JoinData[][] | undefined
}
export function useAsyncCallbacks({
	nodes,
	edges,
	loadState,
	searchForChildren,
}: AsyncProps) {
	const allEntities = useMemo(() => [...nodes, ...edges], [nodes, edges])

	// Callback for HB to fetch entities in community based communityId
	const getEntities = useCallback(
		async (params: ILoadParams) => {
			if (allEntities) {
				const communityId = params.communityId
				const selection = allEntities.filter(
					(d: LocalEntity) => `${d.cid}` === communityId,
				)

				return { data: selection, error: undefined }
			}
			return { error: new Error('nodes not loaded in story'), data: undefined }
		},
		[allEntities],
	)

	// Callback for HB to fetch neighbor communities based communityId
	const getNeighbors = useCallback(
		async (params: ILoadParams) => {
			if (edges && allEntities && loadState) {
				const selected = edges.filter(
					d => `${d.neighbor}` === params.communityId,
				)
				const parents = selected.reduce((acc, e: NeighborLocalEntity) => {
					acc[e.cid] = acc[e.cid] ? acc[e.cid] + 1 : 1
					return acc
				}, {} as { [key: string]: number })
				const data = Object.keys(parents).map((key: string) => {
					const connections = parents[key]
					const edgeCommunityId = params.communityId
					const communityId = key as CommunityId
					const values = searchForChildren(communityId)
					let count = 0
					if (values) {
						count = values.reduce((counter, arr) => {
							counter = arr.length + counter
							return counter
						}, 0 as number)
					}
					return {
						communityId,
						edgeCommunityId,
						connections,
						size: count,
					} as INeighborCommunityDetail
				})
				return { data }
			}
			return { error: new Error('edges not loaded in story') }
		},
		[edges, allEntities, loadState, searchForChildren],
	)
	return [getEntities, getNeighbors]
}
