/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { useMemo, useState, useEffect, useCallback } from 'react'
import { HierarchyDataProvider } from '../common/dataProviders/HierachyDataProvider'
import {
	CommunityId,
	ICommunityDetail,
	IEntityDetail,
	IHierarchyNeighborResponse,
	ILoadEntitiesAsync,
	ILoadNeighborCommunitiesAsync,
	ILoadParams,
	INeighborCommunityDetail,
} from '../types'
export function useUpdatedHierarchyProvider(
	communities: ICommunityDetail[],
	hierachyDataProvider: HierarchyDataProvider,
	entities?: IEntityDetail[] | ILoadEntitiesAsync,
	neighbors?: INeighborCommunityDetail[] | ILoadNeighborCommunitiesAsync,
): [
	boolean,
	(
		params: ILoadParams,
		communityId: CommunityId,
	) => Promise<IHierarchyNeighborResponse>,
] {
	const [isNeighborsLoaded, setIsNeighborsLoaded] = useState<boolean>(false)
	useEffect(() => {
		hierachyDataProvider.updateCommunities(communities)
	}, [communities, hierachyDataProvider])
	useMemo(() => {
		hierachyDataProvider.updateEntities(entities)
	}, [entities, hierachyDataProvider])

	useEffect(() => {
		const isLoaded = hierachyDataProvider.updateNeighbors(neighbors)
		setIsNeighborsLoaded(isLoaded) // trigger neighbor refresh
	}, [neighbors, hierachyDataProvider])

	const neighborCallback = useCallback(
		async (
			params: ILoadParams,
			communityId: CommunityId,
		): Promise<IHierarchyNeighborResponse> => {
			return await hierachyDataProvider.getNeighborsAtLevel(params, communityId)
		},
		[hierachyDataProvider],
	)
	return [isNeighborsLoaded, neighborCallback]
}
