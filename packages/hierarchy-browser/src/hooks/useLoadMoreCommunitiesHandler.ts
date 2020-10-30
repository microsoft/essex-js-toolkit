/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { useCallback } from 'react'
import { INeighborCommunityDetail } from '..'
import {
	CommunityDataProvider,
	DEFAULT_LOAD_COUNT,
} from '../common/dataProviders'
export function useLoadMoreCommunitiesHandler(
	communities: INeighborCommunityDetail[],
	moreToLoad: boolean,
	setMoreToLoad: (value: boolean) => void,
	handleEntitiesLoaded: (
		communities: INeighborCommunityDetail[],
		error?: Error | string | undefined,
	) => void,
	dataProvider?: CommunityDataProvider,
): () => void {
	return useCallback(() => {
		const offset = communities.length
		if (!moreToLoad || !dataProvider) {
			return
		}
		dataProvider
			.getAdjacentCommunities(offset, DEFAULT_LOAD_COUNT)
			.then(moreCommunities => {
				if (moreCommunities && moreCommunities.length > 0) {
					if (moreCommunities.length < DEFAULT_LOAD_COUNT) {
						setMoreToLoad(false)
					}
					handleEntitiesLoaded([...communities, ...moreCommunities], undefined)
				} else {
					setMoreToLoad(false)
				}
			})
			.catch(err => {
				setMoreToLoad(false)
				handleEntitiesLoaded([], err)
			})
	}, [
		dataProvider,
		moreToLoad,
		setMoreToLoad,
		handleEntitiesLoaded,
		communities,
	])
}
