/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import {
	INeighborCommunityDetail,
	CommunityId,
	ICommunityDetail,
} from '@essex-js-toolkit/hierarchy-browser'
import { useMemo, useCallback } from 'react'
import { LocalEntity, NeighborLocalEntity, JoinData } from './types'

interface StaticProps {
	communities: ICommunityDetail[]
	nodes: LocalEntity[]
	edges: NeighborLocalEntity[]
	searchForChildren: (selection: string) => JoinData[][] | undefined
}

export function useStaticEntities({
	communities,
	edges,
	nodes,
	searchForChildren,
}: StaticProps): [INeighborCommunityDetail[], LocalEntity[]] {
	const allEntities = useMemo(() => [...nodes, ...edges], [nodes, edges])

	// Callback for HB to fetch neighbor communities based communityId
	const getNeighbors = useCallback(
		(communityId: string) => {
			if (edges && allEntities) {
				const selected = edges.filter(d => `${d.neighbor}` === communityId)
				const parents = selected.reduce((acc, e: NeighborLocalEntity) => {
					acc[e.cid] = acc[e.cid] ? acc[e.cid] + 1 : 1
					return acc
				}, {} as { [key: string]: number })
				const data = Object.keys(parents).map((key: string) => {
					const connections = parents[key]
					const edgeCommunityId = communityId
					const commID = key as CommunityId
					const values = searchForChildren(commID)
					let ids: string[] = []
					if (values) {
						const entities = values.reduce((totalEntities, arr) => {
							totalEntities = totalEntities.concat(arr)
							return totalEntities
						}, [] as JoinData[])
						ids = entities.map((d: JoinData) => d.nodeId)
					}
					return {
						communityId: commID,
						edgeCommunityId,
						connections,
						entityIds: ids,
						size: ids.length,
					} as INeighborCommunityDetail
				})
				return data
			}
			return []
		},
		[edges, allEntities, searchForChildren],
	)

	const neighborData = useMemo(() => {
		return communities.reduce((acc, d: ICommunityDetail) => {
			const adjNeighbors = getNeighbors(d.communityId)
			acc = [...acc, ...adjNeighbors]
			return acc
		}, [] as INeighborCommunityDetail[])
	}, [getNeighbors, communities])

	return [neighborData, allEntities]
}
