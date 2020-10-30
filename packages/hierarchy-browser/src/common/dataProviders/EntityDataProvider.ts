/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */

import {
	IEntityDetail,
	EntityId,
	ILoadParams,
	IHierarchyDataResponse,
} from '../..'
import { dedup } from '../../utils/utils'
import { ENTITY_TYPE } from '../types/types'

export class EntityDataProvider {
	private _entities: IEntityDetail[] = [] // all entities currently loaded
	private _displayEntities: IEntityDetail[] = [] // entities actually visible on screen
	private _filteredIds: Set<EntityId> = new Set([])
	private _entityType: ENTITY_TYPE
	private _size?: number
	private _loadEntitiesFromProvider: (
		params: ILoadParams,
		entity: ENTITY_TYPE,
	) => Promise<IHierarchyDataResponse | undefined>

	constructor(
		entityType: ENTITY_TYPE,
		size: number,
		handleLoading: (
			params: ILoadParams,
			entity: ENTITY_TYPE,
		) => Promise<IHierarchyDataResponse | undefined>,
	) {
		this._size = size === -1 ? undefined : size
		this._entityType = entityType
		this._loadEntitiesFromProvider = handleLoading
	}

	public clearDisplay(): void {
		this._displayEntities = []
	}

	private clearFilteredMap(): void {
		this._filteredIds = new Set([])
	}

	public clear(): void {
		this.clearDisplay()
		this.clearFilteredMap()
		this.clearEntities()
	}

	private clearEntities(): void {
		this._entities = []
	}
	public get entities(): IEntityDetail[] {
		return this._entities
	}
	private addToEntitiesArray(
		entities: IEntityDetail[],
		checkDups: boolean,
	): void {
		const all = this._entities.concat(entities)
		// debug if dups are present
		// by default is false to reduce compute
		if (checkDups) {
			this._entities = dedup(all)
		} else {
			this._entities = all
		}
	}
	public get displayEntities(): IEntityDetail[] {
		return this._displayEntities
	}

	public set displayEntities(display: IEntityDetail[]) {
		this._displayEntities = display
	}

	private getFilterEntitiesFromCache(): IEntityDetail[] {
		// get cached filtered IDS from Set
		const currentEntities = this._entities
		return currentEntities.reduce((acc, d) => {
			if (this._filteredIds.has(d.id)) {
				acc.push(d)
			}
			return acc
		}, [] as IEntityDetail[])
	}

	private async loadItemsAsync(
		params: ILoadParams,
	): Promise<IEntityDetail[] | undefined> {
		const nextNodes = await this._loadEntitiesFromProvider(
			params,
			this._entityType,
		)
		if (nextNodes) {
			if (!nextNodes.error && nextNodes.data) {
				const data = nextNodes.data.filter(d => d)
				return data
			} else {
				throw nextNodes.error
			}
		}
	}

	private async loadAndSaveItems(
		params: ILoadParams,
	): Promise<IEntityDetail[] | undefined> {
		const filtered = params.filtered
		// get data from either provider or async and cache ids if filtered
		const data = await this.loadItemsAsync(params)
		if (data) {
			if (filtered) {
				//store ids in map
				this._filteredIds = new Set(data.map(d => d.id))
			} else {
				this.addToEntitiesArray(data, false)
			}
		}
		return data
	}

	private async loadItems(
		params: ILoadParams,
		maxSize?: number,
	): Promise<IEntityDetail[]> {
		const { count, filtered, offset } = params
		const totalLength = count + offset
		const size = this._size || maxSize
		if (filtered) {
			if (
				this._filteredIds.size > 0 &&
				this._filteredIds.size <= totalLength &&
				this._entities.length > 0
			) {
				const filterEntities = this.getFilterEntitiesFromCache()
				this.displayEntities = filterEntities
			} else {
				const items = await this.loadAndSaveItems(params)
				if (items) {
					this.displayEntities = items
				}
			}
		} else {
			if (this._entities.length < totalLength) {
				if (size && this._entities.length < size) {
					await this.loadAndSaveItems(params)
				}
			}
			this.displayEntities = this._entities
		}
		const slice = [...this._displayEntities].slice(
			params.offset,
			params.count + params.offset,
		)
		return slice
	}

	public async getCommunityMembers(
		params: ILoadParams,
		maxSize?: number,
	): Promise<IEntityDetail[]> {
		try {
			if (maxSize) {
				// set size for neighbors on selection
				this._size = maxSize
			}
			// Get next nodes to load
			const entities = await this.loadItems(params, maxSize)
			return entities || []
		} catch (e) {
			throw Error(
				`Error: There is an issue loading entities for level ${params.level}, community ${params.communityId}`,
			)
		}
	}
}
